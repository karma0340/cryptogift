const axios = require('axios');
const config = require('../config/env');

class TremendousService {
    constructor() {
        this.baseUrl = config.tremendous.baseUrl || 'https://testflight.tremendous.com/api/v2';
        this.apiKey = config.tremendous.apiKey;
    }

    get isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Get axios instance with auth
     */
    getApi() {
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }

    /**
     * List campaigns or products (Tremendous uses Campaigns to define available rewards)
     */
    async getCampaigns() {
        try {
            const api = this.getApi();
            const { data } = await api.get('/campaigns');
            return data.campaigns;
        } catch (error) {
            console.error('Tremendous - Failed to get campaigns:', error.response?.data || error.message);
            throw new Error('Failed to fetch gift card providers');
        }
    }

    /**
     * Create an order (Tremendous Reward)
     * @param {object} params
     * @param {string} params.recipientEmail - Customer email
     * @param {string} params.recipientName - Customer name (optional)
     * @param {number} params.amount - Amount in USD
     * @param {string} params.orderId - Internal Order ID for tracking
     */
    async createReward({ recipientEmail, recipientName = 'Customer', amount, orderId }) {
        if (!this.isConfigured) {
            console.warn('Tremendous - API Key not set. Using mock fulfillment.');
            return this.mockFulfillment(orderId, amount);
        }

        try {
            const api = this.getApi();

            // Create a "Reward" (Gift Card)
            // Note: In Tremendous, you usually fund a "Campaign" first.
            const response = await api.post('/rewards', {
                campaign_id: process.env.TREMENDOUS_CAMPAIGN_ID, // You need to set this in Vercel
                payment_source_id: process.env.TREMENDOUS_FUNDING_ID, // Your balance/funding source
                delivery: {
                    method: 'EMAIL',
                },
                recipient: {
                    name: recipientName,
                    email: recipientEmail,
                },
                reward: {
                    value: amount,
                    currency_code: 'USD',
                },
                external_id: orderId, // Link to your internal order
            });

            return {
                id: response.data.reward.id,
                status: response.data.reward.status,
                deliveryStatus: response.data.reward.delivery_status,
                // Tremendous usually handles the email delivery itself
            };
        } catch (error) {
            console.error('Tremendous - Failed to create reward:', error.response?.data || error.message);
            throw new Error(`Tremendous API Error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }

    /**
     * Fallback mock for demos if API is not fully set up
     */
    mockFulfillment(orderId, amount) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return {
            id: `MOCK-${orderId}`,
            status: 'COMPLETED',
            redeemCode: code,
            pinCode: Math.floor(1000 + Math.random() * 9000).toString()
        };
    }
}

module.exports = new TremendousService();
