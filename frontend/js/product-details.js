document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('product-details-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        container.innerHTML = '<p class="loading-text">Product not found. <a href="index.html">Go Home</a></p>';
        return;
    }

    try {
        // Fetch product details
        // Since we don't have a specific single product endpoint in the frontend code seen so far (it fetches all),
        // we'll fetch all and find the one. If backend supports /products/:id, that's better.
        // Based on admin.js, it seems we only saw GET /products. Let's try GET /products/:id first.
        // If that fails, we fallback to fetching all.

        let product = null;
        const response = await fetch(`${API_BASEURL}/products/${productId}`);

        if (response.ok) {
            product = await response.json();
        } else {
            // Fallback: Fetch all and find
            const allResponse = await fetch(`${API_BASEURL}/products`);
            const allProducts = await allResponse.json();
            product = allProducts.find(p => p._id === productId);
        }

        if (!product) {
            container.innerHTML = '<p class="loading-text">Product not found.</p>';
            return;
        }

        renderProductDetails(product);

    } catch (error) {
        console.error('Error fetching product details:', error);
        container.innerHTML = '<p class="loading-text">Error loading product details. Please try again later.</p>';
    }

    function renderProductDetails(product) {
        const price = window.getProductPrice(product);
        const imageUrl = window.getImageUrl(product.image);

        container.innerHTML = `
            <div class="details-image-container">
                <img src="${imageUrl}" alt="${product.name}" class="details-image">
            </div>
            <div class="details-info">
                <h1 class="details-title">${product.name}</h1>
                <p class="details-price">৳${price.toFixed(2)}</p>
                <div class="details-description">
                    ${product.description || 'No description available.'}
                </div>
                <div class="details-actions">
                    <button id="btn-add-cart" class="btn-details btn-add-cart">Add to Cart</button>
                    <button id="btn-buy-now" class="btn-details btn-buy-now">Buy Now</button>
                </div>
            </div>
        `;

        // Check if Admin is logged in and hide purchase options
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.role === 'admin') {
                const actionsContainer = container.querySelector('.details-actions');
                if (actionsContainer) {
                    actionsContainer.style.display = 'none';
                }
            }
        }

        // Add Event Listeners
        document.getElementById('btn-add-cart').addEventListener('click', () => {
            window.addToCart(product);
        });

        document.getElementById('btn-buy-now').addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to buy items.');
                window.location.href = 'login.html';
                return;
            }

            // Direct Buy Logic: Save item to localStorage and redirect
            const directBuyItem = {
                product: product, // Store full product object
                quantity: 1
            };
            localStorage.setItem('directBuyItem', JSON.stringify(directBuyItem));
            window.location.href = 'checkout.html';
        });
    }
});
