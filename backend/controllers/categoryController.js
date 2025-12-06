// @desc    Get all categories
// @route   GET /api/categories
// @access  Public (for now)
const getCategories = (req, res) => {
    // This list should ideally come from a database or a more dynamic source.
    // For now, it matches the categories defined in the frontend sidebar/home.js
    const categories = [
        { name: 'Mens Shopping', icon: 'fas fa-male' },
        { name: 'Womens Fashion', icon: 'fas fa-female' },
        { name: 'Gadgets & Electronics', icon: 'fas fa-mobile-alt' },
        { name: 'Home Decor', icon: 'fas fa-couch' },
        { name: 'Watch', icon: 'fas fa-clock' },
        { name: 'Women Clothing', icon: 'fas fa-tshirt' },
        { name: 'Saree', icon: 'fas fa-female' },
        { name: 'Shalwar Kameez', icon: 'fas fa-female' },
        { name: 'Ladies Bag', icon: 'fas fa-shopping-bag' },
    ];
    res.json(categories);
};

module.exports = {
    getCategories,
};
