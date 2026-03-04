const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const giftcardRoutes = require('./routes/giftcards');
const adminRoutes = require('./routes/admin');

const app = express();

// ========== MIDDLEWARE ==========

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for demo to avoid blocking issues
}));

// CORS - Open for Demo
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Optimized Database Connection for Vercel (Serverless)
let cachedDb = null;
const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;

    try {
        console.log('🔌 Connecting to MongoDB...');
        // If URI is missing, don't attempt to connect to localhost on Vercel
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI is missing. Database features will not work.');
            return null;
        }

        const db = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        
        cachedDb = db;
        console.log('✅ MongoDB connected successfully');
        return db;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        return null;
    }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ========== ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API routes
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/giftcards', giftcardRoutes);
app.use('/api/admin', adminRoutes);

// Root handling
app.get('/', (req, res) => {
    res.json({ success: true, message: 'CryptoGift API is online' });
});

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'CryptoGift API is online' });
});

// Error handler
app.use(errorHandler);

// Start server locally
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(config.port, () => {
        console.log(`🚀 Local Server: http://localhost:${config.port}`);
    });
}

// Export for Vercel
module.exports = app;
