const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware'); // Ensure you have 'admin' middleware

// 1. Order Placing & Admin List
// POST /api/orders (User places order)
// GET /api/orders (Admin sees all orders)
router.route('/')
    .post(protect, addOrderItems)
    .get(protect, admin, getAllOrders); 

// 2. User Order History
// GET /api/orders/myorders
router.route('/myorders').get(protect, getMyOrders);

// 3. Admin Status Update
// PATCH /api/orders/:id/status
router.route('/:id/status').patch(protect, admin, updateOrderStatus);

module.exports = router;