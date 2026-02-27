const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const giftcardRoutes = require('./routes/giftcards');

const app = express();

// ========== MIDDLEWARE ==========

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        services: {
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        },
    });
});

// API routes
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/giftcards', giftcardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`,
    });
});

// Error handler
app.use(errorHandler);

// ========== DATABASE & SERVER ==========

// ========== DATABASE & SERVER ==========

// Connect to MongoDB
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(config.mongodbUri);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error.message);
    }
};

// Start server locally (not used by Vercel)
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => {
        app.listen(config.port, () => {
            console.log(`\n🚀 CryptoGift API Server`);
            console.log(`   Environment: ${config.nodeEnv}`);
            console.log(`   Port:        ${config.port}`);
            console.log(`   API URL:     http://localhost:${config.port}/api`);
            console.log(`   Health:      http://localhost:${config.port}/api/health`);
            console.log(`   Frontend:    ${config.frontendUrl}\n`);
        });
    });
} else {
    // For Vercel Serverless
    connectDB();
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received. Shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

// Export the Express app for Vercel
module.exports = app;
