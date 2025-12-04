# What's 4 Dinner — Dev & Deploy

## Local development

```bash
npm install
# To use the serverless proxy locally
VITE_USE_PROXY=1 npm run dev
```

Open the Vite URL (e.g. http://localhost:5173).

## Serverless API

This repo includes Vercel serverless functions under `api/` for payment processing and other server-side operations.

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

## Recipe Editor & ChatGPT Integration

The Recipe Editor allows importing/exporting recipes via JSON format for ChatGPT integration.

### Documentation:

- **📖 Complete Guide:** [Database/CHATGPT_RECIPE_JSON_GUIDE.md](./Database/CHATGPT_RECIPE_JSON_GUIDE.md) - Full specification for ChatGPT recipe JSON format
- **⚡ Quick Reference:** [Database/CHATGPT_QUICK_REFERENCE.md](./Database/CHATGPT_QUICK_REFERENCE.md) - Quick checklist and minimal format
- **📝 Recipe Editing:** [Database/RECIPE_EDITING_GUIDE.md](./Database/RECIPE_EDITING_GUIDE.md) - How to edit recipes via web interface
- **🔬 Nutrition System:** [Database/NUTRITION_SYSTEM_EXPLANATION.md](./Database/NUTRITION_SYSTEM_EXPLANATION.md) - Detailed nutrition data explanation

### Quick Workflow:

1. Export recipe from Recipe Editor → Get JSON format reference
2. Paste JSON to ChatGPT → ChatGPT sees correct format
3. ChatGPT generates/updates recipe → Returns JSON in same format
4. Import JSON into Recipe Editor → All fields populate automatically
5. Save → Recipe is stored in database

**⚠️ Critical:** Nutrition values must be **per-serving** (not totals). The system automatically multiplies by servings when saving.

SEO files:

- Add `public/robots.txt` and `public/sitemap.xml` for indexing (pending).
