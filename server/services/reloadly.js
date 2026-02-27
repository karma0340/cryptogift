const axios = require('axios');
const config = require('../config/env');

class ReloadlyService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.baseUrl = config.reloadly.baseUrl;
    }

    /**
     * Get OAuth access token from Reloadly
     */
    async authenticate() {
        // Return cached token if still valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const { data } = await axios.post(config.reloadly.authUrl, {
                client_id: config.reloadly.clientId,
                client_secret: config.reloadly.clientSecret,
                grant_type: 'client_credentials',
                audience: this.baseUrl,
            });

            this.accessToken = data.access_token;
            // Expire 5 minutes early to be safe
            this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

            return this.accessToken;
        } catch (error) {
            console.error('Reloadly - Authentication failed:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with gift card provider');
        }
    }

    /**
     * Get API instance with auth headers
     */
    async getApi() {
        const token = await this.authenticate();
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/com.reloadly.giftcards-v1+json',
            },
        });
    }

    /**
     * Get all available gift card products
     * @param {number} page - Page number
     * @param {number} size - Items per page
     */
    async getProducts(page = 1, size = 50) {
        try {
            const api = await this.getApi();
            const { data } = await api.get('/products', {
                params: { page, size },
            });
            return data;
        } catch (error) {
            console.error('Reloadly - Failed to get products:', error.message);
            throw new Error('Failed to fetch gift card products');
        }
    }

    /**
     * Get a specific gift card product by ID
     * @param {number} productId - Reloadly product ID
     */
    async getProduct(productId) {
        try {
            const api = await this.getApi();
            const { data } = await api.get(`/products/${productId}`);
            return data;
        } catch (error) {
            console.error('Reloadly - Failed to get product:', error.message);
            throw new Error('Failed to fetch gift card product');
        }
    }

    /**
     * Order a gift card
     * @param {object} params
     * @param {number} params.productId - Reloadly product ID
     * @param {number} params.quantity - Number of cards
     * @param {number} params.unitPrice - Price per card
     * @param {string} params.customIdentifier - Your order ID
     * @param {string} params.recipientEmail - Email to send gift card to
     */
    async orderGiftCard({ productId, quantity = 1, unitPrice, customIdentifier, recipientEmail }) {
        try {
            const api = await this.getApi();
            const { data } = await api.post('/orders', {
                productId,
                quantity,
                unitPrice,
                customIdentifier,
                senderName: 'CryptoGift',
                recipientEmail,
                recipientPhoneDetails: {},
            });

            return {
                transactionId: data.transactionId,
                status: data.status,
                product: data.product,
                recipientEmail: data.recipientEmail,
                // The redemption code
                redeemCode: data.redeemCode1 || data.redeemCode,
                pinCode: data.pinCode,
            };
        } catch (error) {
            console.error('Reloadly - Failed to order gift card:', error.response?.data || error.message);
            throw new Error('Failed to purchase gift card');
        }
    }

    /**
     * Get order by transaction ID
     * @param {string} transactionId
     */
    async getOrder(transactionId) {
        try {
            const api = await this.getApi();
            const { data } = await api.get(`/orders/transactions/${transactionId}`);
            return data;
        } catch (error) {
            console.error('Reloadly - Failed to get order:', error.message);
            throw new Error('Failed to fetch gift card order');
        }
    }

    /**
     * Get account balance
     */
    async getBalance() {
        try {
            const api = await this.getApi();
            const { data } = await api.get('/accounts/balance');
            return data;
        } catch (error) {
            console.error('Reloadly - Failed to get balance:', error.message);
            throw new Error('Failed to fetch account balance');
        }
    }
}

// Singleton
module.exports = new ReloadlyService();
