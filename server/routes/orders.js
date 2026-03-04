const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nowPayments = require('../services/nowPayments');
const tremendous = require('../services/tremendous');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/orders
 * Get all orders (optionally filter by email)
 */
router.get('/', async (req, res, next) => {
    try {
        const { email, status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (email) query.email = email.toLowerCase();
        if (status) query.status = status;

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    orderId: order.orderId,
                    brand: order.brand,
                    amount: order.amount,
                    currency: order.currency,
                    crypto: {
                        currency: order.crypto.currency,
                        amount: order.crypto.amount,
                    },
                    status: order.status,
                    giftCardCode: order.status === 'completed' ? order.giftCardCode : null,
                    createdAt: order.createdAt,
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/orders/:orderId/email
 * Update the customer email on an existing order
 */
router.patch('/:orderId/email', async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const order = await Order.findOneAndUpdate(
            { orderId },
            { email: email.toLowerCase().trim() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, data: { orderId: order.orderId, email: order.email } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/orders
 * Create a new order and initiate crypto payment
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            brandId,
            brandName,
            amount,
            totalAmount,
            processingFee,
            currency,
            cryptoCurrency,
            email,
        } = req.body;

        // Validation
        if (!brandId || !brandName || !amount || !currency || !cryptoCurrency || !email) {
            throw new AppError('Missing required fields', 400);
        }

        if (amount <= 0) {
            throw new AppError('Amount must be greater than 0', 400);
        }

        // All fees removed as per user request
        const chargeAmount = amount;
        const fee = 0;

        // Map crypto currency names to NOWPayments format
        const cryptoMap = {
            BTC: 'btc',
            ETH: 'eth',
            USDT: 'usdttrc20',
            SOL: 'sol',
            BNB: 'bnb',
        };

        // Create the order in DB first
        const order = new Order({
            brand: { id: brandId, name: brandName },
            amount,
            currency,
            discountPercent: 0,
            discountedAmount: chargeAmount, // total charge including fee
            processingFee: fee,
            crypto: {
                currency: cryptoCurrency,
                amount: '0',
            },
            email,
            status: 'pending',
        });

        await order.save();

        // Create payment with NOWPayments for the FULL charge amount (incl. fee)
        let paymentData;
        try {
            paymentData = await nowPayments.createPayment({
                priceAmount: chargeAmount,
                priceCurrency: currency.toLowerCase(),
                payCurrency: cryptoMap[cryptoCurrency] || cryptoCurrency.toLowerCase(),
                orderId: order.orderId,
                orderDescription: `${brandName} ${currency} ${amount} Gift Card`,
            });

            order.crypto.amount = paymentData.payAmount.toString();
            order.crypto.paymentAddress = paymentData.payAddress;
            order.crypto.paymentId = paymentData.paymentId.toString();
            await order.save();
        } catch (paymentError) {
            // NOWPayments failed - clean up the order and return a real error
            console.error('NOWPayments failed:', paymentError.message);
            await Order.findByIdAndDelete(order._id); // remove the orphan order

            // Check if it's a known error from the service
            const errorMsg = paymentError.response?.data?.message || paymentError.message;
            return res.status(503).json({
                success: false,
                error: `Payment gateway error: ${errorMsg}`,
            });
        }

        res.status(201).json({
            success: true,
            data: {
                orderId: order.orderId,
                status: order.status,
                payment: {
                    paymentId: paymentData.paymentId,
                    address: paymentData.payAddress,
                    amount: paymentData.payAmount,
                    currency: cryptoCurrency,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/orders/:orderId
 * Get order details by order ID
 */
router.get('/:orderId', async (req, res, next) => {
    try {
        let order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // AUTO-SYNC: If order is not completed, double check with NOWPayments
        if (order.status !== 'completed' && order.status !== 'failed' && order.crypto.paymentId && !order.crypto.paymentId.startsWith('mock_')) {
            try {
                const statusData = await nowPayments.getPaymentStatus(order.crypto.paymentId);

                // Use the new tremendous service for fulfillment
                if (statusData.status === 'finished' && order.status !== 'completed') {
                    console.log(`Auto-sync: Order ${order.orderId} found as FINISHED. Fulfilling...`);

                    const result = await tremendous.createReward({
                        recipientEmail: order.email,
                        amount: order.amount,
                        orderId: order.orderId
                    });

                    if (result.redeemCode) {
                        order.giftCardCode = result.redeemCode;
                        order.giftCardPin = result.pinCode;
                    }
                    order.status = 'completed';
                    order.completedAt = new Date();
                    await order.save();

                    // Send email
                    const emailService = require('../services/emailService');
                    try {
                        await emailService.sendGiftCardEmail(order);
                    } catch (emailErr) {
                        console.error('Auto-sync email failed:', emailErr.message);
                    }
                } else if (['confirming', 'confirmed', 'sending'].includes(statusData.status)) {
                    order.status = 'payment_received';
                    await order.save();
                }
            } catch (syncErr) {
                console.warn('Auto-sync failed (likely API limit or invalid ID):', syncErr.message);
            }
        }

        res.json({
            success: true,
            data: {
                orderId: order.orderId,
                brand: order.brand,
                amount: order.amount,
                currency: order.currency,
                discountedAmount: order.discountedAmount,
                crypto: {
                    currency: order.crypto.currency,
                    amount: order.crypto.amount,
                    address: order.crypto.paymentAddress,
                },
                email: order.email,
                status: order.status,
                giftCardCode: order.status === 'completed' ? order.giftCardCode : null,
                createdAt: order.createdAt,
                completedAt: order.completedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
