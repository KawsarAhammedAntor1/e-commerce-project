const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// @route   GET /api/products
// @route   POST /api/products (Image Upload সহ)
router.route('/')
    .get(getProducts)
    .post(protect, admin, upload.single('image'), createProduct);

// @route   GET /api/products/:id
// @route   DELETE /api/products/:id
router.route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct);

module.exports = router;