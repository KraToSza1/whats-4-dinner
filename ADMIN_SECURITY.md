# Admin Security System

## Overview
The admin dashboard is now **completely secured** and only accessible to specific admin users based on their email address.

## Admin Users

### Main Admin
- **Email:** `raymondvdw@gmail.com`
- **Status:** Always has admin access

### Second Admin (Optional)
- **Email:** Set via environment variable `VITE_SECOND_ADMIN_EMAIL`
- **How to add:** Add `VITE_SECOND_ADMIN_EMAIL=secondadmin@example.com` to your `.env.local` file

## Security Features

### 1. Email-Based Access Control
- Only emails in the allowlist can access the admin dashboard
- All email checks are case-insensitive
- Non-admin users are **completely blocked** from:
  - Seeing the admin menu in the header
  - Accessing `/admin` route (redirected to home)
  - Viewing any admin UI elements

### 2. Multi-Layer Protection
- **ProtectedAdminRoute:** Checks user email before rendering admin dashboard
- **AdminDashboard:** Double-checks admin status on component mount
- **Header:** Only shows admin menu if user is an admin
- **AdminContext:** Provides admin status to all components

### 3. Production Security
- In production, admin mode must be explicitly enabled via `VITE_ENABLE_ADMIN=true`
- Even with admin mode enabled, only admin emails can access
- Non-admin users never see admin UI elements

## How It Works

1. **User Authentication:** User must be signed in via Supabase
2. **Email Check:** System checks if user's email is in the admin allowlist
3. **Access Grant:** Only if email matches, user gets admin access
4. **UI Visibility:** Admin menu only appears for admin users

## Configuration

### Local Development
Add to `.env.local`:
```env
VITE_SECOND_ADMIN_EMAIL=secondadmin@example.com
```

### Production (Vercel)
Add to Vercel Environment Variables:
- `VITE_ENABLE_ADMIN=true` (enables admin mode UI)
- `VITE_SECOND_ADMIN_EMAIL=secondadmin@example.com` (optional second admin)

## Testing

1. Sign in with `raymondvdw@gmail.com` → Should see admin menu
2. Sign in with any other email → Should NOT see admin menu
3. Try to access `/admin` directly with non-admin email → Redirected to home

## Important Notes

- **Never commit admin emails to Git** - they're in the code but should be kept secure
- **Only 2 admins maximum** - Main admin (raymondvdw@gmail.com) + one optional second admin
- **All checks are server-side ready** - Can be moved to Supabase RLS policies later
- **Non-admin users see nothing** - No error messages, no UI elements, completely hidden

