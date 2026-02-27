const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');

        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied. Requires admin privileges.' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};

module.exports = adminAuth;
