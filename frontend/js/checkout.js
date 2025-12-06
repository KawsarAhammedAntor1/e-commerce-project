document.addEventListener('DOMContentLoaded', () => {
    const checkoutItemsContainer = document.getElementById('checkout-items-container');
    const subtotalDisplay = document.getElementById('subtotal-display');
    const deliveryChargeDisplay = document.getElementById('delivery-charge-display');
    const grandTotalDisplay = document.getElementById('grand-total-display');
    const placeOrderBtn = document.getElementById('place-order-btn');

    // Shipping form inputs
    const shippingNameInput = document.getElementById('shipping-name');
    const shippingPhoneInput = document.getElementById('shipping-phone');
    const shippingAddressInput = document.getElementById('shipping-address');
    const shippingCityInput = document.getElementById('shipping-city');

    const API_BASE_URL = window.API_BASEURL || 'http://localhost:5000/api';
    let deliveryCharge = 100.00; // Default Inside Dhaka

    let cartData = []; // To store cart items fetched from the backend

    window.loadCheckout = async function () {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Direct Buy Check
            const directBuyItemStr = localStorage.getItem('directBuyItem');
            if (directBuyItemStr) {
                const directItem = JSON.parse(directBuyItemStr);
                cartData = [directItem]; // Use only this item
            } else {
                // Normal Cart Fetch
                const response = await fetch(`${API_BASE_URL}/cart`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch cart items');
                }

                const data = await response.json();
                cartData = Array.isArray(data) ? data : (data.items || []);
            }

            if (cartData.length === 0) {
                checkoutItemsContainer.innerHTML = `
                    <p style="text-align: center; padding: 20px;">Your cart is empty.</p>
                    <div style="text-align: center;">
                        <a href="index.html" class="confirm-order-btn" style="width: auto; padding: 10px 20px; display: inline-block;">Start Shopping</a>
                    </div>
                `;
                if (subtotalDisplay) subtotalDisplay.textContent = '৳0.00';
                if (deliveryChargeDisplay) deliveryChargeDisplay.textContent = '৳0.00';
                if (grandTotalDisplay) grandTotalDisplay.textContent = '৳0.00';
                if (placeOrderBtn) placeOrderBtn.style.display = 'none';
                return;
            }

            renderCheckoutItems(cartData);
            calculateCheckoutTotals(cartData);

            // Add Event Listeners for Delivery Location
            const deliveryRadios = document.querySelectorAll('input[name="deliveryLocation"]');
            deliveryRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    deliveryCharge = Number(e.target.value);
                    calculateCheckoutTotals(cartData);
                });
            });

            if (placeOrderBtn) {
                placeOrderBtn.style.display = 'block';
                placeOrderBtn.disabled = false;
            }

        } catch (error) {
            console.error('Error loading checkout:', error);
            if (window.showToast) window.showToast('Error loading checkout details.', 'error');
            checkoutItemsContainer.innerHTML = `<p style="text-align: center; color: red;">Error: ${error.message}</p>`;
            if (placeOrderBtn) placeOrderBtn.disabled = true;
        }
    };

    function renderCheckoutItems(items) {
        checkoutItemsContainer.innerHTML = '';

        items.forEach(item => {
            const product = item.product || item.productId;
            if (!product) return;

            const name = product.name || 'Unknown Product';
            const price = Number(product.offerPrice || product.regularPrice || product.price || 0);
            const totalItemPrice = price * item.quantity;
            const imageUrl = window.getImageUrl(product.image);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkout-item';
            // Removed inline styles to use CSS class

            itemDiv.innerHTML = `
                <img src="${imageUrl}" alt="${name}" class="item-img">
                <div class="item-info">
                    <p class="item-name">${name}</p>
                    <p class="item-qty">Qty: ${item.quantity}</p>
                </div>
                <div class="item-price">$${totalItemPrice.toFixed(2)}</div>
            `;
            checkoutItemsContainer.appendChild(itemDiv);
        });
    }

    function calculateCheckoutTotals(items) {
        let subtotal = 0;

        items.forEach(item => {
            const product = item.product || item.productId;
            if (product) {
                const price = Number(product.offerPrice || product.regularPrice || product.price || 0);
                subtotal += price * item.quantity;
            }
        });

        const grandTotal = subtotal + deliveryCharge;

        if (subtotalDisplay) subtotalDisplay.textContent = `৳${subtotal.toFixed(2)} BDT`;
        if (deliveryChargeDisplay) deliveryChargeDisplay.textContent = `${deliveryCharge.toFixed(2)} BDT`;
        if (grandTotalDisplay) grandTotalDisplay.textContent = `৳${grandTotal.toFixed(2)} BDT`;
        return { subtotal, grandTotal }; // Return totals for use in order placement
    }

    // Place Order functionality
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', async () => {
            // 1. Validate inputs
            const fullName = shippingNameInput.value.trim();
            const phoneNumber = shippingPhoneInput.value.trim();
            const address = shippingAddressInput.value.trim();
            const city = shippingCityInput.value.trim();

            if (!fullName || !phoneNumber || !address || !city) {
                if (window.showToast) window.showToast('Please fill in all shipping details.', 'error');
                return;
            }

            if (cartData.length === 0) {
                if (window.showToast) window.showToast('Your cart is empty. Please add items before placing an order.', 'error');
                return;
            }

            const { grandTotal } = calculateCheckoutTotals(cartData);

            const orderItems = cartData.map(item => {
                const product = item.product || item.productId;
                if (!product) return null;

                const price = Number(product.offerPrice || product.regularPrice || product.price || 0);

                return {
                    name: product.name,
                    qty: item.quantity,
                    image: product.image, // Assuming product object has an image property
                    price: price,
                    product: product._id, // Product ID
                };
            }).filter(item => item !== null);

            if (orderItems.length === 0) {
                if (window.showToast) window.showToast('Could not process order items. Cart might be invalid.', 'error');
                return;
            }

            const orderData = {
                orderItems,
                shippingAddress: {
                    // FIX 1 & 2: Change keys to 'name' and 'phone' to match Mongoose schema
                    name: fullName,
                    phone: phoneNumber,
                    address,
                    city,
                },
                // FIX 3: Capture selected payment method
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
                // FIX 4: Change key to 'totalAmount' to match Mongoose schema
                totalAmount: grandTotal,
            };

            const token = localStorage.getItem('token');
            if (!token) {
                if (window.showToast) window.showToast('You are not logged in. Please log in to place an order.', 'error');
                window.location.href = 'login.html';
                return;
            }

            try {
                placeOrderBtn.disabled = true;
                placeOrderBtn.textContent = 'Placing Order...';

                const response = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to place order');
                }

                const result = await response.json();
                if (window.showToast) window.showToast(`Order ${result._id} placed successfully!`, 'success');

                // Clear cart from local storage and update UI (optional, backend clears DB cart)
                localStorage.removeItem('cartItems'); // Assuming cart is stored in local storage
                localStorage.removeItem('directBuyItem'); // Clear direct buy item if it exists
                window.updateCartCount(); // Update cart count in header

                window.location.href = 'profile.html'; // Redirect to profile page
            } catch (error) {
                console.error('Error placing order:', error);
                if (window.showToast) window.showToast(`Error placing order: ${error.message}`, 'error');
            } finally {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Place Order';
            }
        });
    }

    // Initialize load if on checkout page
    if (window.location.pathname.endsWith('checkout.html')) {
        window.loadCheckout();
    }
});