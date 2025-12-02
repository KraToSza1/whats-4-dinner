# How to Get the Exact Paddle 403 Error Message

## Step-by-Step Instructions

1. **Open your app** in the browser where you see the "Something went wrong" popup

2. **Open DevTools**:
   - Press `F12` or `Right-click` → `Inspect`
   - Or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

3. **Go to Network Tab**:
   - Click the **"Network"** tab at the top of DevTools

4. **Clear the network log** (optional but helpful):
   - Click the 🚫 icon (clear) to start fresh

5. **Trigger the checkout**:
   - Click your "Subscribe" or "Upgrade" button again
   - Wait for the "Something went wrong" popup to appear

6. **Find the 403 request**:
   - In the Network tab, look for a request named: **`transaction-checkout`**
   - It should show **Status: 403** in red

7. **Click on that request**:
   - Click the `transaction-checkout` request (the one with 403)

8. **Open the Response tab**:
   - Click the **"Response"** tab (next to Headers, Preview, etc.)
   - You should see JSON like:
   ```json
   {
     "error": {
       "type": "...",
       "message": "...",
       "detail": "..."
     }
   }
   ```

9. **Copy the error message**:
   - Copy the entire JSON response
   - Or at least copy the `message` or `detail` field

10. **Share it here**:
    - Paste the error message so we can see exactly what Paddle is complaining about

## What the Error Will Tell Us

The error message will be one of these (and tell us exactly what to fix):

- **"Website not approved"** → Need to add domain in Paddle Dashboard
- **"Client token invalid"** → Wrong token or environment mismatch
- **"Transaction not found"** → Transaction expired, need new one
- **"Account not allowed"** → Account setup incomplete
- **"Domain mismatch"** → URL doesn't match approved domain

Once we see the actual error, we can fix it in 30 seconds!

