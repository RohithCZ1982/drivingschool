// Login Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    setupAdminForm();
});

// Select User option - redirect to main site
function selectUser() {
    window.location.href = 'index.html';
}

// Select Admin option - show login form
function selectAdmin() {
    // Hide options
    document.getElementById('login-options').style.display = 'none';
    
    // Show admin login form
    const adminForm = document.getElementById('admin-login-form');
    adminForm.classList.add('active');
    
    // Highlight admin option
    document.getElementById('admin-option').classList.add('active');
    document.getElementById('user-option').classList.remove('active');
}

// Show options again (back button)
function showOptions() {
    // Show options
    document.getElementById('login-options').style.display = 'flex';
    
    // Hide admin login form
    const adminForm = document.getElementById('admin-login-form');
    adminForm.classList.remove('active');
    
    // Clear form
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-message').textContent = '';
    document.getElementById('admin-message').className = 'form-message';
    
    // Reset option highlights
    document.getElementById('admin-option').classList.remove('active');
    document.getElementById('user-option').classList.remove('active');
}

// Setup admin login form
function setupAdminForm() {
    const adminForm = document.getElementById('admin-form');
    if (!adminForm) return;
    
    adminForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        const messageDiv = document.getElementById('admin-message');
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ password: password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'bookings.html';
                }, 500);
            } else {
                showMessage(messageDiv, data.message || 'Invalid password', 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'Error connecting to server', 'error');
            console.error('Login error:', error);
        }
    });
}

// Show message
function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`;
    element.style.display = 'block';
}

