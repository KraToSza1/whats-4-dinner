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

**Important:** To enable Google and Apple Sign-In, you need to configure OAuth providers in Supabase.

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on:
- Enabling Google OAuth
- Enabling Apple OAuth
- Google Cloud Console setup
- Troubleshooting

The magic link (email) authentication works without any additional setup.

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
