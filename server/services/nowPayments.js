const axios = require('axios');
const config = require('../config/env');

class NowPaymentsService {
    constructor() {
        const baseUrl = config.nodeEnv === 'production'
            ? config.nowPayments.baseUrl
            : config.nowPayments.sandboxBaseUrl;

        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                'x-api-key': config.nowPayments.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get available cryptocurrencies
     */
    async getAvailableCurrencies() {
        try {
            const { data } = await this.api.get('/currencies');
            return data.currencies;
        } catch (error) {
            console.error('NOWPayments - Failed to get currencies:', error.message);
            // Return default list as fallback
            return ['btc', 'eth', 'usdttrc20', 'sol', 'bnb'];
        }
    }

    /**
     * Get estimated price for a given amount
     * @param {number} amount - Amount in fiat
     * @param {string} currencyFrom - Fiat currency (usd, inr, etc.)
     * @param {string} currencyTo - Crypto currency (btc, eth, etc.)
     */
    async getEstimatedPrice(amount, currencyFrom = 'usd', currencyTo = 'btc') {
        try {
            const { data } = await this.api.get('/estimate', {
                params: {
                    amount,
                    currency_from: currencyFrom,
                    currency_to: currencyTo,
                },
            });
            return data;
        } catch (error) {
            console.error('NOWPayments - Failed to get estimate:', error.message);
            throw new Error('Failed to get crypto price estimate');
        }
    }

    /**
     * Create a payment
     * @param {object} params
     * @param {number} params.priceAmount - Amount in fiat
     * @param {string} params.priceCurrency - Fiat currency (usd)
     * @param {string} params.payCurrency - Crypto to pay with (btc)
     * @param {string} params.orderId - Your order ID
     * @param {string} params.orderDescription - Description
     */
    async createPayment({ priceAmount, priceCurrency, payCurrency, orderId, orderDescription }) {
        try {
            const { data } = await this.api.post('/payment', {
                price_amount: priceAmount,
                price_currency: priceCurrency,
                pay_currency: payCurrency,
                order_id: orderId,
                order_description: orderDescription,
                ipn_callback_url: `${config.frontendUrl}/api/payments/webhook`,
            });

            return {
                paymentId: data.payment_id,
                paymentStatus: data.payment_status,
                payAddress: data.pay_address,
                payAmount: data.pay_amount,
                payCurrency: data.pay_currency,
                expirationEstimate: data.expiration_estimate_date,
            };
        } catch (error) {
            console.error('NOWPayments - Failed to create payment:', error.response?.data || error.message);
            throw new Error('Failed to create crypto payment');
        }
    }

    /**
     * Get payment status
     * @param {string} paymentId - NOWPayments payment ID
     */
    async getPaymentStatus(paymentId) {
        try {
            const { data } = await this.api.get(`/payment/${paymentId}`);
            return {
                paymentId: data.payment_id,
                status: data.payment_status,
                payAmount: data.pay_amount,
                actuallyPaid: data.actually_paid,
                payCurrency: data.pay_currency,
            };
        } catch (error) {
            console.error('NOWPayments - Failed to get status:', error.message);
            throw new Error('Failed to get payment status');
        }
    }

    /**
     * Verify IPN webhook signature
     * @param {object} payload - Webhook payload
     * @param {string} signature - x-nowpayments-sig header
     */
    verifyWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha512', config.nowPayments.ipnSecret);

        // Sort payload keys
        const sortedPayload = Object.keys(payload)
            .sort()
            .reduce((result, key) => {
                result[key] = payload[key];
                return result;
            }, {});

        hmac.update(JSON.stringify(sortedPayload));
        const calculatedSignature = hmac.digest('hex');
        return calculatedSignature === signature;
    }
}

// Singleton
module.exports = new NowPaymentsService();
