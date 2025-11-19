// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Load testimonials from JSON
    loadTestimonials();

    // Setup form handlers
    setupContactForm();
    setupBookingForm();
});

// Load testimonials from JSON file
async function loadTestimonials() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        const testimonialsContainer = document.getElementById('testimonials-container');
        if (testimonialsContainer && data.testimonials) {
            testimonialsContainer.innerHTML = '';
            
            data.testimonials.forEach(testimonial => {
                const testimonialCard = document.createElement('div');
                testimonialCard.className = 'testimonial-card';
                testimonialCard.innerHTML = `
                    <p>"${testimonial.message}"</p>
                    <div class="testimonial-author">- ${testimonial.name}</div>
                `;
                testimonialsContainer.appendChild(testimonialCard);
            });
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
        // If testimonials fail to load, show default ones
        showDefaultTestimonials();
    }
}

// Show default testimonials if JSON fails to load
function showDefaultTestimonials() {
    const testimonialsContainer = document.getElementById('testimonials-container');
    if (testimonialsContainer) {
        const defaultTestimonials = [
            {
                message: "Excellent driving school! The instructor was patient and professional. I passed my test on the first try!",
                name: "Sarah Johnson"
            },
            {
                message: "Great experience learning to drive. The lessons were well-structured and I felt confident behind the wheel.",
                name: "Michael Chen"
            },
            {
                message: "Highly recommend! The instructor made learning to drive manual transmission easy and stress-free.",
                name: "Emma Williams"
            }
        ];

        testimonialsContainer.innerHTML = '';
        defaultTestimonials.forEach(testimonial => {
            const testimonialCard = document.createElement('div');
            testimonialCard.className = 'testimonial-card';
            testimonialCard.innerHTML = `
                <p>"${testimonial.message}"</p>
                <div class="testimonial-author">- ${testimonial.name}</div>
            `;
            testimonialsContainer.appendChild(testimonialCard);
        });
    }
}

// Setup Contact Form Handler
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            type: 'contact',
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            service: document.getElementById('service').value,
            message: document.getElementById('message').value,
            timestamp: new Date().toISOString()
        };

        try {
            await saveToJSON(formData);
            showMessage('contact-form-message', 'Thank you for contacting us! We will get back to you soon.', 'success');
            contactForm.reset();
        } catch (error) {
            console.error('Error saving contact form:', error);
            showMessage('contact-form-message', 'There was an error submitting your message. Please try again or call us directly.', 'error');
        }
    });
}

// Setup Booking Form Handler
function setupBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            type: 'booking',
            firstName: document.getElementById('booking-firstName').value,
            lastName: document.getElementById('booking-lastName').value,
            phone: document.getElementById('booking-phone').value,
            email: document.getElementById('booking-email').value,
            lessonType: document.getElementById('lesson-type').value,
            preferredDate: document.getElementById('preferred-date').value,
            preferredTime: document.getElementById('preferred-time').value,
            pickupLocation: document.getElementById('pickup-location').value,
            message: document.getElementById('booking-message').value,
            timestamp: new Date().toISOString()
        };

        try {
            await saveToJSON(formData);
            showMessage('booking-form-message', 'Your lesson has been booked! We will confirm the details with you shortly.', 'success');
            bookingForm.reset();
        } catch (error) {
            console.error('Error saving booking:', error);
            const message = error && error.message
                ? error.message
                : 'There was an error booking your lesson. Please try again or call us directly.';
            showMessage('booking-form-message', message, 'error');
        }
    });
}

// Save data to JSON file
async function saveToJSON(data) {
    try {
        // Try to save via server API first (if server.py is running)
        // Use relative URL - will work if served from server, fail gracefully if opened directly
        let response;
        try {
            response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (networkError) {
            console.log('Server not available, using localStorage fallback');
        }

        if (response) {
            let result = {};
            try {
                result = await response.json();
            } catch (parseError) {
                console.error('Error parsing server response:', parseError);
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to save data at this time.');
            }

            console.log('Data saved successfully via server');
            return result;
        }

        // Fallback: Use localStorage and log to console
        let existingData = { contacts: [], bookings: [], testimonials: [] };
        
        try {
            const stored = localStorage.getItem('drivingSchoolData');
            if (stored) {
                existingData = JSON.parse(stored);
            }
        } catch (error) {
            console.log('No existing data in localStorage');
        }

        // Add new data
        if (data.type === 'contact') {
            existingData.contacts.push(data);
        } else if (data.type === 'booking') {
            data.status = data.status || 'pending';
            existingData.bookings.push(data);
        }

        // Save to localStorage
        localStorage.setItem('drivingSchoolData', JSON.stringify(existingData));
        
        // Log to console for manual addition to JSON file
        console.log('Data saved to localStorage. To save to JSON file, run: python server.py');
        console.log('Current data:', JSON.stringify(existingData, null, 2));
        
        return existingData;
    } catch (error) {
        throw new Error('Failed to save data: ' + error.message);
    }
}

// Show form message
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.style.display = 'block';
        
        // Scroll to message
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Set minimum date for booking form to today
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('preferred-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

