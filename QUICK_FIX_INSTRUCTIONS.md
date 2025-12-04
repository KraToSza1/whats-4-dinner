# Quick Fix Instructions

## 🚨 URGENT: Recipe Search Timeout Fix

The recipe search was filtering too restrictively, causing timeouts and no results. **This has been fixed in the code.**

## ✅ What You Need to Do Right Now:

### 1. **SQL Setup for Trial System** (Copy/Paste into Supabase SQL Editor)

Open your Supabase SQL Editor (like in the screenshot you showed) and run this:

```sql
-- Add trial fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended BOOLEAN DEFAULT FALSE;

-- Create index for faster trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_start_date 
ON profiles(trial_start_date) 
WHERE trial_start_date IS NOT NULL;
```

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query" or use existing tab
3. Copy the SQL above
4. Paste it into the editor
5. Click the green "Run" button (or press Ctrl+Enter)
6. You should see "Success. No rows returned" - that's normal!

### 2. **Verify Admin Access**

Your admin emails are:
- `raymondvdw@gmail.com` ✅
- `elanridp@gmail.com` ✅

**To check if admin is working:**
1. Make sure you're logged in with one of these emails
2. Look for the "Admin" button in the navigation menu
3. If you don't see it, try:
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Log out and log back in
   - Check browser console for any errors

### 3. **Recipe Search Should Work Now**

The code fix removes the restrictive filter that was blocking all recipes. After refreshing your browser, recipes should load.

**If recipes still don't load:**
1. Check Supabase connection (look for errors in browser console)
2. Verify you have recipes in your `recipes` table
3. Check network tab for failed requests

## 🔍 Troubleshooting

### Admin Not Showing?
- Check browser console for errors
- Verify you're logged in with admin email
- Try: `localStorage.clear()` then refresh (will log you out, log back in)

### Recipes Still Not Loading?
- Check Supabase dashboard → Table Editor → `recipes` table
- Verify you have data in the table
- Check browser Network tab for failed requests
- Look for timeout errors in console

### SQL Errors?
- Make sure you're running it in the SQL Editor (not Table Editor)
- Check that the `profiles` table exists
- If columns already exist, the `IF NOT EXISTS` will skip them safely

## 📝 Next Steps After SQL Setup

Once you run the SQL:
1. ✅ Trial system will work automatically
2. ✅ New signups will get 30-day free trial
3. ✅ Shareable recipe links will work
4. ✅ Everything should be back to normal!

---

**Need help?** Check the browser console (F12) for specific error messages and share them.

