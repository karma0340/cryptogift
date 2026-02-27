const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nowPayments = require('../services/nowPayments');
const reloadly = require('../services/reloadly');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/payments/webhook
 * NOWPayments IPN (Instant Payment Notification) webhook
 * Called when a crypto payment status changes
 */
router.post('/webhook', async (req, res, next) => {
    try {
        const payload = req.body;
        const signature = req.headers['x-nowpayments-sig'];

        // Verify webhook signature (skip in dev/sandbox)
        if (process.env.NODE_ENV === 'production' && signature) {
            const isValid = nowPayments.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                console.warn('Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        console.log('Payment webhook received:', {
            paymentId: payload.payment_id,
            status: payload.payment_status,
            orderId: payload.order_id,
        });

        const { payment_status, order_id, payment_id } = payload;

        // Find the order
        const order = await Order.findOne({ orderId: order_id });
        if (!order) {
            console.warn(`Order not found for webhook: ${order_id}`);
            return res.status(200).json({ success: true }); // Return 200 to stop retries
        }

        // Update status based on payment status
        switch (payment_status) {
            case 'confirming':
            case 'confirmed':
            case 'sending':
                order.status = 'payment_received';
                order.paidAt = new Date();
                await order.save();
                break;

            case 'finished':
                // Payment complete — now buy the gift card!
                order.status = 'processing';
                order.paidAt = order.paidAt || new Date();
                await order.save();

                // Attempt to purchase gift card
                try {
                    await purchaseGiftCard(order);
                } catch (giftCardError) {
                    console.error('Failed to purchase gift card:', giftCardError.message);
                    order.status = 'failed';
                    await order.save();
                }
                break;

            case 'failed':
            case 'expired':
                order.status = 'failed';
                await order.save();
                break;

            case 'refunded':
                order.status = 'refunded';
                await order.save();
                break;
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ success: true }); // Always return 200
    }
});

/**
 * POST /api/payments/simulate
 * Simulate a payment confirmation (for demo/testing)
 */
router.post('/simulate', async (req, res, next) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            throw new AppError('Order ID is required', 400);
        }

        const order = await Order.findOne({ orderId });
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.status !== 'pending') {
            throw new AppError(`Order is already ${order.status}`, 400);
        }

        // Simulate payment received
        order.status = 'payment_received';
        order.paidAt = new Date();
        await order.save();

        // Simulate processing delay, then generate mock gift card
        setTimeout(async () => {
            try {
                order.status = 'processing';
                await order.save();

                // Generate mock gift card code
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let code = '';
                for (let i = 0; i < 16; i++) {
                    if (i > 0 && i % 4 === 0) code += '-';
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                order.giftCardCode = code;
                order.giftCardPin = Math.floor(1000 + Math.random() * 9000).toString();
                order.status = 'completed';
                order.completedAt = new Date();
                await order.save();

                console.log(`Order ${orderId} completed with code: ${code}`);
            } catch (err) {
                console.error('Simulation error:', err);
            }
        }, 3000);

        res.json({
            success: true,
            message: 'Payment simulation started. Order will be completed in ~3 seconds.',
            data: { orderId: order.orderId, status: 'payment_received' },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/estimate
 * Get crypto price estimate
 */
router.get('/estimate', async (req, res, next) => {
    try {
        const { amount, from = 'usd', to = 'btc' } = req.query;

        if (!amount) {
            throw new AppError('Amount is required', 400);
        }

        let estimate;
        try {
            estimate = await nowPayments.getEstimatedPrice(
                parseFloat(amount),
                from.toLowerCase(),
                to.toLowerCase()
            );
        } catch (err) {
            // Fallback to mock estimate
            const mockRates = { btc: 0.000012, eth: 0.00031, usdttrc20: 1.0, sol: 0.0067, bnb: 0.0015 };
            estimate = {
                estimated_amount: (parseFloat(amount) * (mockRates[to.toLowerCase()] || 0.001)).toFixed(8),
                currency_from: from,
                currency_to: to,
            };
        }

        res.json({
            success: true,
            data: estimate,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Purchase gift card from Reloadly after payment is confirmed
 */
async function purchaseGiftCard(order) {
    try {
        const result = await reloadly.orderGiftCard({
            productId: order.brand.id,
            quantity: 1,
            unitPrice: order.discountedAmount,
            customIdentifier: order.orderId,
            recipientEmail: order.email,
        });

        order.giftCardCode = result.redeemCode;
        order.giftCardPin = result.pinCode;
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();

        console.log(`Gift card purchased for order ${order.orderId}: ${result.redeemCode}`);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = router;
