const express = require('express');
const router = express.Router();
const reloadly = require('../services/reloadly');
const { AppError } = require('../middleware/errorHandler');

// In-memory fallback data when Reloadly API is unavailable
const fallbackProducts = [
    { id: 'amazon', name: 'Amazon', category: 'Shopping', denominations: [10, 25, 50, 100, 200, 500], currency: 'USD' },
    { id: 'flipkart', name: 'Flipkart', category: 'Shopping', denominations: [500, 1000, 2000, 5000], currency: 'INR' },
    { id: 'ebay', name: 'eBay', category: 'Shopping', denominations: [10, 25, 50, 100, 200], currency: 'USD' },
    { id: 'steam', name: 'Steam', category: 'Gaming', denominations: [5, 10, 20, 50, 100], currency: 'USD' },
    { id: 'playstation', name: 'PlayStation', category: 'Gaming', denominations: [10, 25, 50, 75, 100], currency: 'USD' },
    { id: 'xbox', name: 'Xbox', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD' },
    { id: 'netflix', name: 'Netflix', category: 'Entertainment', denominations: [15, 25, 50, 100], currency: 'USD' },
    { id: 'spotify', name: 'Spotify', category: 'Entertainment', denominations: [10, 30, 60], currency: 'USD' },
    { id: 'apple', name: 'Apple', category: 'Entertainment', denominations: [10, 25, 50, 100, 200], currency: 'USD' },
    { id: 'google-play', name: 'Google Play', category: 'Entertainment', denominations: [10, 15, 25, 50, 100], currency: 'USD' },
    { id: 'uber', name: 'Uber', category: 'Food & Delivery', denominations: [15, 25, 50, 100], currency: 'USD' },
    { id: 'doordash', name: 'DoorDash', category: 'Food & Delivery', denominations: [10, 25, 50, 100], currency: 'USD' },
];

/**
 * GET /api/giftcards
 * Get available gift card products
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, search, page = 1, limit = 50 } = req.query;

        let products;
        try {
            products = await reloadly.getProducts(parseInt(page), parseInt(limit));
        } catch (err) {
            console.warn('Reloadly unavailable, using fallback data');
            products = fallbackProducts;
        }

        // Filter
        let filtered = Array.isArray(products) ? products : products.content || fallbackProducts;

        if (category && category !== 'All') {
            filtered = filtered.filter(p =>
                (p.category || '').toLowerCase() === category.toLowerCase()
            );
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name || p.productName || '').toLowerCase().includes(q)
            );
        }

        res.json({
            success: true,
            data: {
                products: filtered,
                total: filtered.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/giftcards/:productId
 * Get a specific gift card product
 */
router.get('/:productId', async (req, res, next) => {
    try {
        let product;
        try {
            product = await reloadly.getProduct(req.params.productId);
        } catch (err) {
            product = fallbackProducts.find(p => p.id === req.params.productId);
            if (!product) {
                throw new AppError('Gift card not found', 404);
            }
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/giftcards/balance
 * Get Reloadly account balance
 */
router.get('/account/balance', async (req, res, next) => {
    try {
        let balance;
        try {
            balance = await reloadly.getBalance();
        } catch (err) {
            balance = { balance: 0, currency: 'USD', message: 'Reloadly not connected' };
        }

        res.json({
            success: true,
            data: balance,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
