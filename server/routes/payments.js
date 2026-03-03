const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nowPayments = require('../services/nowPayments');
const tremendous = require('../services/tremendous');
const emailService = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/payments/webhook
 * NOWPayments IPN (Instant Payment Notification) webhook
 */
router.post('/webhook', async (req, res, next) => {
    try {
        const payload = req.body;
        const signature = req.headers['x-nowpayments-sig'];

        if (process.env.NODE_ENV === 'production' && signature) {
            const isValid = nowPayments.verifyWebhookSignature(payload, signature);
            if (!isValid) {
                console.warn('Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const { payment_status, order_id } = payload;
        const order = await Order.findOne({ orderId: order_id });

        if (!order) {
            return res.status(200).json({ success: true });
        }

        switch (payment_status) {
            case 'confirming':
            case 'confirmed':
            case 'sending':
                if (order.status !== 'payment_received') {
                    order.status = 'payment_received';
                    order.paidAt = new Date();
                    await order.save();
                    emailService.sendAdminOrderNotification(order).catch(e =>
                        console.error('Admin notification failed:', e.message)
                    );
                }
                break;

            case 'finished':
                if (order.status !== 'completed' && order.status !== 'processing') {
                    order.status = 'processing';
                    order.paidAt = order.paidAt || new Date();
                    await order.save();

                    // Note: For Tremendous, we keep it in 'processing' so admin can fulfill manually 
                    // or we can enable auto-fulfillment below if API key is set.
                    if (tremendous.isConfigured) {
                        try {
                            await purchaseGiftCard(order);
                        } catch (err) {
                            console.error('Auto-fulfillment failed:', err.message);
                        }
                    }
                }
                break;

            case 'failed':
            case 'expired':
                order.status = 'failed';
                await order.save();
                break;
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ success: true });
    }
});

/**
 * POST /api/payments/simulate
 */
router.post('/simulate', async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ orderId });
        if (!order) throw new AppError('Order not found', 404);

        order.status = 'payment_received';
        order.paidAt = new Date();
        await order.save();

        // Simulate processing then fulfill
        setTimeout(async () => {
            try {
                const result = tremendous.mockFulfillment(order.orderId, order.amount);
                order.giftCardCode = result.redeemCode;
                order.giftCardPin = result.pinCode;
                order.status = 'completed';
                order.completedAt = new Date();
                await order.save();
                await emailService.sendGiftCardEmail(order);
            } catch (err) {
                console.error('Simulation error:', err);
            }
        }, 3000);

        res.json({ success: true, message: 'Simulation started' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/payments/estimate
 */
router.get('/estimate', async (req, res, next) => {
    try {
        const { amount, from = 'usd', to = 'btc' } = req.query;
        let estimate;
        try {
            estimate = await nowPayments.getEstimatedPrice(
                parseFloat(amount), from.toLowerCase(), to.toLowerCase()
            );
        } catch (err) {
            const mockRates = { btc: 0.000012, eth: 0.00031, usdttrc20: 1.0, sol: 0.0067, bnb: 0.0015 };
            estimate = {
                estimated_amount: (parseFloat(amount) * (mockRates[to.toLowerCase()] || 0.001)).toFixed(8),
                currency_from: from,
                currency_to: to,
            };
        }
        res.json({ success: true, data: estimate });
    } catch (error) {
        next(error);
    }
});

/**
 * Purchase gift card via Tremendous
 */
async function purchaseGiftCard(order) {
    try {
        const result = await tremendous.createReward({
            recipientEmail: order.email,
            amount: order.amount,
            orderId: order.orderId
        });

        // If it returns a code (mock or some specific products)
        if (result.redeemCode) {
            order.giftCardCode = result.redeemCode;
            order.giftCardPin = result.pinCode;
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
            await emailService.sendGiftCardEmail(order);
        } else {
            // Tremendous handles delivery via email themselves for real rewards
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
        }
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = router;
