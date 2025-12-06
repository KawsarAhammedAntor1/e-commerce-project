document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');
    const subtotalDisplay = document.getElementById('subtotal-display');
    const deliveryChargeDisplay = document.getElementById('delivery-charge-display');
    const grandTotalDisplay = document.getElementById('grand-total-display');
    const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout-btn');

    // Buttons
    const btnStartShopping = document.getElementById('btn-start-shopping');
    const btnSignupShopping = document.getElementById('btn-signup-shopping');

    // API Config
    const API_BASE_URL = window.API_BASEURL || 'http://localhost:5000/api';
    const SERVER_URL = window.SERVER_URL || 'http://localhost:5000';
    const DELIVERY_CHARGE = 60.00;

    const getImageUrl = window.getImageUrl || function (path) {
        if (!path) return 'https://via.placeholder.com/150';
        if (path.startsWith('http')) return path;
        return `${SERVER_URL}/${path.replace(/\\/g, '/')}`;
    };

    // UI Helper: Handle Empty Cart State
    function handleEmptyCartUI(isLoggedIn) {
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartItemsContainer) cartItemsContainer.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'none';

        if (isLoggedIn) {
            // USER LOGGED IN: Show "Start Shopping", Hide "Sign Up"
            if (btnStartShopping) btnStartShopping.style.display = 'inline-block';
            if (btnSignupShopping) btnSignupShopping.style.display = 'none';
        } else {
            // USER NOT LOGGED IN: Hide "Start Shopping", Show "Sign Up"
            if (btnStartShopping) btnStartShopping.style.display = 'none';
            if (btnSignupShopping) btnSignupShopping.style.display = 'inline-block';
        }
    }

    window.loadCart = async function () {
        const token = localStorage.getItem('token');

        // SCENARIO 1: User Not Logged In
        if (!token) {
            handleEmptyCartUI(false); // false = Not Logged In
            return;
        }

        // SCENARIO 2: User Logged In
        try {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch cart');
            }

            const data = await response.json();
            const cartItems = Array.isArray(data) ? data : (data.items || []);

            if (cartItems.length === 0) {
                handleEmptyCartUI(true); // true = Logged In
            } else {
                // Cart Has Items
                if (emptyCartMessage) emptyCartMessage.style.display = 'none';
                if (cartItemsContainer) cartItemsContainer.style.display = 'block';
                if (cartSummary) cartSummary.style.display = 'block';

                renderCartItems(cartItems);
                calculateTotals(cartItems);
            }

        } catch (error) {
            console.error('Error loading cart:', error);
            handleEmptyCartUI(true);
            if (window.showToast) window.showToast('Could not load cart items.', 'error');
        }
    };

    async function renderCartItems(items) {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';

        for (const item of items) {
            const product = item.product || item.productId;
            if (!product) continue;

            const price = Number(product.offerPrice || product.regularPrice || product.price || 0);
            const totalItemPrice = price * item.quantity;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item-card';
            itemDiv.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; gap: 15px;";

            itemDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; flex:1;">
                    <img src="${getImageUrl(product.image)}" alt="${product.name}" class="cart-item-image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                    <div class="cart-item-details">
                        <h4 class="cart-item-name" style="margin: 0 0 5px 0;">${product.name}</h4>
                        <p class="cart-item-price" style="margin:0; color:#666;">
                            ৳${totalItemPrice.toFixed(2)} 
                            <span style="font-size:0.85em">(৳${price.toFixed(2)} x ${item.quantity})</span>
                        </p>
                    </div>
                </div>
                <button class="remove-from-cart-btn" data-product-id="${product._id}" style="background:none; border:none; color:red; font-size:1.5rem; cursor:pointer;">&times;</button>
            `;
            cartItemsContainer.appendChild(itemDiv);
        }

        document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', removeFromCart);
        });
    }

    async function removeFromCart(event) {
        const productId = event.target.closest('button').dataset.productId;
        const token = localStorage.getItem('token');

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cart/remove/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (window.showToast) window.showToast('Item removed', 'success');
                window.loadCart();
                if (window.updateCartCount) window.updateCartCount();
            } else {
                const data = await response.json();
                if (window.showToast) window.showToast(data.message || 'Failed to remove', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    }

    function calculateTotals(items) {
        let subtotal = 0;
        items.forEach(item => {
            const product = item.product || item.productId;
            if (product) {
                const price = Number(product.offerPrice || product.regularPrice || product.price || 0);
                subtotal += price * item.quantity;
            }
        });
        const grandTotal = subtotal + DELIVERY_CHARGE;

        if (subtotalDisplay) subtotalDisplay.textContent = `৳${subtotal.toFixed(2)}`;
        if (deliveryChargeDisplay) deliveryChargeDisplay.textContent = `৳${DELIVERY_CHARGE.toFixed(2)}`;
        if (grandTotalDisplay) grandTotalDisplay.textContent = `৳${grandTotal.toFixed(2)}`;
    }

    // FIX: This ensures clicking "Proceed to Checkout" goes to checkout.html
    if (proceedToCheckoutBtn) {
        proceedToCheckoutBtn.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = 'checkout.html';
            } else {
                if (window.showToast) window.showToast('Please login to proceed to checkout', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
        });
    }

    // Auto load
    window.loadCart();
});