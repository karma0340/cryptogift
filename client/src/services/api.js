const API_BASE = 'http://localhost:5000/api';

const api = {
    /**
     * Create a new order
     */
    async createOrder({ brandId, brandName, amount, currency, discountPercent, cryptoCurrency, email }) {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandId, brandName, amount, currency, discountPercent, cryptoCurrency, email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create order');
        return data.data;
    },

    /**
     * Get order by ID
     */
    async getOrder(orderId) {
        const res = await fetch(`${API_BASE}/orders/${orderId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Order not found');
        return data.data;
    },

    /**
     * Get all orders (optionally by email)
     */
    async getOrders(email = '', page = 1) {
        const params = new URLSearchParams({ page });
        if (email) params.append('email', email);
        const res = await fetch(`${API_BASE}/orders?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch orders');
        return data.data;
    },

    /**
     * Simulate payment (for demo)
     */
    async simulatePayment(orderId) {
        const res = await fetch(`${API_BASE}/payments/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Simulation failed');
        return data.data;
    },

    /**
     * Get crypto price estimate
     */
    async getEstimate(amount, from = 'usd', to = 'btc') {
        const res = await fetch(`${API_BASE}/payments/estimate?amount=${amount}&from=${from}&to=${to}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Estimate failed');
        return data.data;
    },

    /**
     * Get gift card catalog
     */
    async getGiftCards(category = '', search = '') {
        const params = new URLSearchParams();
        if (category && category !== 'All') params.append('category', category);
        if (search) params.append('search', search);
        const res = await fetch(`${API_BASE}/giftcards?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch gift cards');
        return data.data;
    },

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            const data = await res.json();
            return data.status === 'ok';
        } catch {
            return false;
        }
    },
};

export default api;
