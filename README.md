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

---

*"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16*

*"I can do all things through Christ who strengthens me." - Philippians 4:13*

*"Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5*

*"Be still, and know that I am God." - Psalm 46:10*

*"The Lord is my shepherd, I lack nothing." - Psalm 23:1*

*"Cast all your anxiety on him because he cares for you." - 1 Peter 5:7*

*"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future." - Jeremiah 29:11*

*"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." - Philippians 4:6*

*"Jesus said, 'I am the way and the truth and the life. No one comes to the Father except through me.'" - John 14:6*

*"The Lord will fight for you; you need only to be still." - Exodus 14:14*

*"And we know that in all things God works for the good of those who love him, who have been called according to his purpose." - Romans 8:28*

*"The Lord is close to the brokenhearted and saves those who are crushed in spirit." - Psalm 34:18*

*"Come to me, all you who are weary and burdened, and I will give you rest." - Matthew 11:28*

*"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." - Isaiah 40:31*

*"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9*
