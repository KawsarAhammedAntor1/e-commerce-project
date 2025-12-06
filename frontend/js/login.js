document.addEventListener('DOMContentLoaded', () => {
    // --- Backend URL ---
    const API_BASE_URL = 'http://localhost:5000/api';

    // --- Tab Switching Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContainers = document.querySelectorAll('.form-container');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            formContainers.forEach(form => form.classList.remove('active'));
            button.classList.add('active');
            const tab = button.getAttribute('data-tab');
            document.getElementById(tab).classList.add('active');
        });
    });

    // --- Handle Login ---
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server Error (Not JSON). Check Backend Console.");
                }

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    Swal.fire({
                        icon: 'success',
                        title: 'Welcome Back!',
                        text: 'Login Successful!',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: data.message || 'Please check credentials.'
                    });
                }
            } catch (error) {
                console.error('Login Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Connection failed! Check backend server.'
                });
            }
        });
    }

    // --- Handle Sign Up (FIXED) ---
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password.length < 6) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Weak Password',
                    text: 'Password must be at least 6 characters long.'
                });
                return;
            }

            if (password !== confirmPassword) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Password Mismatch',
                    text: 'Passwords do not match!'
                });
                return;
            }

            try {
                // FIX: '/auth/register' পরিবর্তন করে '/auth/signup' করা হয়েছে
                // কারণ 404 এরর মানে register রাউটটি ব্যাকএন্ডে নেই
                const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Registration Successful!',
                        text: 'Please Login to continue.',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // অটোমেটিক লগইন ট্যাবে নিয়ে যাওয়া হবে
                        const loginTabBtn = document.querySelector('[data-tab="login"]');
                        if (loginTabBtn) loginTabBtn.click();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Registration Failed',
                        text: data.message || 'Server rejected registration.'
                    });
                }
            } catch (error) {
                console.error('Signup Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Connection failed!'
                });
            }
        });
    }


    // --- Forgot Password Logic ---
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotModal = document.getElementById('forgot-password-modal');
    const closeForgotModal = document.getElementById('close-forgot-modal');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const forgotStep1 = document.getElementById('forgot-step-1');
    const forgotStep2 = document.getElementById('forgot-step-2');

    if (forgotPasswordLink && forgotModal) {
        // Open Modal
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = 'block';
            forgotStep1.style.display = 'block';
            forgotStep2.style.display = 'none';
        });

        // Close Modal
        closeForgotModal.addEventListener('click', () => {
            forgotModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.style.display = 'none';
            }
        });

        // Send OTP
        sendOtpBtn.addEventListener('click', async () => {
            const email = document.getElementById('forgot-email').value;
            if (!email) {
                Swal.fire({
                    icon: 'warning',
                    text: 'Please enter your email.'
                });
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'OTP Sent',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    forgotStep1.style.display = 'none';
                    forgotStep2.style.display = 'block';
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: data.message || 'Failed to send OTP.'
                    });
                }
            } catch (error) {
                console.error('Error sending OTP:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Server Error. Please try again.'
                });
            }
        });

        // Reset Password
        resetPasswordBtn.addEventListener('click', async () => {
            const email = document.getElementById('forgot-email').value;
            const otp = document.getElementById('forgot-otp').value;
            const newPassword = document.getElementById('new-password').value;

            if (!otp || !newPassword) {
                Swal.fire({
                    icon: 'warning',
                    text: 'Please fill in all fields.'
                });
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp, newPassword })
                });
                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Password Reset!',
                        text: data.message,
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        forgotModal.style.display = 'none';
                        // Switch to login tab
                        const loginTabBtn = document.querySelector('[data-tab="login"]');
                        if (loginTabBtn) loginTabBtn.click();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: data.message || 'Password reset failed.'
                    });
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Server Error. Please try again.'
                });
            }
        });
    }
});