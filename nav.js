// Navigation script - checks admin status and adds admin menu

document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
    addLogoutButton(); // Add logout button for all users
});

// Check if admin is logged in and add admin menu item
async function checkAdminStatus() {
    try {
        const response = await fetch('/api/admin/check', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                addAdminMenuItem();
            }
        }
    } catch (error) {
        // Silently fail - user is not admin
        console.log('Admin check failed:', error);
    }
}

// Add admin menu item to navigation
function addAdminMenuItem() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Check if admin menu item already exists
    if (document.querySelector('.nav-menu .admin-menu-item')) {
        return;
    }
    
    // Create admin menu item
    const adminMenuItem = document.createElement('li');
    adminMenuItem.className = 'admin-menu-item';
    
    // Check current page to set active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isBookingsPage = currentPage === 'bookings.html';
    
    adminMenuItem.innerHTML = `
        <a href="bookings.html" class="${isBookingsPage ? 'active' : ''}"> Dashboard</a>
    `;
    
    // Add before Contact menu item if it exists, otherwise at the end
    const contactItem = Array.from(navMenu.children).find(li => 
        li.querySelector('a[href*="contact"]')
    );
    
    if (contactItem) {
        navMenu.insertBefore(adminMenuItem, contactItem);
    } else {
        navMenu.appendChild(adminMenuItem);
    }
}

// Add logout button to navigation
function addLogoutButton() {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;
    
    // Check if logout button already exists
    if (document.querySelector('.btn-icon-logout')) {
        return;
    }
    
    // Create logout button
    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn-icon btn-icon-logout';
    logoutButton.title = 'Logout';
    logoutButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    logoutButton.onclick = logout;
    
    // Add at the beginning of nav-actions
    navActions.insertBefore(logoutButton, navActions.firstChild);
}

// Logout function - works for both admin and regular users
async function logout() {
    try {
        // Try to logout admin session if exists
        const response = await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // Remove admin menu items if they exist
        const adminMenuItem = document.querySelector('.admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.remove();
        }
        
        // Redirect to login page (works for both admin and regular users)
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect to login page even if logout fails
        window.location.href = 'login.html';
    }
}

