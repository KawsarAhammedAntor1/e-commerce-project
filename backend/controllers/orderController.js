const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel'); // Ensure filename matches exactly
const Cart = require('../models/cartModel'); // Ensure filename matches exactly

// @desc 	Create new order
// @route 	POST /api/orders
// @access 	Private
const addOrderItems = asyncHandler(async (req, res) => {
    const { 
        orderItems, 
        shippingAddress, 
        paymentMethod, 
        totalAmount 
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // Create the order
        const order = new Order({
            user: req.user._id,
            orderItems: orderItems.map(x => ({
                qty: x.qty,
                price: x.price,
                // Ensure product ID and name are mapped correctly
                product: x.product, 
                productName: x.name,
                image: x.image,
            })),
            shippingAddress,
            paymentMethod,
            totalAmount,
            status: 'Pending',
            statusHistory: [ // Initialize history with Pending
                {
                    status: 'Pending',
                    timestamp: new Date()
                }
            ]
        });

        const createdOrder = await order.save();

        // Clear User Cart after successful order
        // NOTE: Make sure the Cart model is correctly implemented to clear the user's cart in the DB.
        await Cart.findOneAndDelete({ user: req.user._id });

        res.status(201).json(createdOrder);
    }
});

// @desc 	Get logged in user orders
// @route 	GET /api/orders/myorders
// @access 	Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc 	Get all orders (For Admin)
// @route 	GET /api/orders
// @access 	Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
    // Populate user info if needed
    const orders = await Order.find({})
        .populate('user', 'id name email')
        .sort({ createdAt: -1 });
    
    res.json(orders);
});

// @desc 	Update order status (For Admin)
// @route 	PATCH /api/orders/:id/status
// @access 	Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status;
        
        // Push to timeline history
        order.statusHistory.push({
            status: req.body.status,
            timestamp: new Date()
        });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

module.exports = {
    addOrderItems,
    getMyOrders,
    getAllOrders, 	// New: For Admin List
    updateOrderStatus // New: For Admin Status Update
};