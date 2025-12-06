const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 

// Import Controller Functions (Ensure names match your cartController.js)
const {
    addToCart,
    getCart,
    removeFromCart
} = require('../controllers/cartController');

// 1. Get Cart Items (Matches: GET /api/cart)
router.get('/', protect, getCart);

// 2. Add to Cart (Matches: POST /api/cart/add)
router.post('/add', protect, addToCart);

// 3. Remove Item (Matches: DELETE /api/cart/remove/:id)
// FIXED: Added '/remove' path to match frontend fetch
router.delete('/remove/:id', protect, removeFromCart);

module.exports = router;