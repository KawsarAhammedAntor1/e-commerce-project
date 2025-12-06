const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Authentication failed. Please Login.");
        window.location.href = 'admin_login.html';
        return;
    }

    // 2. Logout Logic
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.logout) {
                window.logout('admin_login.html');
            } else {
                // Fallback if global.js isn't loaded (though it should be)
                if (confirm("Are you sure you want to logout?")) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'admin_login.html';
                }
            }
        });
    }

    // 3. Load Data
    loadOrders();
    loadProducts();

    // 4. Product Upload Handler
    const uploadForm = document.getElementById('product-upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(uploadForm);

            try {
                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Product uploaded successfully!',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    uploadForm.reset();
                    loadProducts(); // Refresh list
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Upload Failed',
                        text: data.message || 'Unknown error occurred'
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Could not connect to the server.'
                });
            }
        });
    }
});

// --- Function to Load Orders ---
async function loadOrders() {
    const container = document.getElementById('orders-list');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch orders");
        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">No orders found.</p>';
            return;
        }

        container.innerHTML = orders.map(order => {
            // Payment Badge Logic
            // Payment Badge Logic
            console.log('Payment Method:', order.paymentMethod); // Debug
            const paymentMethod = order.paymentMethod ? order.paymentMethod.toLowerCase() : '';

            let badgeClass = 'badge-cod';
            let badgeText = 'COD';

            if (paymentMethod.includes('bkash')) {
                badgeClass = 'badge-online';
                badgeText = 'PAID';
            } else {
                badgeClass = 'badge-cod';
                badgeText = 'COD';
            }

            // Timeline HTML
            const timelineHTML = order.statusHistory ? order.statusHistory.map(h => {
                const date = new Date(h.timestamp).toLocaleString();
                return `<div class="timeline-entry">
                            <strong>${h.status}</strong> <small>(${date})</small>
                        </div>`;
            }).join('') : '<p>No history</p>';

            // Order Items HTML
            const itemsHTML = order.orderItems.map(item => `
                <div class="item-row">
                    <span>${item.product?.name || 'Unknown Product'} (x${item.qty})</span>
                    <strong>${(item.price || 0) * (item.qty || 1)} ৳</strong>
                </div>
            `).join('');

            return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order._id.slice(-6).toUpperCase()}</h3>
                        <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
                        <p><strong>Address:</strong> ${order.address}, ${order.deliveryArea || ''}</p>
                    </div>
                    <div><span class="badge ${badgeClass}">${badgeText}</span></div>
                </div>

                <div class="order-items">
                    ${itemsHTML}
                    <div style="text-align:right; margin-top:10px; font-weight:bold; font-size:1.1rem; color:#d32f2f;">
                        Total: ${order.totalAmount} ৳
                    </div>
                </div>

                <div class="timeline-container">
                    <div class="timeline-title">Order Status History</div>
                    ${timelineHTML}
                </div>

                <div class="status-control">
                    <select id="status-${order._id}" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="update-btn" onclick="updateOrderStatus('${order._id}')">Update Status</button>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error loading orders.</p>';
    }
}

// --- Function to Update Order Status ---
async function updateOrderStatus(orderId) {
    const token = localStorage.getItem('token');
    const newStatus = document.getElementById(`status-${orderId}`).value;

    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Status updated successfully!');
            loadOrders(); // Reload orders to update timeline
        } else {
            alert(`Failed: ${data.message}`);
        }
    } catch (error) {
        console.error(error);
        alert('Error updating status.');
    }
}

// --- Function to Load Products for Deletion ---
async function loadProducts() {
    const container = document.getElementById('products-delete-list');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` } // Optional if public
        });
        const products = await response.json();

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No products available.</p>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-item">
                <div class="product-info">
                    <img src="${product.image}" alt="img" class="product-thumb">
                    <span>
                        <strong>${product.name}</strong> <br>
                        <small>Stock: ${product.stock} | Price: ${product.regularPrice}</small>
                    </span>
                </div>
                <button class="delete-btn" onclick="deleteProduct('${product._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}

// --- Function to Delete Product ---
async function deleteProduct(productId) {
    const token = localStorage.getItem('token');
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Product deleted!");
            loadProducts();
        } else {
            alert("Failed to delete product.");
        }
    } catch (error) {
        console.error(error);
        alert("Server error.");
    }
}

// --- Tab Switching Logic ---
function switchTab(tabId) {
    // 1. Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active-section');
    });

    // 2. Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. Show target section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }

    // 4. Activate clicked button (Find button that calls this function with same ID)
    // Note: Since we use onclick in HTML, we can iterate to find the match or pass 'this'
    // Simpler approach: Iterate buttons and check onclick attribute or text content
    // Better: Pass 'event' or use a data attribute. But for now, let's match by ID mapping.
    // Mapping: section-upload -> Upload Product, etc.
    // Alternative: Just rely on the user clicking. But we need to highlight the button.
    // Let's update the HTML onclick to pass 'this' or handle it here.
    // Actually, let's just find the button that corresponds to the ID.
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

// Make functions global for onclick events
window.updateOrderStatus = updateOrderStatus;
window.deleteProduct = deleteProduct;
window.switchTab = switchTab;