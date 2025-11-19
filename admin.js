// Admin Dashboard JavaScript

let currentTab = 'bookings';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupLoginForm();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/check', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                showDashboard();
                loadData();
            } else {
                showLogin();
            }
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

// Setup login form
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('login-message');
            
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
                        showDashboard();
                        loadData();
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
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            showLogin();
            document.getElementById('password').value = '';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Still show login even if logout fails
        showLogin();
    }
}

// Show login screen
function showLogin() {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}

// Show dashboard
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
}

// Load data from server
async function loadData() {
    try {
        const response = await fetch('/api/admin/bookings', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                updateStats(data);
                displayBookings(data.bookings);
                displayContacts(data.contacts);
            } else {
                showError('Failed to load data');
            }
        } else if (response.status === 401) {
            showLogin();
        } else {
            showError('Error loading data');
        }
    } catch (error) {
        console.error('Load data error:', error);
        showError('Error connecting to server');
    }
}

// Update statistics
function updateStats(data) {
    const bookings = data.bookings || [];
    const contacts = data.contacts || [];
    
    document.getElementById('total-bookings').textContent = bookings.length;
    document.getElementById('total-contacts').textContent = contacts.length;
    
    // Count today's entries
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.timestamp && b.timestamp.startsWith(today)).length;
    const todayContacts = contacts.filter(c => c.timestamp && c.timestamp.startsWith(today)).length;
    
    document.getElementById('today-bookings').textContent = todayBookings;
    document.getElementById('today-contacts').textContent = todayContacts;
}

// Display bookings
function displayBookings(bookings) {
    const loadingDiv = document.getElementById('bookings-loading');
    const contentDiv = document.getElementById('bookings-content');
    const emptyDiv = document.getElementById('bookings-empty');
    const tableBody = document.getElementById('bookings-table-body');
    
    loadingDiv.style.display = 'none';
    
    if (bookings.length === 0) {
        contentDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }
    
    emptyDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    tableBody.innerHTML = '';
    
    // Sort by timestamp (newest first)
    bookings.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        const date = booking.timestamp ? new Date(booking.timestamp).toLocaleDateString() : 'N/A';
        const time = booking.timestamp ? new Date(booking.timestamp).toLocaleTimeString() : '';
        
        row.innerHTML = `
            <td>${date}<br><small style="color: var(--text-light);">${time}</small></td>
            <td><strong>${booking.firstName || ''} ${booking.lastName || ''}</strong></td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.phone || 'N/A'}</td>
            <td><span class="badge badge-booking">${formatLessonType(booking.lessonType)}</span></td>
            <td>${booking.preferredDate || 'N/A'}</td>
            <td>${booking.preferredTime || 'N/A'}</td>
            <td>${booking.pickupLocation || 'Not specified'}</td>
            <td>${booking.message || '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Display contacts
function displayContacts(contacts) {
    const loadingDiv = document.getElementById('contacts-loading');
    const contentDiv = document.getElementById('contacts-content');
    const emptyDiv = document.getElementById('contacts-empty');
    const tableBody = document.getElementById('contacts-table-body');
    
    loadingDiv.style.display = 'none';
    
    if (contacts.length === 0) {
        contentDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }
    
    emptyDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    tableBody.innerHTML = '';
    
    // Sort by timestamp (newest first)
    contacts.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
    });
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        const date = contact.timestamp ? new Date(contact.timestamp).toLocaleDateString() : 'N/A';
        const time = contact.timestamp ? new Date(contact.timestamp).toLocaleTimeString() : '';
        
        row.innerHTML = `
            <td>${date}<br><small style="color: var(--text-light);">${time}</small></td>
            <td><strong>${contact.firstName || ''} ${contact.lastName || ''}</strong></td>
            <td>${contact.email || 'N/A'}</td>
            <td>${contact.phone || 'N/A'}</td>
            <td><span class="badge badge-contact">${formatService(contact.service)}</span></td>
            <td>${contact.message || '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Format lesson type
function formatLessonType(type) {
    if (!type) return 'N/A';
    const types = {
        'automatic': 'Automatic',
        'manual': 'Manual',
        'motorcycle': 'Motorcycle',
        'moped': 'Moped',
        'licence-upgrade': 'Licence Upgrade'
    };
    return types[type] || type;
}

// Format service
function formatService(service) {
    if (!service) return 'N/A';
    const services = {
        'driving-lessons': 'Driving Lessons',
        'licence-upgrade': 'Licence Upgrade',
        'senior-renewal': 'Senior Renewal',
        'overseas-licence': 'Overseas Licence',
        'moped-licence': 'Moped Licence',
        'motorcycle-lessons': 'Motorcycle Lessons',
        'gift-certificates': 'Gift Certificates',
        'lesson-packages': 'Lesson Packages',
        'other': 'Other'
    };
    return services[service] || service;
}

// Switch tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// Show message
function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`;
    element.style.display = 'block';
}

// Show error
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 5000);
    }
}

