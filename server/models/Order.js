const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Order identification
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Gift card details
    brand: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'INR', 'EUR', 'GBP'],
        default: 'USD',
    },
    discountPercent: {
        type: Number,
        default: 0,
    },
    discountedAmount: {
        type: Number,
        required: true,
    },

    // Crypto payment details
    crypto: {
        currency: { type: String, required: true },  // BTC, ETH, USDT, etc.
        amount: { type: String, required: true },     // Crypto amount to pay
        paymentAddress: { type: String },             // Wallet address from NOWPayments
        paymentId: { type: String },                  // NOWPayments payment ID
    },

    // Customer details
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },

    // Gift card code (received from Reloadly)
    giftCardCode: {
        type: String,
        default: null,
    },
    giftCardPin: {
        type: String,
        default: null,
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'payment_received', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },

    // Timestamps
    paidAt: { type: Date },
    completedAt: { type: Date },

}, {
    timestamps: true,  // adds createdAt, updatedAt
});

// Generate order ID before saving
orderSchema.pre('validate', function () {
    if (!this.orderId) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'ORD-';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.orderId = id;
    }
});

module.exports = mongoose.model('Order', orderSchema);
