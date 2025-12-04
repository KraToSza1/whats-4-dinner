# 🚨 EMERGENCY FIX - Recipe Timeout & Admin Access

## Issues Found:
1. **Recipe Search Timing Out** - Query is too complex/slow
2. **Admin Dashboard Not Accessible** - Need to verify admin status

## ✅ Fixes Applied:

### 1. Recipe Search - Added Fallback Query
- Added timeout protection (20 seconds)
- If main query times out, falls back to simpler query
- Reduced overall timeout from 30s to 25s

### 2. Admin Access - Check These:

**Your Admin Emails:**
- `raymondvdw@gmail.com` ✅
- `elanridp@gmail.com` ✅

**To Fix Admin Access:**

1. **Check if you're logged in:**
   - Look at the top right - do you see your email/avatar?
   - If not, log in with one of the admin emails above

2. **Check browser console for admin messages:**
   - Press F12 → Console tab
   - Look for messages like:
     - `🔑 [PROTECTED ADMIN] ✅ User is admin` (GOOD)
     - `🔑 [PROTECTED ADMIN] ❌ User is not an admin` (BAD - email doesn't match)

3. **If admin button isn't showing:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear cache: `Ctrl+Shift+Delete` → Clear cached images and files
   - Log out and log back in

4. **Manual Admin Check:**
   - Open browser console (F12)
   - Type: `localStorage.getItem('admin:session:v1')`
   - Should return a JSON object if admin session exists

## 🔧 Quick Test:

1. **Refresh browser** → Recipes should load (with fallback if needed)
2. **Check admin** → Look for "Admin Dashboard" in menu
3. **If still broken** → Check console for specific errors

## 📋 Next Steps:

1. **Refresh your browser** - The fixes are already in the code
2. **Check console** - Look for any new errors
3. **Try admin access** - Should work if logged in with admin email
4. **Report back** - Let me know what you see!

---

**If recipes STILL don't load:**
- Check Supabase dashboard → Table Editor → `recipes` table
- Verify you have recipes in the database
- Check Network tab (F12 → Network) for failed requests

**If admin STILL doesn't work:**
- Share the console output
- Verify you're logged in with `raymondvdw@gmail.com` or `elanridp@gmail.com`
- Check if you see any admin-related errors in console

