const API_BASEURL = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';
let allProducts = []; // Global variable to store all products

// --- Helper function to format image URL ---
// Exposing globally for use in render functions across different pages
window.getImageUrl = function (imagePath) {
    if (!imagePath) return 'https://via.placeholder.com/150x150.png?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, '/');
    const finalPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    return `${SERVER_URL}/${finalPath}`;
};

// --- Helper: Get Safe Price (Centralized logic) ---
window.getProductPrice = function (product) {
    if (!product) return 0;
    const price = product.offerPrice || product.regularPrice || product.price || 0;
    return Number(price);
};

// --- ADD TO CART FUNCTION (Login Logic Preserved) ---
window.addToCart = async function (product) {
    const token = localStorage.getItem('token');

    // 1. Check if user is logged in
    if (!token) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Please Login',
                text: 'You need to be logged in to add items to cart',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'login.html';
            });
        } else {
            // Fallback if Swal not loaded for some reason
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
        }
        return;
    }

    // Check for duplicates in localStorage (if available)
    const cartItemsStr = localStorage.getItem('cartItems');
    if (cartItemsStr) {
        try {
            const cartItems = JSON.parse(cartItemsStr);
            // Check if product exists (handling different ID formats if needed, assuming product._id)
            const exists = cartItems.some(item =>
                (item.product && item.product._id === product._id) ||
                (item.productId === product._id) ||
                (item._id === product._id)
            );

            if (exists) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Already in Cart',
                        text: 'This product is already in your cart.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    alert('This product is already in your cart.');
                }
                return; // Stop execution
            }
        } catch (e) {
            console.error("Error parsing cartItems", e);
        }
    }

    // 2. If Logged In -> Send request to backend
    try {
        const response = await fetch(`${API_BASEURL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: product._id,
                quantity: 1
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Added!',
                    text: 'Product added to cart successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                if (window.showToast) window.showToast('Product added to cart successfully!', 'success');
                else alert('Product added to cart successfully!');
            }

            if (typeof window.updateCartCount === 'function') {
                window.updateCartCount();
            }

            // Sync localStorage for duplicate checking
            try {
                const cartResponse = await fetch(`${API_BASEURL}/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    const items = Array.isArray(cartData) ? cartData : (cartData.items || []);
                    localStorage.setItem('cartItems', JSON.stringify(items));
                }
            } catch (err) {
                console.error('Failed to sync local cart:', err);
            }
        } else {
            console.error('Add to cart failed:', data);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.message || 'Failed to add to cart'
                });
            } else {
                if (window.showToast) window.showToast(data.message || 'Failed to add to cart', 'error');
                else alert(data.message || 'Failed to add to cart');
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong!'
            });
        } else {
            if (window.showToast) window.showToast('Something went wrong!', 'error');
        }
    }
}


// --- Helper: Logout Function ---
window.logout = function (redirectUrl = 'index.html') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your session.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout!'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('cartItems');

                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been logged out.',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = redirectUrl;
                });
            }
        });
    } else {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('cartItems');
            window.location.href = redirectUrl;
        }
    }
};

// --- Main function to restore session and update UI ---
// --- Main function to restore session and update UI ---
window.restoreSession = function () {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user && user.role === 'admin';

    // Safe Selectors
    const sideNavList = document.querySelector('.side-nav-list');
    const adminLink = document.getElementById('side-nav-admin-link');
    const loginLi = document.querySelector('.side-nav-list a[href="login.html"]')?.parentElement;
    const bottomNavLoginLink = document.getElementById('bottom-nav-login');

    // Desktop Nav Selectors
    const desktopNav = document.querySelector('.desktop-nav');
    const desktopLoginLink = desktopNav ? desktopNav.querySelector('a[href="login.html"], a[id="desktop-logout-btn"]') : null;
    const desktopAdminLink = desktopNav ? desktopNav.querySelector('a[href="admin_login.html"], a[href="admin.html"]') : null;

    // --- 1. Reset UI to default (logged-out) state ---
    const existingLogout = document.getElementById('dynamic-logout-li');
    if (existingLogout) existingLogout.remove();

    if (loginLi) loginLi.style.display = 'block';

    if (adminLink) {
        adminLink.href = 'admin_login.html';
        const adminSpan = adminLink.querySelector('span');
        if (adminSpan) adminSpan.textContent = 'Admin';
    }
    if (bottomNavLoginLink) {
        bottomNavLoginLink.href = 'login.html';
        const loginSpan = bottomNavLoginLink.querySelector('span');
        if (loginSpan) loginSpan.textContent = 'Login';
    }

    // Reset Desktop Nav
    if (desktopLoginLink) {
        desktopLoginLink.style.display = ''; // Ensure visible by default
        desktopLoginLink.textContent = 'Login';
        desktopLoginLink.href = 'login.html';
        desktopLoginLink.id = ''; // Remove logout ID
        // Remove any previous click listeners by cloning (simple way to clear listeners)
        const newLink = desktopLoginLink.cloneNode(true);
        desktopLoginLink.parentNode.replaceChild(newLink, desktopLoginLink);
    }
    if (desktopAdminLink) {
        desktopAdminLink.href = 'admin_login.html';
    }

    // --- 2. Apply "Logged In" state if token exists ---
    if (token) {
        if (loginLi) loginLi.style.display = 'none'; // Hide "Login / Sign Up"

        if (sideNavList) {
            const logoutLi = document.createElement('li');
            logoutLi.id = 'dynamic-logout-li';
            logoutLi.innerHTML = `
                <a href="#" id="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            `;
            sideNavList.appendChild(logoutLi);

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.logout(); // Use global logout
                });
            }
        }

        if (bottomNavLoginLink) {
            bottomNavLoginLink.href = 'profile.html';
            const loginSpan = bottomNavLoginLink.querySelector('span');
            if (loginSpan) loginSpan.textContent = 'Profile';
        }

        // Update Desktop Nav for Logged In User
        const currentDesktopLoginLink = desktopNav ? desktopNav.querySelector('a[href="login.html"]') : null;
        if (currentDesktopLoginLink) {
            // Show Logout for ALL logged in users (User & Admin)
            currentDesktopLoginLink.style.display = ''; // Ensure visible
            currentDesktopLoginLink.textContent = 'Logout';
            currentDesktopLoginLink.href = '#';
            currentDesktopLoginLink.id = 'desktop-logout-btn';
            currentDesktopLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.logout();
            });
        }

        // Select Contact Links
        const contactSideLink = document.querySelector('.side-nav-list a[href="contact.html"]')?.parentElement;
        const contactDesktopLink = desktopNav ? desktopNav.querySelector('a[href="contact.html"]') : null;

        if (isAdmin) {
            if (adminLink) {
                adminLink.href = 'admin.html';
                adminLink.querySelector('span').textContent = 'Admin ✅';
            }

            // HIDE CONTACT & CART FOR ADMINS
            const contactLinks = document.querySelectorAll('a[href="contact.html"]');
            contactLinks.forEach(link => link.style.display = 'none');

            const cartIcon = document.querySelector('.cart-icon');
            if (cartIcon) cartIcon.style.display = 'none';

            // Reorder Desktop Nav: Admin [Left] -> Logout [Right]
            if (desktopAdminLink && currentDesktopLoginLink && desktopNav) {
                // Check if they are in the wrong order
                if (currentDesktopLoginLink.compareDocumentPosition(desktopAdminLink) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    // Currently: Login ... Admin (Normal)
                    // Target: Admin ... Login
                    // Move Login link to AFTER Admin link
                    desktopAdminLink.parentNode.insertBefore(currentDesktopLoginLink, desktopAdminLink.nextSibling);
                }
            }

            // Update Desktop Admin Link
            const currentDesktopAdminLink = desktopNav ? desktopNav.querySelector('a[href="admin_login.html"]') : null;
            if (currentDesktopAdminLink) {
                currentDesktopAdminLink.href = 'admin.html';
            }
        } else {
            // Ensure Contact Us is visible for non-admins
            if (contactSideLink) contactSideLink.style.display = '';
            if (contactDesktopLink) contactDesktopLink.style.display = '';
        }
    }
}

// --- Side Menu Toggle Logic ---
window.setupSideMenuToggle = function () {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const sideNav = document.getElementById('side-nav');
    const overlay = document.getElementById('overlay');

    if (menuBtn && sideNav && overlay && closeBtn) {
        // Remove old listeners to prevent duplicates (cloning is a quick way, or just careful management)
        // For simplicity here, we assume this function is called once per header load.

        const openMenu = () => {
            sideNav.classList.add('active');
            overlay.classList.add('active');
        };
        const closeMenu = () => {
            sideNav.classList.remove('active');
            overlay.classList.remove('active');
        };

        menuBtn.onclick = openMenu; // Use onclick to easily override old handlers
        closeBtn.onclick = closeMenu;
        overlay.onclick = closeMenu;
    }
};

// --- DOM Elements for Search ---
const searchOverlay = document.getElementById('search-overlay');
const mainPageContent = document.getElementById('main-page-content');

// FIX: Expose to window so other functions/pages can call this to manage the search view
window.toggleLiveSearchDisplay = function (showSearchOverlay) {
    // re-fetch elements in case of dynamic load
    const overlay = document.getElementById('search-overlay');
    const mainContent = document.getElementById('main-page-content');

    if (showSearchOverlay) {
        if (mainContent) mainContent.style.display = 'none';
        if (overlay) overlay.style.display = 'block';
    } else {
        if (mainContent) mainContent.style.display = 'block'; // Or '' to reset to CSS default
        if (overlay) overlay.style.display = 'none';
    }
}

// --- Renders products ---
window.renderProducts = function (productsToRender, container) {
    if (!container) return;
    container.innerHTML = '';

    if (productsToRender.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">No products found.</p>';
        return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user && user.role === 'admin';

    productsToRender.forEach(product => {
        const priceToDisplay = window.getProductPrice(product);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const buttonHtml = isAdmin ? '' : '<button class="btn-order-green btn-add-to-cart">Add to Cart</button>';

        productCard.innerHTML = `
            <div class="product-click-area" onclick="window.location.href='product-details.html?id=${product._id}'" style="cursor: pointer;">
                <img src="${window.getImageUrl(product.image)}" alt="${product.name}" class="product-img">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="price"><span class="new-price">৳${priceToDisplay.toFixed(2)}</span></p>
                </div>
            </div>
            <div style="padding: 0 0.5rem 0.5rem;">
                ${buttonHtml}
            </div>
        `;
        container.appendChild(productCard);

        if (!isAdmin) {
            productCard.querySelector('.btn-add-to-cart')?.addEventListener('click', () => {
                const productToAdd = { ...product, _id: product._id };
                window.addToCart(productToAdd);
            });
        }
    });
}

// --- Search Functionality ---
window.performSearch = function (searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    if (searchTerm.length > 0) {
        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
        window.toggleLiveSearchDisplay(true);
        // Ensure we have the overlay element
        const overlay = document.getElementById('search-overlay');
        window.renderProducts(filteredProducts, overlay);
    } else {
        window.toggleLiveSearchDisplay(false);
        // Re-render home products if on index page
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.renderProducts(allProducts, document.getElementById('products-container'));
        }
    }
}

// --- Fetch Products (Required for search to work across pages) ---
window.fetchAllProducts = async function () {
    try {
        const response = await fetch(`${API_BASEURL}/products`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        allProducts = await response.json();
        // Only render products on the index page during global load
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            window.renderProducts(allProducts, document.getElementById('products-container'));
        }
    } catch (error) {
        console.error('Failed to fetch products:', error);
        const container = document.getElementById('products-container');
        if (container && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
            container.innerHTML = '<p>Error loading products.</p>';
        }
    }
}

// --- Global Header Listener Setup (Exposed for dynamic headers) ---
window.setupHeaderListeners = function () {
    // 1. Side Menu
    window.setupSideMenuToggle();

    // 2. Dark Mode
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Remove previous listener by cloning or just assigning onclick
        // Ensure initialize logic runs if needed, but simple toggle call is enough
        darkModeToggle.onclick = window.toggleDarkMode;
    }

    // 3. Search Bar
    const searchInput = document.querySelector('.header-search input');
    const searchBtn = document.querySelector('.header-search .search-btn');

    if (searchInput) {
        searchInput.oninput = () => {
            if (searchInput.value.trim().length > 0) window.performSearch(searchInput.value);
            else window.toggleLiveSearchDisplay(false);
        };

        if (searchBtn) {
            searchBtn.onclick = (e) => {
                if (searchInput.value.trim() === '') {
                    e.preventDefault();
                    searchInput.focus();
                } else {
                    window.performSearch(searchInput.value);
                }
            };
        }
    }

    // 4. Update Nav for Auth State (Important if header reloaded)
    // Check if we need to re-run the navbar update logic
    const token = localStorage.getItem('token');
    if (token) {
        // Re-run the force update logic that was at the bottom of this file
        // We can extract that too, but for now let's leave it as is 
        // or copy the essential part here if needed.
        // Actually, restoreSession() does most of this.
        if (window.restoreSession) window.restoreSession();
    }
};

// --- Intercept Fetch for Auth ---
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
    const token = localStorage.getItem('token');
    if (token && url.includes(API_BASEURL)) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return originalFetch(url, options);
};

// --- Toast ---
window.showToast = function (message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    if (type === 'success') toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    else if (type === 'error') {
        toast.innerHTML = `<i class="fas fa-times-circle"></i> <span>${message}</span>`;
        toast.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
    } else toast.innerHTML = `<span>${message}</span>`;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
};

// --- Dark Mode ---
// --- Dark Mode ---
window.initDarkMode = function () {
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
};

window.toggleDarkMode = function () {
    const body = document.body;
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.removeItem('theme');
    }
};

// Initialize immediately
window.initDarkMode();

// --- Init: Run initialization functions on DOM load ---
// --- Init: Run initialization functions on DOM load ---
function parseUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
        return null;
    }
}

function initGlobals() {
    try {
        console.log('Initializing Global JS...');
        // setupSideMenuToggle(); // Now called inside setupHeaderListeners
        if (window.restoreSession) window.restoreSession();
        if (window.updateCartCount) window.updateCartCount();

        // Initial Setup
        if (window.setupHeaderListeners) window.setupHeaderListeners();

        // Fetch products only if search input exists or we are on the index page
        const searchInput = document.querySelector('.header-search input');

        // Fetch products only if search input exists or we are on the index page
        if (searchInput || window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            if (window.fetchAllProducts) window.fetchAllProducts();
        }

        // --- FORCE UPDATE SCRIPT (User Request) ---
        (function forceUpdateNavbarAndTheme() {
            const token = localStorage.getItem('token');
            const user = parseUser();
            const isAdmin = user && user.role === 'admin';

            // 1. Force Navbar Update
            const navLinks = document.querySelectorAll('.desktop-nav a');

            navLinks.forEach(link => {
                const text = link.textContent.trim();

                // Login -> Logout Logic
                if (text === 'Login' && token) {
                    link.textContent = 'Logout';
                    link.href = '#';
                    // Clone to remove old listeners and add new one
                    const newLink = link.cloneNode(true);
                    link.parentNode.replaceChild(newLink, link);

                    newLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (confirm("Are you sure you want to logout?")) {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            localStorage.removeItem('cartItems');
                            window.location.href = 'login.html';
                        }
                    });
                }

                // Admin Link Logic
                if (text === 'Admin') {
                    if (isAdmin) {
                        link.href = 'admin.html';
                        link.textContent = 'Admin ✅'; // Visual indicator
                    } else {
                        link.href = 'admin_login.html';
                    }
                }
            });

            // 2. Fix Profile Page Dark Mode Bug
            if (window.location.pathname.includes('profile.html')) {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme !== 'dark') {
                    document.body.classList.remove('dark-mode');
                    // Ensure specific profile styles don't override
                    document.body.style.backgroundColor = '';
                    document.body.style.color = '';
                }
            }
        })();
        console.log('Global JS Initialized Successfully');
    } catch (error) {
        console.error('Global JS Init Error:', error);
    }
}

// Run immediately if document is already ready (scripts at bottom of body often run after parsing)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobals);
} else {
    initGlobals();
}