# 🚨 URGENT: Fix CORS Error (Status 556)

## The Problem:
You're getting `CORS header 'Access-Control-Allow-Origin' missing` with status `556` because you're using the **SERVICE_ROLE** key instead of the **ANON** key.

## Fix Right Now:

### 1. Open `.env.local` file

### 2. Find this line:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...service_role...
```

### 3. Replace it with the CORRECT anon key (it's already in your file!):
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTEyOTYsImV4cCI6MjA3NzQyNzI5Nn0.9jn172pl54EErWMN7Vv6_-NvEYh9ltpIjTgYkMzh3Vc
```

**Look for the key that has `"role":"anon"` in it (not `"role":"service_role"`)**

### 4. Save the file

### 5. **RESTART YOUR DEV SERVER:**
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Why This Happens:
- **Service Role Key** = Backend only, blocked by CORS in browser
- **Anon Key** = Safe for frontend, works in browser

## Verify It's Fixed:
After restarting, check the console - you should see successful API calls instead of CORS errors.

