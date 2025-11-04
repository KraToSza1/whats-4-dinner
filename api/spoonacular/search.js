// Vercel Serverless Function - Search Proxy with simple in-memory TTL cache

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || "21600000", 10); // 6h default
const cache = new Map(); // fallback

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

function keyFrom(query) {
  const { includeIngredients = "", diet = "", intolerances = "", type = "", number = 24, maxReadyTime = "", q = "" } = query;
  return JSON.stringify({ q, includeIngredients, diet, intolerances, type, number, maxReadyTime });
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

  const k = keyFrom(req.query || {});
  const hit = await getCached(k);
  if (hit) {
    res.setHeader("x-cache", "HIT");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json(hit);
    return;
  }

  const u = new URL("https://api.spoonacular.com/recipes/complexSearch");
  const qp = {
    query: req.query.q || "",
    includeIngredients: req.query.includeIngredients || "",
    diet: req.query.diet || "",
    intolerances: req.query.intolerances || "",
    type: req.query.type || "",
    addRecipeInformation: "true",
    instructionsRequired: "true",
    number: req.query.number || "24",
    ...(req.query.maxReadyTime ? { maxReadyTime: req.query.maxReadyTime } : {}),
    apiKey,
  };
  Object.entries(qp).forEach(([k2, v]) => (v !== undefined && v !== "" ? u.searchParams.set(k2, v) : null));

  try {
    const r = await fetch(u.toString());
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    if (!r.ok) {
      res.status(r.status).json({ error: data?.message || `HTTP ${r.status}` });
      return;
    }
    await setCached(k, data);
    res.setHeader("x-cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Proxy error" });
  }
}


