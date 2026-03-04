const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : window.location.origin.includes('cryptogift-jj7h')
        ? '/api'
        : 'https://cryptogift-jj7h.vercel.app/api';

const api = {
    /**
     * Create a new order
     */
    async createOrder({ brandId, brandName, amount, totalAmount, processingFee, currency, cryptoCurrency, email }) {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandId, brandName, amount, totalAmount, processingFee, currency, cryptoCurrency, email }),
        });

        // Handle non-OK responses
        if (!res.ok) {
            let errorMsg = 'Failed to create order';
            try {
                const errorData = await res.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // Fallback if not JSON
                errorMsg = `Server Error: ${res.status} ${res.statusText}`;
            }
            throw new Error(errorMsg);
        }

        const data = await res.json();
        return data.data;
    },

    /**
     * Get order by ID
     */
    async getOrder(orderId) {
        const res = await fetch(`${API_BASE}/orders/${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        return data.data;
    },

    /**
     * Get all orders (optionally by email)
     */
    async getOrders(email = '', page = 1) {
        const params = new URLSearchParams({ page });
        if (email) params.append('email', email);
        const res = await fetch(`${API_BASE}/orders?${params}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
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
        if (!res.ok) throw new Error('Simulation failed');
        const data = await res.json();
        return data.data;
    },

    /**
     * Get crypto price estimate
     */
    async getEstimate(amount, from = 'usd', to = 'btc') {
        const res = await fetch(`${API_BASE}/payments/estimate?amount=${amount}&from=${from}&to=${to}`);
        if (!res.ok) throw new Error('Estimate failed');
        const data = await res.json();
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
        if (!res.ok) throw new Error('Failed to fetch gift cards');
        const data = await res.json();
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

    /**
     * Admin: Login
     */
    async adminLogin(password) {
        const res = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Login failed');
        return data.token;
    },

    /**
     * Admin: Get Stats
     */
    async getAdminStats(token) {
        const res = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch stats');
        return data.data;
    },

    /**
     * Admin: Get Orders
     */
    async getAdminOrders(token, page = 1, limit = 20, status = 'all') {
        const res = await fetch(`${API_BASE}/admin/orders?page=${page}&limit=${limit}&status=${status}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch admin orders');
        return data.data;
    },

    /**
     * Update order email
     */
    async updateOrderEmail(orderId, email) {
        const res = await fetch(`${API_BASE}/orders/${orderId}/email`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update email');
        return data.data;
    },

    /**
     * Admin: Fulfill Order
     */
    async fulfillAdminOrder(token, orderId, giftCardCode, giftCardPin = null) {
        const res = await fetch(`${API_BASE}/admin/orders/${orderId}/fulfill`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ giftCardCode, giftCardPin }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fulfill order');
        return data.data;
    }
};

export default api;
