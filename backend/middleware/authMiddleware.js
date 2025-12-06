const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if it's the master admin bypass ID (Your custom logic)
            if (decoded.id === 'master-admin-id') {
                req.user = {
                    _id: 'master-admin-id',
                    role: 'admin',
                    email: 'kawsarahammed200e@gmail.com'
                };
            } else {
                // Get user from the token
                req.user = await User.findById(decoded.id).select('-password');

                if (!req.user) {
                    res.status(401);
                    throw new Error('User not found');
                }
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        // ফিক্স: সরাসরি send() না করে Error throw করা হলো যাতে server.js এর JSON এরর হ্যান্ডলার এটি ধরতে পারে
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };