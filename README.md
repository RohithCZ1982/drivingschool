# Drive It Yourself - Driving School Website

A modern, responsive website for a driving school business, similar to driveityourself.com.au, with JSON data storage functionality.

## Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Multiple Pages**: Home, About, Services, and Contact pages
- **Contact Form**: Submit inquiries that are stored in JSON format
- **Booking System**: Book driving lessons with form submissions saved to JSON
- **Testimonials**: Display customer testimonials loaded from JSON
- **Admin Dashboard**: Password-protected admin page to view all bookings and contact inquiries
- **JSON Data Storage**: All form submissions and data stored in `data.json`

## File Structure

```
Drivingschool/
├── index.html          # Homepage
├── about.html          # About Us page
├── services.html       # Services page
├── contact.html        # Contact & Booking page
├── styles.css          # Main stylesheet
├── script.js           # JavaScript functionality
├── admin.html          # Admin dashboard page
├── admin.js            # Admin dashboard JavaScript
├── data.json           # JSON data storage
├── server.py           # Python Flask server
├── requirements.txt    # Python dependencies
├── Procfile            # Process file for Render/Heroku
├── render.yaml         # Render deployment configuration
├── runtime.txt         # Python version specification
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## How to Use

### Option 1: Simple Static Site (No Server)
1. **Open the Website**: Simply open `index.html` in a web browser
2. **View Pages**: Navigate through Home, About, Services, and Contact pages
3. **Submit Forms**: 
   - Form submissions are saved to browser localStorage
   - Data is logged to browser console for manual addition to `data.json`

### Option 2: With Python Server (Local Development)
1. **Install Python** (Python 3.6+ required, if not already installed)
2. **Install Dependencies**: Run `pip install -r requirements.txt` in the project directory
3. **Start the Server**: Run `python server.py` in the project directory
4. **Access the Site**: Open `http://localhost:5000` in your browser
5. **Submit Forms**: 
   - Contact form submissions are automatically saved to `data.json`
   - Booking form submissions are automatically saved to `data.json`
6. **View Data**: Check `data.json` to see all stored submissions

### Option 3: Deploy to Render (Production)
1. **Create a Render Account**: Sign up at [render.com](https://render.com)
2. **Connect Your Repository**: 
   - Push your code to GitHub/GitLab/Bitbucket
   - Connect your repository to Render
3. **Create a New Web Service**:
   - Select your repository
   - Render will auto-detect the Python/Flask app
   - Or use the `render.yaml` file for automatic configuration
4. **Configure Settings**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app`
   - **Python Version**: 3.11.0 (specified in `runtime.txt`)
5. **Deploy**: Click "Create Web Service" and Render will deploy your app
6. **Access Your Site**: Your site will be available at `https://your-app-name.onrender.com`

**Note**: Render provides a free tier with some limitations. For production use, consider upgrading to a paid plan.

## Data Storage

All form submissions are stored in `data.json` with the following structure:

```json
{
  "contacts": [
    {
      "type": "contact",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "0437483154",
      "email": "john@example.com",
      "service": "driving-lessons",
      "message": "I would like to book a lesson",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "bookings": [
    {
      "type": "booking",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "0437483154",
      "email": "jane@example.com",
      "lessonType": "automatic",
      "preferredDate": "2024-01-15",
      "preferredTime": "10:00",
      "pickupLocation": "123 Main St",
      "message": "First lesson",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "testimonials": [...],
  "services": [...]
}
```

## Admin Dashboard

Access the admin dashboard at `/admin.html` to view all booking requests and contact inquiries.

**Default Password**: `admin123` (change this in production!)

**To change the admin password**:
- Set the `ADMIN_PASSWORD` environment variable in Render
- Or modify `ADMIN_PASSWORD` in `server.py` (not recommended for production)

**Features**:
- View all booking requests with details (name, email, phone, lesson type, preferred date/time, etc.)
- View all contact form submissions
- Statistics dashboard showing total bookings and contacts
- Today's activity counter
- Secure password-protected access
- Session-based authentication

## Important Notes

⚠️ **Data Storage**: 
- **With Server**: If you run `python server.py`, form submissions are automatically saved to `data.json`
- **Without Server**: Form data is stored in browser localStorage and logged to console
- **On Render**: Data is saved to `data.json` in the filesystem (note: data may be lost on redeployments)
- For production use, consider using a proper database (MongoDB, PostgreSQL, etc.) instead of JSON files
- The included `server.py` uses Flask with Gunicorn for production deployment

⚠️ **Security**: 
- **Change the default admin password** before deploying to production
- Set `ADMIN_PASSWORD` environment variable in Render dashboard
- Set `SECRET_KEY` environment variable for session security (auto-generated if not set)
- For production, use strong passwords and consider implementing additional security measures

⚠️ **Render Deployment Notes**:
- The app is configured to work with Render's environment
- Uses Gunicorn as the production WSGI server
- Automatically uses the PORT environment variable set by Render
- Static files are served directly by Flask
- JSON data file persists during the service lifetime but may be reset on redeployments

## Customization

- **Colors**: Modify CSS variables in `styles.css` (--primary-color, --secondary-color, etc.)
- **Content**: Edit HTML files to update text, images, and information
- **Services**: Add or modify services in `data.json`
- **Testimonials**: Add testimonials to the `testimonials` array in `data.json`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contact Information

- Phone: 0437 483 154
- Email: info@driveityourself.com
- Hours: Monday - Sunday: 7am - 6pm

## License

This project is created for educational/demonstration purposes.

