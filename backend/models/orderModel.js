const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    // Shipping Address কে অবজেক্ট হিসেবে রাখা হলো যাতে ফ্রন্টএন্ডের সাথে মিলে
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'bkash', 'rocket'], // lowercase values from checkout.html
    },
    orderItems: [
        {
            productName: { type: String, required: true }, // Admin Panel এ দেখানোর সুবিধার জন্য
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product',
            },
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
    // Timeline Feature এর জন্য
    statusHistory: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;