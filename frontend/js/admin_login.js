const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the form element.
    const loginForm = document.getElementById('admin-login-form');

    // 2. Get input fields (IDs: adminEmail, adminPassword)
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stops the default page refresh

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (!email || !password) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Input',
                    text: 'Please enter both email and password.'
                });
                return;
            }

            try {
                // FIX: Changing endpoint to the available generic login route in authRoutes.js
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                // FIX: Must check for non-JSON response (like 404 HTML body)
                if (!response.ok) {
                    let errorData;
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        errorData = await response.json();
                    } else {
                        // Server returned non-JSON response (e.g. HTML 404 page)
                        throw new Error(`Server error: ${response.status} (${response.statusText})`);
                    }

                    if (response.status === 401) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Login Failed',
                            text: 'Invalid Admin Credentials.'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Login Failed',
                            text: errorData.message || 'Server Error'
                        });
                    }

                    // Clear inputs on failure
                    if (emailInput) emailInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                    return;
                }

                const data = await response.json();

                // Assuming login is successful and returns user data + token
                if (data.user && data.user.role === 'admin') {
                    // Save token and user details
                    // The 'token' item is used by global.js for Auth headers
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Admin Login Successful! Redirecting to dashboard...',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'admin.html'; // Redirect to dashboard
                    });
                } else {
                    // User is a regular user but tried to login via admin page
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'Not an Admin user.'
                    });
                    if (emailInput) emailInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                }

            } catch (error) {
                console.error('Error during login:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'System Error',
                    text: 'Connection or server error. Check console for details.'
                });
            }
        });
    }
});
