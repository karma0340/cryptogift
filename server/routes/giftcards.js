const express = require('express');
const router = express.Router();
const tremendous = require('../services/tremendous');
const { AppError } = require('../middleware/errorHandler');

// Updated categories using a more standard list for the marketplace
const categories = ['Shopping', 'Gaming', 'Entertainment', 'Food & Delivery', 'Virtual Cards'];

// Professional fallback data for the demo
const fallbackProducts = [
    { id: 'amzn-usd', name: 'Amazon Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100, 200, 500], currency: 'USD', bgGradient: 'linear-gradient(135deg, #232f3e 0%, #37475a 100%)' },
    { id: 'visa-usd', name: 'Visa Virtual Card Gift Card', category: 'Virtual Cards', denominations: [25, 50, 100, 250], currency: 'USD', bgGradient: 'linear-gradient(135deg, #1a1f71 0%, #2b339e 100%)' },
    { id: 'ebay-usd', name: 'eBay Gift Card', category: 'Shopping', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #e53238 0%, #0064d2 100%)' },
    { id: 'steam-usd', name: 'Steam Wallet Code', category: 'Gaming', denominations: [10, 20, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #171a21 0%, #2a475e 100%)' },
    { id: 'psn-usd', name: 'PlayStation Network', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #003087 0%, #0072ce 100%)' },
    { id: 'xbox-usd', name: 'Xbox Live Gold', category: 'Gaming', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #107c10 0%, #2ca12c 100%)' },
    { id: 'nflx-usd', name: 'Netflix Subscription', category: 'Entertainment', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)' },
    { id: 'spot-usd', name: 'Spotify Premium', category: 'Entertainment', denominations: [10, 30, 60], currency: 'USD', bgGradient: 'linear-gradient(135deg, #1db954 0%, #191414 100%)' },
    { id: 'appl-usd', name: 'Apple Gift Card', category: 'Entertainment', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #555555 0%, #000000 100%)' },
    { id: 'goog-usd', name: 'Google Play Code', category: 'Entertainment', denominations: [10, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' },
    { id: 'uber-usd', name: 'Uber & Uber Eats', category: 'Food & Delivery', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)' },
    { id: 'dash-usd', name: 'DoorDash Credits', category: 'Food & Delivery', denominations: [15, 25, 50, 100], currency: 'USD', bgGradient: 'linear-gradient(135deg, #ff3008 0%, #ff6b4d 100%)' },
];

/**
 * GET /api/giftcards
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, search } = req.query;

        // For demo, we primarily use the high-quality fallback data
        let filtered = [...fallbackProducts];

        if (category && category !== 'All') {
            filtered = filtered.filter(p =>
                (p.category || '').toLowerCase() === category.toLowerCase()
            );
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(q)
            );
        }

        res.json({
            success: true,
            data: {
                products: filtered,
                total: filtered.length,
                categories
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/giftcards/:productId
 */
router.get('/:productId', async (req, res, next) => {
    try {
        const product = fallbackProducts.find(p => p.id === req.params.productId);

        if (!product) {
            throw new AppError('Gift card not found', 404);
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
