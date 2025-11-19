#!/usr/bin/env python3
"""
Flask server for handling JSON data storage
Run with: python server.py (development)
Or: gunicorn server:app (production)
"""

from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import json
import os
import secrets
import smtplib
from datetime import datetime
from functools import wraps
from email.mime.text import MIMEText

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials

# Secret key for sessions (use environment variable in production)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# Admin password (set via environment variable, default for development)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Use environment variable for data file path, default to current directory
DATA_DIR = os.environ.get('DATA_DIR', '.')
DATA_FILE = os.path.join(DATA_DIR, 'data.json')

# Email configuration (optional)
SMTP_SERVER = os.environ.get('SMTP_SERVER')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL')
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() != 'false'

def read_data():
    """Read data from JSON file"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f'Error reading data file: {e}')
    return {'contacts': [], 'bookings': [], 'testimonials': [], 'services': []}

def write_data(data):
    """Write data to JSON file"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'Error writing data file: {e}')
        return False

def send_email(to_email, subject, body):
    """Send an email using configured SMTP settings"""
    if not (SMTP_SERVER and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL):
        print('Email configuration missing; skipping email notification.')
        return False
    
    if not to_email:
        print('Recipient email missing; skipping email notification.')
        return False
    
    message = MIMEText(body, 'plain')
    message['Subject'] = subject
    message['From'] = SMTP_FROM_EMAIL
    message['To'] = to_email
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f'Error sending email: {e}')
        return False

def send_booking_confirmation_email(booking):
    """Send confirmation email to the customer when booking is accepted"""
    email = (booking.get('email') or '').strip()
    first_name = (booking.get('firstName') or '').strip()
    last_name = (booking.get('lastName') or '').strip()
    customer_name = (f'{first_name} {last_name}'.strip()) or 'Customer'
    
    body = (
        f'Dear {customer_name}\n\n'
        'Thanks for the booking. We are happy to inform that your booking is confirmed.\n\n'
        'With regards,\n'
        'Safe Driving.'
    )
    subject = 'Booking Confirmation - Safe Driving'
    
    return send_email(email, subject, body)

@app.route('/api/save', methods=['POST', 'OPTIONS'])
def save_data():
    """Save form data to JSON file"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        new_data = request.get_json()
        existing_data = read_data()
        
        # Add timestamp if not present
        if 'timestamp' not in new_data:
            new_data['timestamp'] = datetime.now().isoformat()
        
        # Add new data based on type
        if new_data.get('type') == 'contact':
            new_data.setdefault('id', secrets.token_hex(8))
            existing_data['contacts'].append(new_data)
        elif new_data.get('type') == 'booking':
            existing_data.setdefault('bookings', [])
            bookings = existing_data['bookings']
            
            preferred_date = new_data.get('preferredDate')
            preferred_time = new_data.get('preferredTime')
            
            if preferred_date and preferred_time:
                conflict = next(
                    (
                        booking for booking in bookings
                        if booking.get('preferredDate') == preferred_date
                        and booking.get('preferredTime') == preferred_time
                        and (booking.get('status', 'pending') != 'rejected')
                    ),
                    None
                )
                if conflict:
                    return jsonify({
                        'success': False,
                        'message': 'This date and time is already booked. Please choose another slot unless the existing booking is rejected.'
                    }), 409
            
            new_data.setdefault('id', secrets.token_hex(8))
            new_data['status'] = new_data.get('status', 'pending')
            new_data['statusUpdatedAt'] = datetime.now().isoformat()
            bookings.append(new_data)
        
        if write_data(existing_data):
            return jsonify({'success': True, 'message': 'Data saved successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Error saving data'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Invalid data format: {str(e)}'}), 400

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get all data from JSON file"""
    data = read_data()
    return jsonify(data), 200

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/admin/login', methods=['POST', 'OPTIONS'])
def admin_login():
    """Admin login endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        password = data.get('password', '')
        
        if password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return jsonify({'success': True, 'message': 'Login successful'}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid password'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 400

@app.route('/api/admin/logout', methods=['POST', 'OPTIONS'])
def admin_logout():
    """Admin logout endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    session.pop('admin_logged_in', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@app.route('/api/admin/check', methods=['GET'])
def check_admin():
    """Check if admin is logged in"""
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True}), 200
    return jsonify({'authenticated': False}), 401

@app.route('/api/admin/bookings', methods=['GET'])
@admin_required
def get_bookings():
    """Get all bookings (admin only)"""
    data = read_data()
    return jsonify({
        'success': True,
        'bookings': data.get('bookings', []),
        'contacts': data.get('contacts', []),
        'total_bookings': len(data.get('bookings', [])),
        'total_contacts': len(data.get('contacts', []))
    }), 200

@app.route('/api/admin/bookings/<booking_id>/status', methods=['PATCH', 'OPTIONS'])
@admin_required
def update_booking_status(booking_id):
    """Update the status of a booking"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        payload = request.get_json() or {}
        new_status = payload.get('status', '').lower()
        
        if new_status not in ['pending', 'confirmed', 'rejected']:
            return jsonify({'success': False, 'message': 'Invalid status value'}), 400
        
        data = read_data()
        bookings = data.get('bookings', [])
        
        for booking in bookings:
            if booking.get('id') == booking_id:
                previous_status = (booking.get('status') or 'pending').lower()
                if new_status != 'rejected':
                    preferred_date = booking.get('preferredDate')
                    preferred_time = booking.get('preferredTime')
                    if preferred_date and preferred_time:
                        conflict = next(
                            (
                                other for other in bookings
                                if other is not booking
                                and other.get('preferredDate') == preferred_date
                                and other.get('preferredTime') == preferred_time
                                and (other.get('status', 'pending') != 'rejected')
                            ),
                            None
                        )
                        if conflict:
                            return jsonify({
                                'success': False,
                                'message': 'Another booking already occupies this date and time.'
                            }), 409
                
                booking['status'] = new_status
                booking['statusUpdatedAt'] = datetime.now().isoformat()
                
                if write_data(data):
                    if previous_status != 'confirmed' and new_status == 'confirmed':
                        send_booking_confirmation_email(booking)
                    return jsonify({'success': True, 'booking': booking}), 200
                else:
                    return jsonify({'success': False, 'message': 'Error saving data'}), 500
        
        return jsonify({'success': False, 'message': 'Booking not found'}), 404
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Invalid data format: {str(e)}'}), 400

@app.route('/api/admin/bookings/<booking_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_booking(booking_id):
    """Delete a booking"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = read_data()
        bookings = data.get('bookings', [])
        
        # Find and remove the booking
        original_length = len(bookings)
        data['bookings'] = [b for b in bookings if b.get('id') != booking_id]
        
        if len(data['bookings']) == original_length:
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        if write_data(data):
            return jsonify({'success': True, 'message': 'Booking deleted successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Error saving data'}), 500
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting booking: {str(e)}'}), 400

@app.route('/api/admin/contacts/<contact_id>/reply', methods=['POST', 'OPTIONS'])
@admin_required
def send_contact_reply(contact_id):
    """Send a reply email to a contact inquiry"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        payload = request.get_json() or {}
        to_email = payload.get('to', '').strip()
        subject = payload.get('subject', '').strip()
        message = payload.get('message', '').strip()
        
        if not to_email or not subject or not message:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Send the email
        if send_email(to_email, subject, message):
            return jsonify({'success': True, 'message': 'Email sent successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to send email. Check SMTP configuration.'}), 500
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error sending email: {str(e)}'}), 400

@app.route('/api/admin/contacts/<contact_id>', methods=['DELETE', 'OPTIONS'])
@admin_required
def delete_contact(contact_id):
    """Delete a contact inquiry"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = read_data()
        contacts = data.get('contacts', [])
        
        # Find and remove the contact
        original_length = len(contacts)
        data['contacts'] = [c for c in contacts if c.get('id') != contact_id and c.get('timestamp') != contact_id]
        
        if len(data['contacts']) == original_length:
            return jsonify({'success': False, 'message': 'Contact inquiry not found'}), 404
        
        if write_data(data):
            return jsonify({'success': True, 'message': 'Contact inquiry deleted successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Error saving data'}), 500
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting contact: {str(e)}'}), 400

@app.route('/')
def index():
    """Serve login.html as default page"""
    return send_from_directory('.', 'login.html')

@app.route('/index.html')
def home():
    """Serve index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/about.html')
def about():
    """Serve about.html"""
    return send_from_directory('.', 'about.html')

@app.route('/services.html')
def services():
    """Serve services.html"""
    return send_from_directory('.', 'services.html')

@app.route('/contact.html')
def contact():
    """Serve contact.html"""
    return send_from_directory('.', 'contact.html')

@app.route('/login.html')
def login_page():
    """Serve login.html"""
    return send_from_directory('.', 'login.html')

@app.route('/bookings.html')
def bookings():
    """Serve bookings.html"""
    return send_from_directory('.', 'bookings.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images, etc.)"""
    # Security: prevent directory traversal
    if '..' in path or path.startswith('/'):
        return 'Forbidden', 403
    
    # Allowed file extensions
    allowed_extensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']
    file_ext = os.path.splitext(path)[1].lower()
    
    if file_ext not in allowed_extensions and path not in ['data.json']:
        return 'Forbidden', 403
    
    # Check if file exists
    if os.path.exists(path) and os.path.isfile(path):
        return send_from_directory('.', path)
    else:
        return 'File not found', 404

if __name__ == '__main__':
    # Get port from environment variable (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    # Disable debug mode in production
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f'Starting Flask server on port {port}...')
    print(f'Debug mode: {debug}')
    app.run(host='0.0.0.0', port=port, debug=debug)

