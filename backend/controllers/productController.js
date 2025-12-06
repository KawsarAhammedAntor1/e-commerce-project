const Product = require('../models/productModel');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
    try {
        // ডিবাগিং লগ: টার্মিনালে চেক করুন ডেটা আসছে কিনা
        console.log('Create Product Request Body:', req.body);
        console.log('Create Product Request File:', req.file);

        const imageUrl = req.file ? req.file.path : null;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const { name, category, description, regularPrice, offerPrice, stock, timer } = req.body;

        // স্ট্রিং থেকে নাম্বারে কনভার্ট করা হচ্ছে (জরুরি)
        const product = new Product({
            name,
            category,
            description,
            image: imageUrl,
            regularPrice: Number(regularPrice),
            offerPrice: offerPrice ? Number(offerPrice) : undefined,
            stock: Number(stock),
            timer: timer ? new Date(timer) : undefined,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('Error creating product:', error); // এই লগটি টার্মিনালে এরর বিস্তারিত দেখাবে
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct
};