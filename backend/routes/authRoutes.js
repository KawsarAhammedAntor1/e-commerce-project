const express = require('express');
const router = express.Router();
const { signup, login, getUser, forgotPassword, resetPassword } = require('../controllers/authController');

// @route   POST /api/auth/signup
router.route('/signup').post(signup);

// @route   POST /api/auth/login
router.route('/login').post(login);

// @route   POST /api/auth/forgot-password
router.route('/forgot-password').post(forgotPassword);

// @route   POST /api/auth/reset-password
router.route('/reset-password').post(resetPassword);

// @route   GET /api/auth/:id
router.route('/:id').get(getUser);

module.exports = router;
