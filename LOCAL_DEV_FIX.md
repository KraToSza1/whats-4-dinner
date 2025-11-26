# Local Development Setup

## Using `vercel dev` (Recommended for API testing)

```bash
npx vercel dev
```

- Frontend and API routes run on `http://localhost:3000`
- API calls automatically use **local** `/api/*` routes
- Perfect for testing Paddle payments locally! ✅

The app automatically detects you're on port 3000 and uses local API routes.

## Using `npm run dev` (Frontend only)

```bash
npm run dev
```

- Frontend runs on `http://localhost:5173`
- API calls use your **deployed Vercel URL**
- Good for frontend development, but payments will hit production

## Testing on Deployed URL

Go to: `https://whats-4-dinner-git-master-raymonds-projects-17a8f0f7.vercel.app`
- Everything works automatically
- API routes work perfectly
- All environment variables are configured

## How It Works

The app automatically detects:
- **Port 3000** (vercel dev) → Uses local `/api/*` routes
- **Port 5173** (npm run dev) → Uses deployed Vercel URL
- **Production** → Uses relative `/api/*` routes

## Environment Variables

Make sure your `.env.local` or Vercel environment variables include:
- `PADDLE_VENDOR_ID`
- `PADDLE_API_KEY`
- `PADDLE_PRICE_SUPPORTER_MONTHLY`
- `PADDLE_PRICE_SUPPORTER_YEARLY`
- `PADDLE_PRICE_UNLIMITED_MONTHLY`
- `PADDLE_PRICE_UNLIMITED_YEARLY`
- `PADDLE_PRICE_FAMILY_MONTHLY`
- `PADDLE_PRICE_FAMILY_YEARLY`

