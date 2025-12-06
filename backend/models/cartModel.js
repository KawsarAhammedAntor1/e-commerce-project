const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // কন্ট্রোলারের সাথে মিল রাখার জন্য 'items' অ্যারে ব্যবহার করা হয়েছে
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;