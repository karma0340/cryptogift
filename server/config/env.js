const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptogift',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // NOWPayments
    nowPayments: {
        apiKey: process.env.NOWPAYMENTS_API_KEY,
        ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
        baseUrl: 'https://api.nowpayments.io/v1',
        sandboxBaseUrl: 'https://api-sandbox.nowpayments.io/v1',
    },

    // Reloadly
    reloadly: {
        clientId: process.env.RELOADLY_CLIENT_ID,
        clientSecret: process.env.RELOADLY_CLIENT_SECRET,
        isSandbox: process.env.RELOADLY_SANDBOX === 'true',
        baseUrl: process.env.RELOADLY_SANDBOX === 'true'
            ? 'https://giftcards-sandbox.reloadly.com'
            : 'https://giftcards.reloadly.com',
        authUrl: 'https://auth.reloadly.com/oauth/token',
    },
};
