# 🚨 URGENT: Fix Your .env.local File RIGHT NOW

## The Problem:
Your `VITE_SUPABASE_ANON_KEY` is set to a **SERVICE_ROLE** key, which causes CORS errors (status 556).

## Fix Steps:

### 1. Open `.env.local` in your editor

### 2. Find this line (it's WRONG):
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...service_role...
```

### 3. Replace it with this (CORRECT anon key):
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTEyOTYsImV4cCI6MjA3NzQyNzI5Nn0.9jn172pl54EErWMN7Vv6_-NvEYh9ltpIjTgYkMzh3Vc
```

### 4. Save the file

### 5. **STOP YOUR DEV SERVER** (Ctrl+C in terminal)

### 6. **RESTART IT:**
```bash
npm run dev
```

### 7. **HARD REFRESH YOUR BROWSER:**
- Press `Ctrl+Shift+R` (Windows/Linux)
- Or `Cmd+Shift+R` (Mac)

## How to Verify It's Fixed:

After restarting, check the browser console:
- ✅ **SUCCESS**: You'll see successful API calls
- ❌ **STILL BROKEN**: You'll still see "CORS header missing" errors

## Why This Happens:

- **Service Role Key** = `"role":"service_role"` = Backend only, blocked by CORS
- **Anon Key** = `"role":"anon"` = Safe for frontend, works in browser

**The anon key is already in your `.env.local` file - you just need to use it!**

