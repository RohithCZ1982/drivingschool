# Deployment Guide for Render

This guide will help you deploy the Drive It Yourself website to Render.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. Your code pushed to a repository
3. A Render account (sign up at [render.com](https://render.com))

## Step-by-Step Deployment

### 1. Push Your Code to Git

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Drive It Yourself website"

# Add your remote repository
git remote add origin <your-repository-url>

# Push to repository
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to deploy

#### Option B: Manual Configuration

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure the service:
   - **Name**: `drive-it-yourself` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app`
5. Click "Create Web Service"

### 3. Environment Variables (Optional)

If you need to customize settings, you can add environment variables in Render:

- `FLASK_ENV`: Set to `production` (default)
- `PORT`: Automatically set by Render (don't override)
- `DATA_DIR`: Optional, for custom data directory

### 4. Wait for Deployment

Render will:
1. Install dependencies from `requirements.txt`
2. Build your application
3. Start the server using Gunicorn
4. Provide you with a URL (e.g., `https://drive-it-yourself.onrender.com`)

### 5. Verify Deployment

1. Visit your Render URL
2. Test the contact form
3. Test the booking form
4. Check that testimonials load correctly

## Important Notes

### Data Persistence

⚠️ **Important**: The `data.json` file is stored in the filesystem. On Render's free tier:
- Data persists during the service lifetime
- Data may be lost when:
  - The service is redeployed
  - The service is stopped and restarted
  - The service is deleted

**Recommendation**: For production, consider using:
- Render PostgreSQL database (free tier available)
- MongoDB Atlas (free tier available)
- Other cloud databases

### Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may be slow
- Limited resources

For production use, consider upgrading to a paid plan.

### Custom Domain

You can add a custom domain in Render:
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that `requirements.txt` is correct
- Verify Python version in `runtime.txt`
- Check build logs in Render dashboard

### App Won't Start
- Verify `Procfile` or start command is correct
- Check that `gunicorn` is in `requirements.txt`
- Review logs in Render dashboard

### Static Files Not Loading
- Ensure all HTML, CSS, JS files are in the root directory
- Check that routes in `server.py` are correct
- Verify file paths in HTML files

### Forms Not Saving
- Check that the `/api/save` endpoint is working
- Verify CORS is enabled (should be automatic)
- Check browser console for errors
- Review server logs in Render dashboard

## Updating Your Deployment

1. Make changes to your code
2. Commit and push to your repository:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Render will automatically detect the changes and redeploy
4. Wait for the deployment to complete

## Support

For issues specific to Render, check:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)

For issues with the application, check the logs in your Render dashboard.

