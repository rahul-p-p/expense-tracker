
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    try {
        // Check server configuration
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is missing from environment variables');

            return res.status(500).json({
                success: false,
                message: 'Server authentication configuration error'
            });
        }

        // Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please provide a valid token.'
            });
        }

        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Token is missing.'
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        // Validate decoded user ID
        if (
            !decoded ||
            typeof decoded.id !== 'string' ||
            !/^[a-fA-F0-9]{24}$/.test(decoded.id)
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        // Attach authenticated user to request
        req.user = {
            id: decoded.id
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please log in again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }

        console.error('Authentication middleware error:', error);

        return res.status(500).json({
            success: false,
            message: 'Authentication failed due to a server error'
        });
    }
};

module.exports = { protect };
