document.addEventListener('DOMContentLoaded', async () => {
    // --- IMPORTANT: Backend URL (Port 5000) ---
    // --- IMPORTANT: Backend URL (Port 5000) ---
    const API_BASE_URL = 'http://localhost:5000/api';

    // --- FIX: Force Remove Dark Mode if not enabled ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== 'dark') {
        document.body.classList.remove('dark-mode');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
    }

    // ১. নাম ঠিক রাখা হলো ('token' ব্যবহার করা হলো)
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));

    const profileNameSpan = document.getElementById('profile-name');
    const profileEmailSpan = document.getElementById('profile-email');
    const logoutButton = document.getElementById('profile-logout-button');
    const myOrdersContainer = document.getElementById('my-orders-container');

    // ২. লগইন চেক
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // ৩. ইউজার ডাটা দেখানো
    if (storedUser) {
        if (profileNameSpan) profileNameSpan.textContent = storedUser.name;
        if (profileEmailSpan) profileEmailSpan.textContent = storedUser.email;
    }

    // ৪. লগআউট ফাংশন
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You will be logged out of your session.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, logout!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('cartItems');
                        window.location.href = 'login.html';
                    }
                });
            } else {
                // Fallback if Swal fails
                if (confirm("Are you sure you want to log out?")) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('cartItems');
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // ৫. অর্ডার হিস্টোরি লোড করা
    try {
        // FIX: এখানে সরাসরি Backend URL ব্যবহার করা হচ্ছে
        const response = await fetch(`${API_BASE_URL}/orders/myorders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // রেসপন্স চেক (JSON কিনা)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server Error: Backend did not return JSON. Is Port 5000 running?");
        }

        const orders = await response.json();

        if (response.ok) {
            if (orders.length === 0) {
                myOrdersContainer.innerHTML = '<p>You have not placed any orders yet.</p>';
            } else {
                let ordersHtml = '';

                orders.forEach(order => {
                    const date = new Date(order.createdAt).toLocaleDateString();
                    const price = order.totalPrice || order.totalAmount || 0;

                    // Payment Status Logic
                    let paymentStatusBadge = '';
                    console.log('Payment Method:', order.paymentMethod); // Debug
                    const method = (order.paymentMethod || '').toLowerCase();

                    if (method.includes('bkash')) {
                        paymentStatusBadge = '<span style="padding: 3px 8px; border-radius: 4px; background: #28a745; color: #fff;">PAID</span>';
                    } else {
                        paymentStatusBadge = '<span style="padding: 3px 8px; border-radius: 4px; background: #ffc107; color: #000;">COD</span>';
                    }

                    // Timeline Logic
                    let timelineHtml = '<div class="order-timeline" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">';
                    if (order.statusHistory && order.statusHistory.length > 0) {
                        order.statusHistory.forEach(history => {
                            const historyDate = new Date(history.timestamp).toLocaleString();
                            timelineHtml += `
                                <div class="timeline-item" style="display: flex; align-items: center; margin-bottom: 5px; font-size: 0.85rem; color: #ccc;">
                                    <div style="width: 10px; height: 10px; background: #00d2d3; border-radius: 50%; margin-right: 10px;"></div>
                                    <div>
                                        <strong style="color: #fff;">${history.status}</strong> 
                                        <span style="margin-left: 5px; font-size: 0.8rem; color: #888;">(${historyDate})</span>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        // Fallback if no history exists yet
                        timelineHtml += `<p style="font-size: 0.85rem; color: #ccc;">Current Status: ${order.status}</p>`;
                    }
                    timelineHtml += '</div>';

                    ordersHtml += `
                        <div class="order-card" style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div>
                                    <h3 style="margin: 0; font-size: 1.1rem; color: #fff;">Order #${order._id.slice(-6)}</h3>
                                    <p style="margin: 5px 0 0; font-size: 0.9rem; color: #aaa;">Placed on ${date}</p>
                                </div>
                                <div style="text-align: right;">
                                    <p style="margin: 0; font-size: 1.1rem; font-weight: bold; color: #00d2d3;">${Number(price).toFixed(2)} Tk</p>
                                    <div style="margin-top: 5px;">${paymentStatusBadge}</div>
                                </div>
                            </div>
                            
                            ${timelineHtml}
                        </div>
                    `;
                });

                myOrdersContainer.innerHTML = ordersHtml;
            }
        } else {
            console.error('Failed to load orders:', orders.message);
            myOrdersContainer.innerHTML = `<p style="color:red">Error: ${orders.message}</p>`;

            // যদি টোকেন মেয়াদোত্তীর্ণ হয়
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        }

    } catch (error) {
        console.error('Error fetching orders:', error);
        myOrdersContainer.innerHTML = '<p style="color:red">Could not connect to Backend Server (Port 5000).</p>';
    }
});