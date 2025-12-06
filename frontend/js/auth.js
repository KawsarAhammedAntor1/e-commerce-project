const API_BASE_URL = 'http://localhost:5000/api';

async function handleSignup(name, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration Successful! Please Login to continue.");
            window.location.href = 'login.html'; // Redirect to login page
        } else {
            alert(`Signup Failed: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error during signup:', error);
        alert('An error occurred during signup. Please try again.');
    }
}

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Save token and user info to localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Token saved:', localStorage.getItem('authToken'));

            // Role-based redirection for login.html
            if (data.user.role === 'admin') {
                alert('Login Successful! Please login from Admin Panel.');
                localStorage.removeItem('authToken'); // Clear token for admin trying to login via user panel
                localStorage.removeItem('user');
            } else {
                alert('Login Successful!');
                window.location.href = 'index.html'; // Redirect to home page for normal users
            }
        } else {
            alert(`Login Failed: ${data.message || 'Invalid Credentials'}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
}
