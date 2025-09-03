import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function RecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Use card data for instant paint, but always fetch full details
  const preloaded = location.state?.recipe || null;

  const [recipe, setRecipe] = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState(null);

  // ---- Fetch full details (with nutrition fallback) ----
  useEffect(() => {
    const apiKey = import.meta.env.VITE_SPOONACULAR_KEY || "";
    const base = `https://api.spoonacular.com/recipes/${id}/information`;
    const withNutri = `${base}?includeNutrition=true&apiKey=${encodeURIComponent(apiKey)}`;
    const withoutNutri = `${base}?includeNutrition=false&apiKey=${encodeURIComponent(apiKey)}`;

    let ignore = false;

    const get = async (url) => {
      const res = await fetch(url);
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      return { res, json, text };
    };

    (async () => {
      setLoading(true);
      setError(null);
      try {
        let { res, json } = await get(withNutri);
        if (res.status === 401 || res.status === 402) {
          ({ res, json } = await get(withoutNutri));
        }
        if (!res.ok) {
          const friendly =
            res.status === 401 ? "Invalid API key. Check VITE_SPOONACULAR_KEY."
          : res.status === 402 ? "Daily API quota reached."
          : res.status === 404 ? "Recipe not found."
          : `HTTP ${res.status}`;
          throw new Error(friendly);
        }
        if (!ignore) setRecipe(json);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load recipe.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [id]);

  // ---- Derived helpers ----
  const title = recipe?.title || "Recipe";
  const image = recipe?.image;

  const nutrient = (name) => recipe?.nutrition?.nutrients?.find((x) => x.name === name)?.amount ?? null;

  // Macro values (guarded)
  const macros = useMemo(() => ([
    { key: "Calories", label: "Calories", value: nutrient("Calories") || 0, max: 800 },
    { key: "Protein",  label: "Protein (g)", value: nutrient("Protein")  || 0, max: 60 },
    { key: "Carbs",    label: "Carbs (g)",   value: nutrient("Carbohydrates") || 0, max: 90 },
    { key: "Fat",      label: "Fat (g)",     value: nutrient("Fat")      || 0, max: 60 },
  ]), [recipe]);

  // Prefer analyzed steps; fallback to HTML blob
  const steps = useMemo(() => {
    const analyzed = recipe?.analyzedInstructions?.[0]?.steps;
    if (Array.isArray(analyzed) && analyzed.length) {
      return analyzed.map(s => s.step).filter(Boolean);
    }
    if (recipe?.instructions) {
      const tmp = document.createElement("div");
      tmp.innerHTML = recipe.instructions;
      const text = tmp.textContent || tmp.innerText || "";
      return text.split(/\.\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [recipe]);

  // Ingredient checklist (persist per-recipe)
  const checklistKey = `checklist:${id}`;
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(checklistKey) || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem(checklistKey, JSON.stringify(checked)); }, [checked, checklistKey]);

  const toggleChecked = (uid) =>
    setChecked((c) => ({ ...c, [uid]: !c[uid] }));

  // ---- UI states ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <p className="animate-pulse text-xl">Loading recipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
            <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700">← Back</button>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const Stat = ({ label, value, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .25 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
      title={label}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}:</span>
      <span className="font-semibold">{value ?? "—"}</span>
    </motion.div>
  );

  const MacroBar = ({ label, value, max }) => {
    const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
    return (
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1">
          <span>{label}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{Number(value || 0).toFixed(2)}</span>
        </div>
        <div className="h-2 rounded bg-slate-200/70 dark:bg-slate-700/70 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: .5 }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = location.href;
                if (navigator.share) navigator.share({ title, url });
                else { navigator.clipboard.writeText(url); alert("Link copied!"); }
              }}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Share"
            >
              Share
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
              title="Print"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        {image && (
          <>
            <img
              src={image}
              alt=""
              className="absolute inset-0 w-full h-[36vh] object-cover blur-2xl opacity-30"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/60 pointer-events-none" />
          </>
        )}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 relative">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .35 }}
            className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight"
          >
            {title}
          </motion.h1>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Stat label="Ready"   value={recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : "—"} icon="⏱️" />
            <Stat label="Servings" value={recipe.servings} icon="🍽️" />
            <Stat label="Health"   value={recipe.healthScore ?? "—"} icon="💚" />
            <Stat label="Likes"    value={recipe.aggregateLikes ?? "—"} icon="👍" />
          </div>

          {image && (
            <div className="flex justify-center mt-6">
              <motion.img
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .35, delay: .1 }}
                src={image}
                alt={title}
                className="mx-auto w-full max-w-3xl aspect-[4/3] object-cover rounded-xl shadow-xl ring-1 ring-black/10"
              />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
        {/* Macros */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-center">🍽️ Nutritional Info</h2>
          <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {macros.map((m) => (
              <MacroBar key={m.key} label={m.label} value={m.value} max={m.max} />
            ))}
          </div>
        </section>

        {/* Ingredients checklist */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-center">🧂 Ingredients</h2>
          <ul className="mx-auto max-w-3xl grid sm:grid-cols-2 gap-2">
            {(recipe?.extendedIngredients || []).length ? (
              recipe.extendedIngredients.map((ing, idx) => {
                const uid = `${ing.id ?? "noid"}-${idx}`;
                const isChecked = !!checked[uid];
                return (
                  <li
                    key={uid}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2 border
                      ${isChecked
                        ? "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50"
                        : "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/60"}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={isChecked}
                      onChange={() => toggleChecked(uid)}
                    />
                    <span className={`${isChecked ? "line-through opacity-70" : ""}`}>
                      {ing.original}
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="text-slate-500 text-center">No ingredient list available.</li>
            )}
          </ul>
        </section>

        {/* Steps */}
        {steps.length > 0 && (
          <section className="print:break-inside-avoid">
            <h2 className="text-xl font-bold mb-3 text-center">📋 Instructions</h2>
            <ol className="mx-auto max-w-3xl space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
