const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptogift',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',

    // NOWPayments
    nowPayments: {
        apiKey: process.env.NOWPAYMENTS_API_KEY,
        ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
        baseUrl: 'https://api.nowpayments.io/v1',
        sandboxBaseUrl: 'https://api-sandbox.nowpayments.io/v1',
    },

    // Tremendous (Replacing Reloadly)
    tremendous: {
        apiKey: process.env.TREMENDOUS_API_KEY,
        environment: process.env.TREMENDOUS_ENV || 'sandbox', // 'sandbox' or 'production'
        baseUrl: process.env.TREMENDOUS_ENV === 'production'
            ? 'https://api.tremendous.com/api/v2'
            : 'https://testflight.tremendous.com/api/v2',
    },
};
