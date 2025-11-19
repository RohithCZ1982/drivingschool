// Bookings page JavaScript

let currentTab = 'bookings';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndLoad();
    setupBookingActions();
    setupEmailModal();
});

// Check authentication and load data
async function checkAuthAndLoad() {
    try {
        const response = await fetch('/api/admin/check', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                document.getElementById('bookings-content').style.display = 'block';
                document.getElementById('unauthorized-message').style.display = 'none';
                loadData();
            } else {
                showUnauthorized();
            }
        } else {
            showUnauthorized();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showUnauthorized();
    }
}

// Show unauthorized message
function showUnauthorized() {
    document.getElementById('unauthorized-message').style.display = 'block';
    document.getElementById('bookings-content').style.display = 'none';
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
            showUnauthorized();
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
    const tableWrapper = document.getElementById('bookings-table-wrapper');
    const emptyDiv = document.getElementById('bookings-empty');
    const tableBody = document.getElementById('bookings-table-body');
    
    loadingDiv.style.display = 'none';
    
    if (bookings.length === 0) {
        tableWrapper.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }
    
    emptyDiv.style.display = 'none';
    tableWrapper.style.display = 'block';
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
        const status = (booking.status || 'pending').toLowerCase();
        const hasId = Boolean(booking.id);
        
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
            <td>${getStatusBadge(status)}</td>
            <td>${hasId ? getBookingActions(status, booking.id) : '<span class="text-muted">Unavailable</span>'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Display contacts
function displayContacts(contacts) {
    const loadingDiv = document.getElementById('contacts-loading');
    const tableWrapper = document.getElementById('contacts-table-wrapper');
    const emptyDiv = document.getElementById('contacts-empty');
    const tableBody = document.getElementById('contacts-table-body');
    
    loadingDiv.style.display = 'none';
    
    if (contacts.length === 0) {
        tableWrapper.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }
    
    emptyDiv.style.display = 'none';
    tableWrapper.style.display = 'block';
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
        const customerName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Customer';
        const contactId = contact.id || contact.timestamp || '';
        
        row.innerHTML = `
            <td>${date}<br><small style="color: var(--text-light);">${time}</small></td>
            <td><strong>${customerName}</strong></td>
            <td>${contact.email || 'N/A'}</td>
            <td>${contact.phone || 'N/A'}</td>
            <td><span class="badge badge-contact">${formatService(contact.service)}</span></td>
            <td>${contact.message || '-'}</td>
            <td>
                <div class="contact-actions">
                    <button class="contact-action btn-email" data-action="email" data-contact-id="${contactId}" data-email="${contact.email || ''}" data-name="${customerName}">Email Reply</button>
                    <button class="contact-action btn-delete-contact" data-action="delete" data-contact-id="${contactId}">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Setup contact action handlers after rendering
    setupContactActions();
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

function getStatusBadge(status) {
    const safeStatus = ['pending', 'confirmed', 'rejected'].includes(status) ? status : 'pending';
    const labelMap = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        rejected: 'Rejected'
    };
    return `<span class="status-badge ${safeStatus}">${labelMap[safeStatus]}</span>`;
}

function getBookingActions(status, bookingId) {
    const confirmDisabled = status === 'confirmed';
    const rejectDisabled = status === 'rejected';
    return `
        <div class="booking-actions">
            <button class="booking-action btn-confirm" data-action="confirm" data-booking-id="${bookingId}" ${confirmDisabled ? 'disabled' : ''}>Confirm</button>
            <button class="booking-action btn-reject" data-action="reject" data-booking-id="${bookingId}" ${rejectDisabled ? 'disabled' : ''}>Reject</button>
            <button class="booking-action btn-delete" data-action="delete" data-booking-id="${bookingId}">Delete</button>
        </div>
    `;
}

function setupBookingActions() {
    const tableBody = document.getElementById('bookings-table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', async function(event) {
        const button = event.target.closest('.booking-action');
        if (!button) return;

        const bookingId = button.getAttribute('data-booking-id');
        const action = button.getAttribute('data-action');

        if (!bookingId || !action) {
            showError('Unable to update booking. Missing booking identifier.');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
                return;
            }
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Deleting...';

            try {
                await deleteBooking(bookingId);
                await loadData();
            } catch (error) {
                console.error('Delete error:', error);
                showError(error.message || 'Failed to delete booking.');
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
            return;
        }

        const status = action === 'confirm' ? 'confirmed' : 'rejected';
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Updating...';

        try {
            await updateBookingStatus(bookingId, status);
            await loadData();
        } catch (error) {
            console.error('Status update error:', error);
            showError(error.message || 'Failed to update booking status.');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}

async function updateBookingStatus(bookingId, status) {
    const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        console.error('Error parsing status update response:', error);
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update booking.');
    }

    return data.booking;
}

async function deleteBooking(bookingId) {
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        console.error('Error parsing delete response:', error);
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete booking.');
    }

    return data;
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

// Setup contact action handlers
function setupContactActions() {
    const tableBody = document.getElementById('contacts-table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', async function(event) {
        const button = event.target.closest('.contact-action');
        if (!button) return;

        const contactId = button.getAttribute('data-contact-id');
        const action = button.getAttribute('data-action');

        if (!contactId || !action) {
            showError('Unable to process action. Missing contact identifier.');
            return;
        }

        if (action === 'email') {
            const email = button.getAttribute('data-email');
            const name = button.getAttribute('data-name');
            openEmailModal(email, name, contactId);
        } else if (action === 'delete') {
            if (!confirm('Are you sure you want to delete this contact inquiry? This action cannot be undone.')) {
                return;
            }
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Deleting...';

            try {
                await deleteContact(contactId);
                await loadData();
            } catch (error) {
                console.error('Delete error:', error);
                showError(error.message || 'Failed to delete contact inquiry.');
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    });
}

// Email modal functions
let currentContactId = null;

function setupEmailModal() {
    const form = document.getElementById('email-reply-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await sendReplyEmail();
        });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEmailModal();
            }
        });
    }
}

function openEmailModal(email, name, contactId) {
    const modal = document.getElementById('email-modal');
    const toInput = document.getElementById('reply-to');
    const subjectInput = document.getElementById('reply-subject');
    const messageInput = document.getElementById('reply-message');
    const messageDiv = document.getElementById('email-message');

    if (!modal || !toInput || !subjectInput || !messageInput) return;

    currentContactId = contactId;
    toInput.value = email || '';
    subjectInput.value = 'Re: Your inquiry';
    messageInput.value = `Dear ${name},\n\n`;
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';

    modal.style.display = 'block';
    messageInput.focus();
    messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
}

function closeEmailModal() {
    const modal = document.getElementById('email-modal');
    const form = document.getElementById('email-reply-form');
    const messageDiv = document.getElementById('email-message');

    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset();
    }
    if (messageDiv) {
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
    }
    currentContactId = null;
}

async function sendReplyEmail() {
    const toInput = document.getElementById('reply-to');
    const subjectInput = document.getElementById('reply-subject');
    const messageInput = document.getElementById('reply-message');
    const messageDiv = document.getElementById('email-message');
    const sendButton = document.querySelector('#email-reply-form .btn-send');

    if (!toInput || !subjectInput || !messageInput || !currentContactId) {
        showError('Missing required information to send email.');
        return;
    }

    const toEmail = toInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    if (!toEmail || !subject || !message) {
        if (messageDiv) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'Please fill in all fields.';
            messageDiv.style.display = 'block';
        }
        return;
    }

    if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
    }

    try {
        const response = await fetch(`/api/admin/contacts/${currentContactId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                to: toEmail,
                subject: subject,
                message: message
            })
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            console.error('Error parsing reply response:', error);
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send email.');
        }

        if (messageDiv) {
            messageDiv.className = 'form-message success';
            messageDiv.textContent = 'Email sent successfully!';
            messageDiv.style.display = 'block';
        }

        setTimeout(() => {
            closeEmailModal();
        }, 1500);
    } catch (error) {
        console.error('Send email error:', error);
        if (messageDiv) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = error.message || 'Failed to send email.';
            messageDiv.style.display = 'block';
        }
    } finally {
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send Email';
        }
    }
}

async function deleteContact(contactId) {
    const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        console.error('Error parsing delete response:', error);
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete contact inquiry.');
    }

    return data;
}


