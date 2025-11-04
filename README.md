# What's 4 Dinner — Dev & Deploy

## Local development

```bash
npm install
# To use the serverless proxy locally
VITE_USE_PROXY=1 npm run dev
```

Open the Vite URL (e.g. http://localhost:5173).

## Serverless proxy (production-safe API)

This repo includes Vercel serverless functions under `api/` that proxy Spoonacular and add a simple TTL cache. Your API key never touches the browser.

Endpoints:
- `GET /api/spoonacular/search?q=&includeIngredients=&diet=&intolerances=&number=&maxReadyTime=`
- `GET /api/spoonacular/info?id=123`

Environment variables (Vercel → Project Settings → Environment Variables):
- `SPOONACULAR_KEY`: your Spoonacular API key
- `CACHE_TTL_MS` (optional): cache TTL in ms, default 21600000 (6h)

## Deploy to Vercel
1. Push this repo to GitHub.
2. Create a new Vercel Project and import the repo.
3. Add the env vars above and deploy.
4. Frontend will automatically use the proxy in production.

Notes:
- The proxy uses in-memory cache per function instance. For global cache (cheaper), swap the in-memory Map for Redis (e.g., Upstash/Vercel KV).
- Client still has a localStorage cache for snappy UX.

## Authentication Setup

**💰 Cost Guide:** See [AUTH_COST_GUIDE.md](./AUTH_COST_GUIDE.md) for a complete breakdown of what's free and what costs money.

### Quick Summary:
- ✅ **Email Magic Link** - FREE (already working)
- ✅ **Google OAuth** - FREE (5-minute setup, see below)
- ❌ **Apple Sign In** - $99/year (hidden until you have revenue)

### Free Setup (Recommended):
1. **Google OAuth** - See [GOOGLE_AUTH_STEP_BY_STEP.md](./GOOGLE_AUTH_STEP_BY_STEP.md) for complete step-by-step instructions (100% free, no credit card needed)
   - Or use [QUICK_START_GOOGLE_AUTH.md](./QUICK_START_GOOGLE_AUTH.md) for a quick checklist
2. **Email Magic Link** - Already working, no setup needed

### Detailed Setup:
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on:
- Enabling Google OAuth in Supabase
- Google Cloud Console setup
- Troubleshooting OAuth errors

## Env vars (copy into Vercel → Settings → Environment Variables)

- Spoonacular
  - `SPOONACULAR_KEY`
  - `CACHE_TTL_MS` (optional)
- Supabase
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (serverless only, for Stripe webhook upsert)
- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID` (recurring price)
  - `STRIPE_WEBHOOK_SECRET` (from Vercel/Stripe webhook setup)
- Upstash Redis (optional, enables global cache)
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

SEO files:
- Add `public/robots.txt` and `public/sitemap.xml` for indexing (pending).
