document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT: Backend URL Hardcoded (To avoid undefined error) ---
    const API_BASE_URL = 'http://localhost:5000/api';
    const SERVER_URL = 'http://localhost:5000';

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    const categoryTitle = document.getElementById('category-title');
    const productContainer = document.getElementById('product-container');

    // --- Helper to format image URL (Local fallback) ---
    function getImageUrl(imagePath) {
        if (!imagePath) return 'https://via.placeholder.com/150x150.png?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        return `${SERVER_URL}/${finalPath}`;
    }

    // --- Set Title ---
    if (category) {
        if (categoryTitle) categoryTitle.textContent = category;
    } else {
        if (categoryTitle) categoryTitle.textContent = 'All Products';
    }

    // --- Fetch Products Function ---
    async function fetchCategoryProducts(categoryName = '') {
        if (!productContainer) return;

        productContainer.innerHTML = '<p style="text-align: center;">Loading products...</p>';

        try {
            // URL তৈরি করা
            const url = categoryName
                ? `${API_BASE_URL}/products?category=${encodeURIComponent(categoryName)}`
                : `${API_BASE_URL}/products`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const products = await response.json();
            productContainer.innerHTML = '';

            // যদি কোনো প্রোডাক্ট না থাকে
            if (products.length === 0) {
                productContainer.innerHTML = `
                    <div class="no-results" style="text-align:center; padding: 50px;">
                        <h3>No Products Found</h3>
                        <p>Sorry, there are no products available right now.</p>
                        <button class="confirm-order-btn" onclick="window.location.href='index.html'">Go Back</button>
                    </div>
                `;
                return;
            }

            // ইউজার এডমিন কিনা চেক করা
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const isAdmin = user && user.role === 'admin';

            // প্রোডাক্ট রেন্ডার করা
            products.forEach(product => {
                // প্রাইস ক্যালকুলেশন (যাতে NaN না আসে)
                const rawPrice = product.offerPrice || product.regularPrice || product.price || 0;
                const priceToDisplay = Number(rawPrice).toFixed(2);

                const productCard = document.createElement('div');
                productCard.className = 'product-card';

                const buttonHtml = isAdmin ? '' : '<button class="btn-order-green btn-add-to-cart">Add to Cart</button>';

                productCard.innerHTML = `
                    <div class="product-click-area" onclick="window.location.href='product-details.html?id=${product._id}'" style="cursor: pointer;">
                        <img src="${getImageUrl(product.image)}" alt="${product.name}" class="product-img">
                        <div class="product-info">
                            <h4>${product.name}</h4>
                            <p class="price"><span class="new-price">$${priceToDisplay}</span></p>
                        </div>
                    </div>
                    <div style="padding: 0 0.5rem 0.5rem;">
                        ${buttonHtml}
                    </div>
                `;
                productContainer.appendChild(productCard);

                // --- Add to Cart Logic ---
                if (!isAdmin) {
                    const addToCartBtn = productCard.querySelector('.btn-add-to-cart');
                    if (addToCartBtn) {
                        addToCartBtn.addEventListener('click', () => {
                            // আমরা global.js এর addToCart ফাংশন ব্যবহার করছি
                            // এটি কনসিস্টেন্সি বজায় রাখবে এবং টোকেন অটোমেটিক হ্যান্ডেল করবে
                            if (window.addToCart) {
                                window.addToCart(product);
                            } else {
                                alert("System Error: addToCart function missing. Please reload.");
                            }
                        });
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching products:', error);
            if (productContainer) {
                productContainer.innerHTML = '<p style="text-align: center; color: red;">Failed to load products. Check console for details.</p>';
            }
        }
    }

    // ফাংশন কল করা
    fetchCategoryProducts(category);
});