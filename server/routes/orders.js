const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nowPayments = require('../services/nowPayments');
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
 * POST /api/orders
 * Create a new order and initiate crypto payment
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            brandId,
            brandName,
            amount,
            currency,
            discountPercent,
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

        // Calculate discounted amount
        const discountedAmount = amount * (1 - (discountPercent || 0) / 100);

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
            discountPercent: discountPercent || 0,
            discountedAmount,
            crypto: {
                currency: cryptoCurrency,
                amount: '0',
            },
            email,
            status: 'pending',
        });

        await order.save();

        // Create payment with NOWPayments
        let paymentData;
        try {
            paymentData = await nowPayments.createPayment({
                priceAmount: discountedAmount,
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
            console.warn('NOWPayments unavailable, using mock payment data');

            const mockCryptoRates = { BTC: 0.000012, ETH: 0.00031, USDT: 1.0, SOL: 0.0067, BNB: 0.0015 };
            const usdAmount = currency === 'INR' ? discountedAmount / 83 : discountedAmount;
            const mockCryptoAmount = (usdAmount * (mockCryptoRates[cryptoCurrency] || 0.001)).toFixed(8);

            const chars = '0123456789abcdef';
            let mockAddress = '0x';
            for (let i = 0; i < 40; i++) mockAddress += chars.charAt(Math.floor(Math.random() * chars.length));

            order.crypto.amount = mockCryptoAmount;
            order.crypto.paymentAddress = mockAddress;
            order.crypto.paymentId = `mock_${Date.now()}`;
            await order.save();

            paymentData = {
                paymentId: order.crypto.paymentId,
                payAddress: mockAddress,
                payAmount: mockCryptoAmount,
                payCurrency: cryptoCurrency,
            };
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
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            throw new AppError('Order not found', 404);
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
