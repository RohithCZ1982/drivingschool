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
from datetime import datetime
from functools import wraps

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials

# Secret key for sessions (use environment variable in production)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# Admin password (set via environment variable, default for development)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Use environment variable for data file path, default to current directory
DATA_DIR = os.environ.get('DATA_DIR', '.')
DATA_FILE = os.path.join(DATA_DIR, 'data.json')

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
            existing_data['contacts'].append(new_data)
        elif new_data.get('type') == 'booking':
            existing_data['bookings'].append(new_data)
        
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

@app.route('/admin.html')
def admin():
    """Serve admin.html (protected by client-side auth check)"""
    # Note: The admin.html page itself checks authentication client-side
    # If not authenticated, it shows the login form
    # Server-side protection is handled by API endpoints via @admin_required decorator
    return send_from_directory('.', 'admin.html')

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

