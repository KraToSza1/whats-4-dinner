# Admin Access Troubleshooting Guide

## ✅ Configuration Status

The diagnostic script confirms that `elanridp@gmail.com` is **correctly configured** as an admin:

- ✅ Email is in admin allowlist (`src/utils/admin.js`)
- ✅ User exists in Supabase
- ✅ Email is confirmed
- ✅ User should have admin access

## 🔍 Common Issues & Solutions

### Issue 1: User Not Logged In
**Symptom:** Can't access admin dashboard, redirected to home page

**Solution:**
1. Make sure the user is logged in with `elanridp@gmail.com`
2. Check the browser console for authentication errors
3. Try logging out and back in

### Issue 2: Logged In with Different Email
**Symptom:** User is logged in but can't access admin dashboard

**Solution:**
1. Check what email they're currently logged in with:
   - Open browser console (F12)
   - Type: `localStorage.getItem('sb-*')` (check Supabase session)
   - Or check the Profile page to see logged-in email
2. If logged in with a different email, log out and log in with `elanridp@gmail.com`

### Issue 3: Browser Cache/LocalStorage Issues
**Symptom:** Admin access worked before but stopped working

**Solution:**
1. Clear browser cache and localStorage:
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   ```
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Log out and log back in

### Issue 4: Case Sensitivity (Already Handled)
**Note:** The code automatically normalizes emails to lowercase, so `Elanridp@gmail.com` and `elanridp@gmail.com` both work.

## 🛠️ Diagnostic Steps

### Step 1: Verify User is Logged In
1. Go to the app
2. Check if you see a profile/login button
3. If logged in, check the Profile page to see the email

### Step 2: Check Admin Access in Browser Console
1. Open browser console (F12)
2. Navigate to the app
3. Type this in the console:
   ```javascript
   // Check current user
   const { data: { user } } = await window.supabase.auth.getUser();
   console.log('Current user:', user?.email);
   
   // Check admin status (if admin.js is loaded)
   // This will only work if you're on a page that imports admin.js
   ```

### Step 3: Try Accessing Admin Dashboard Directly
1. Make sure you're logged in with `elanridp@gmail.com`
2. Navigate to `/admin` in the URL
3. Check browser console for any errors

### Step 4: Run Diagnostic Script
```bash
node scripts/check-admin-access.js elanridp@gmail.com
```

This will verify:
- Email is in allowlist ✅
- User exists in Supabase ✅
- Email is confirmed ✅

## 📋 Quick Checklist

- [ ] User is logged in with `elanridp@gmail.com` (exact email)
- [ ] Email is confirmed in Supabase (check Supabase dashboard)
- [ ] Browser cache cleared
- [ ] Tried logging out and back in
- [ ] Checked browser console for errors
- [ ] Tried accessing `/admin` directly

## 🔧 Manual Fix (If Needed)

If the user still can't access after trying everything above, you can temporarily add debug logging:

1. Open `src/utils/admin.js`
2. Add console logging to `isAdmin()` function:
   ```javascript
   export function isAdmin(user) {
     if (!user?.email) {
       console.log('🔑 [ADMIN] No user email');
       return false;
     }
     
     const userEmail = user.email.toLowerCase().trim();
     const isAdminUser = ADMIN_EMAILS.includes(userEmail);
     
     console.log('🔑 [ADMIN] Checking:', {
       userEmail,
       adminEmails: ADMIN_EMAILS,
       isAdmin: isAdminUser
     });
     
     return isAdminUser;
   }
   ```

3. Check browser console when trying to access admin dashboard

## 📞 Next Steps

If none of the above works:
1. Check Supabase dashboard → Authentication → Users
2. Verify the exact email address stored in Supabase
3. Make sure there are no extra spaces or characters
4. Try creating a new account with the exact email if needed

## ✅ Verification

After fixing, verify admin access:
1. Log in with `elanridp@gmail.com`
2. Navigate to `/admin`
3. Should see admin dashboard (not redirected to home)

---

**Note:** Admin access is controlled by the code in `src/utils/admin.js`, NOT by Supabase or Vercel settings. The email must be in the `ADMIN_EMAILS` array in that file.

