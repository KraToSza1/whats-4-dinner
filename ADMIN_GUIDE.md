# 👑 Admin Dashboard Guide

## Overview

The Admin Dashboard provides local development tools for managing and monitoring your app. It's only available in development mode or when explicitly enabled.

## Accessing Admin Dashboard

### Method 1: Via Menu

1. Click the menu button (☰) in the header
2. Scroll to the bottom of the menu
3. Click "👑 Admin" (only visible in dev mode)

### Method 2: Direct URL

Navigate to: `http://localhost:5173/admin`

## Admin Login

When you first access the admin dashboard, you'll be prompted for an admin password:

- **Default Password**: `admin123`
- **Custom Password**: Set `VITE_ADMIN_PASSWORD` in your `.env` file

The admin session lasts for 24 hours and is stored in localStorage.

## Features

### 📊 Statistics Dashboard

View real-time statistics:

- **Favorites**: Number of saved favorite recipes
- **Meal Plans**: Number of meal plans created
- **Grocery Lists**: Number of grocery list items
- **Calorie Logs**: Number of calorie tracking entries

### 🗑️ Data Management

Clear specific data types:

- **Clear Favorites**: Remove all saved favorites
- **Clear Meal Plans**: Remove all meal plans
- **Clear Grocery Lists**: Remove all grocery list items
- **Clear Calorie Logs**: Remove all calorie tracking data
- **Clear ALL Data**: ⚠️ Dangerous - Clears everything (requires confirmation)

### ℹ️ System Information

View system details:

- Environment (development/production)
- Admin mode status
- User agent information

## Configuration

### Enable Admin Mode in Production

Set in your `.env` file:

```env
VITE_ENABLE_ADMIN=true
VITE_ADMIN_PASSWORD=your-secure-password-here
```

### Add Admin Emails

Add admin emails in `src/utils/admin.js`:

```javascript
const ADMIN_EMAILS = [
  'your-email@example.com',
  // Add more emails here
];
```

Or via environment variable:

```env
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Security Notes

⚠️ **Important**: This admin system is designed for **local development only**.

- Admin password is stored in plain text (not secure for production)
- Admin session is stored in localStorage (not secure)
- Admin mode should be disabled in production unless you implement proper authentication

For production, consider:

- Using Supabase Auth with role-based access control
- Implementing proper server-side admin authentication
- Using environment variables for admin configuration
- Adding rate limiting and audit logging

## Troubleshooting

### Admin button not showing?

- Make sure you're in development mode (`npm run dev`)
- Or set `VITE_ENABLE_ADMIN=true` in your `.env` file

### Can't log in?

- Default password is `admin123`
- Check if `VITE_ADMIN_PASSWORD` is set correctly
- Clear localStorage and try again

### Session expired?

- Admin sessions last 24 hours
- Simply log in again with the admin password

## Files Created

- `src/utils/admin.js` - Admin utilities and configuration
- `src/context/AdminContext.jsx` - Admin context provider
- `src/components/AdminLogin.jsx` - Admin login modal
- `src/pages/AdminDashboard.jsx` - Admin dashboard page
