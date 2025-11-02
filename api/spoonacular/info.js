// Vercel Serverless Function - Recipe Info Proxy with simple in-memory TTL cache
export const config = { runtime: "nodejs18.x" };

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || "21600000", 10); // 6h default
const cache = new Map();

// Upstash Redis (optional)
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
async function redisGet(k) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const r = await fetch(`${REDIS_URL}/get/${encodeURIComponent(k)}`, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } });
  if (!r.ok) return null;
  const { result } = await r.json();
  return result ? JSON.parse(result) : null;
}
async function redisSet(k, value, ttlMs) {
  if (!REDIS_URL || !REDIS_TOKEN) return;
  const sec = Math.floor((ttlMs || CACHE_TTL_MS) / 1000);
  await fetch(`${REDIS_URL}/set/${encodeURIComponent(k)}/${encodeURIComponent(JSON.stringify(value))}?EX=${sec}`, { method: "POST", headers: { Authorization: `Bearer ${REDIS_TOKEN}` } });
}

async function getCached(k) {
  const r = await redisGet(k);
  if (r) return r;
  const it = cache.get(k);
  if (!it) return null;
  if (Date.now() - it.t > CACHE_TTL_MS) return null;
  return it.data;
}
async function setCached(k, data) {
  cache.set(k, { t: Date.now(), data });
  await redisSet(k, data, CACHE_TTL_MS);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.SPOONACULAR_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing SPOONACULAR_KEY env var" });
    return;
  }

  const id = req.query.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const cacheKey = `info:${id}`;
  const hit = await getCached(cacheKey);
  if (hit) {
    res.setHeader("x-cache", "HIT");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json(hit);
    return;
  }

  const withNutri = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
  withNutri.searchParams.set("includeNutrition", "true");
  withNutri.searchParams.set("apiKey", apiKey);

  try {
    let r = await fetch(withNutri.toString());
    let text = await r.text();
    if (r.ok) {
      const data = text ? JSON.parse(text) : null;
      await setCached(cacheKey, data);
      res.setHeader("x-cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=60");
      res.status(200).json(data);
      return;
    }
    // Retry without nutrition if blocked by plan
    if (r.status === 401 || r.status === 402) {
      const without = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
      without.searchParams.set("includeNutrition", "false");
      without.searchParams.set("apiKey", apiKey);
      r = await fetch(without.toString());
      text = await r.text();
      const data = text ? JSON.parse(text) : null;
      if (!r.ok) {
        res.status(r.status).json({ error: data?.message || `HTTP ${r.status}` });
        return;
      }
      await setCached(cacheKey, data);
      res.setHeader("x-cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=60");
      res.status(200).json(data);
      return;
    }
    res.status(r.status).json({ error: text || `HTTP ${r.status}` });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Proxy error" });
  }
}


