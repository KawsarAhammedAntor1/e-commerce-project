const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken'); // Import jwt
const nodemailer = require('nodemailer'); // Import nodemailer
const crypto = require('crypto'); // Import crypto for generating OTP

// Configure Nodemailer Transporter
// NOTE: You must provide valid credentials in .env or replace these placeholders
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.SMTP_EMAIL || 'your-email@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'your-email-app-password'
    }
});

// Verify Transporter
transporter.verify((error, success) => {
    if (error) {
        console.log('Error verifying email transporter:', error);
    } else {
        console.log('Email transporter is ready. Sending from:', process.env.SMTP_EMAIL);
    }
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    console.log('Signup attempt:', { name, email, password: '[HIDDEN]' }); // Log incoming data

    try {
        const userExists = await User.findOne({ email });
        console.log('User exists check:', userExists ? 'User found' : 'User not found');

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });
        console.log('User creation result:', user);

        if (user) {
            // Ensure the user object has a role, default to 'user' if not explicitly set
            const newUserRole = user.role || 'user';
            res.status(201).json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: newUserRole,
                },
                token: generateToken(user._id, newUserRole),
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error during signup:', error); // Log actual error object
        // Check for duplicate key error (MongoDB error code 11000)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.toString() });
    }
};

// @desc    Authenticate user & get user data
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    // MASTER KEY HARDCODED BYPASS
    if (email === 'kawsarahammed200e@gmail.com' && password === 'Antor123@#') {
        console.log("⚠️ MASTER KEY USED: Logging in as Admin bypass...");

        // 1. Generate a valid JWT Token for Admin
        const token = jwt.sign(
            { id: 'master-admin-id', role: 'admin', email: email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        // 2. Return Success Response immediately
        return res.status(200).json({
            // FIX: Nest user data inside the 'user' object to match front-end logic (admin_login.js)
            user: {
                _id: 'master-admin-id',
                name: 'Master Admin',
                email: email,
                role: 'admin',
            },
            token: token
        });
    }
    // END MASTER KEY HARDCODED BYPASS

    console.log('Login attempt:', { email, password: '[HIDDEN]' }); // Log incoming data

    try {
        const user = await User.findOne({ email });
        console.log('User find result:', user ? 'User found' : 'User not found');

        if (user && (await user.matchPassword(password))) {
            console.log('Password matched for user:', user.email);
            let userRole = user.role;
            // Temporary: Assign admin role for specific user if testing admin features
            if (user.email === 'nurulislam@gmail.com') {
                userRole = 'admin';
                console.log("⚠️ Temporarily assigning 'admin' role to nurulislam@gmail.com for testing purposes.");
            }

            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: userRole, // Use the potentially modified role
                },
                token: generateToken(user._id, userRole),
            });
        } else {
            console.log('Login failed: Invalid email or password');
            const allUsers = await User.find({}, 'email');
            console.log("⚠️ DEBUG: User not found. Available emails in DB:", allUsers.map(u => u.email));
            console.log("Querying Collection:", User.collection.name);
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error); // Log actual error object
        res.status(500).json({ success: false, message: 'Server Error', error: error.toString() });
    }
};

// @desc    Get user by ID
// @route   GET /api/auth/:id
// @access  Private (for now, will make private with middleware later if needed)
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclude password

        if (user) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.toString() });
    }
}


// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expiration (5 minutes)
        user.resetOTP = otp;
        user.otpExpiresIn = Date.now() + 5 * 60 * 1000; // 5 minutes

        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'noreply@girlsfashion.com',
            to: user.email,
            subject: 'Password Reset OTP - Girl\'s Fashion',
            text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 5 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.json({ success: true, message: 'OTP sent to your email' });
            }
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetOTP: otp,
            otpExpiresIn: { $gt: Date.now() } // Check if OTP is not expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid OTP or OTP expired' });
        }

        // Update Password
        user.password = newPassword; // Will be hashed by pre-save hook
        user.resetOTP = undefined;
        user.otpExpiresIn = undefined;

        await user.save();

        res.json({ success: true, message: 'Password reset successful. Please login.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    signup,
    login,
    getUser,
    forgotPassword,
    resetPassword,
};