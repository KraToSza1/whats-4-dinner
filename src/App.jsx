import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import RecipeCard from "./components/RecipeCard";
import RecipePage from "./pages/RecipePage";

/* ----------------------------- Small utilities ---------------------------- */

// Friendly errors for common HTTP codes from Spoonacular
const explainHttpError = (status) => {
  switch (status) {
    case 401:
      return "Invalid API key. Check VITE_SPOONACULAR_KEY in your .env.local.";
    case 402:
      return "Daily API quota reached. Showing demo recipes instead.";
    case 404:
      return "Endpoint not found. The Spoonacular URL may be wrong.";
    case 429:
      return "Too many requests too quickly. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Spoonacular is having trouble right now. Try again soon.";
    default:
      return `Unexpected error (HTTP ${status}).`;
  }
};

// Normalize “chicken,  rice , , tomato” -> “chicken,rice,tomato”
const normalizeIngredients = (raw) =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

// Browser notification wrapper (no-op if permissions aren’t granted)
const notifyUser = (message) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(message);
  }
};

// Simple built-in demo results used when the API quota is hit (402)
const DEMO_RECIPES = [
  {
    id: 1000001,
    title: "Garlic Chicken Rice Bowl (demo)",
    image:
      "https://images.unsplash.com/photo-1604908812124-22989bf03d65?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 1000002,
    title: "Simple Tomato Pasta (demo)",
    image:
      "https://images.unsplash.com/photo-1523986371872-9d3ba2e2a389?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 1000003,
    title: "Crispy Tofu & Broccoli (demo)",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
  },
];

/* --------------------------------- App ----------------------------------- */

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Persist & apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Ask for notifications once
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Cross-tab favorites sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "favorites" && e.newValue) {
        setFavorites(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Main search function (with robust error handling & fallback)
  const fetchRecipes = useCallback(async (rawIngredients) => {
    const ingredients = normalizeIngredients(rawIngredients);
    if (!ingredients) {
      setError("Please enter at least one ingredient.");
      setRecipes([]);
      return;
    }

    const apiKey = import.meta.env.VITE_SPOONACULAR_KEY;
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
      ingredients
    )}&number=12&apiKey=${encodeURIComponent(apiKey)}`;

    setLoading(true);
    setError(null);
    setRecipes([]);

    console.groupCollapsed("[FETCH] Spoonacular > findByIngredients");
    console.log("ingredients:", ingredients);
    console.log("url:", url);

    try {
      const res = await fetch(url);
      const bodyText = await res.text(); // capture raw body for debugging/edge cases
      let data = [];

      try {
        data = bodyText ? JSON.parse(bodyText) : null;
      } catch (e) {
        console.warn("Response not JSON:", e);
      }

      console.log("status:", res.status, "ok:", res.ok);
      console.log("received items:", Array.isArray(data) ? data.length : 0);
      console.groupEnd();

      // Non-OK HTTP? Show message; if 402 (quota) use demo items
      if (!res.ok) {
        const msg = explainHttpError(res.status);
        console.error("[FETCH] error:", msg, "| body:", bodyText);

        if (res.status === 402) {
          setRecipes(DEMO_RECIPES);
          setError("Daily API quota reached. Showing demo recipes.");
          setLoading(false);
          return;
        }

        setError(msg);
        setLoading(false);
        return;
      }

      // OK but empty/invalid
      if (!Array.isArray(data) || data.length === 0) {
        setError("No recipes found. Try different ingredients.");
        setLoading(false);
        return;
      }

      setRecipes(data);
      notifyUser(`🍽 Found ${data.length} recipes for "${ingredients}"`);
    } catch (err) {
      console.groupEnd();
      console.error("[FETCH] network error:", err);
      setError("Network error. Are you offline?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add/Remove favorite (dedupe by id)
  const toggleFavorite = (recipe) => {
    const exists = favorites.some((f) => f.id === recipe.id);
    const updated = exists ? favorites.filter((f) => f.id !== recipe.id) : [recipe, ...favorites];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          favorites={favorites}
          setFavorites={setFavorites}
        />

        <Routes>
          <Route
            path="/"
            element={
              <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                <SearchForm onSearch={fetchRecipes} />

                {loading && (
                  <p className="text-center mt-8 text-slate-500 dark:text-slate-400 animate-pulse">
                    Fetching delicious recipes...
                  </p>
                )}

                {error && (
                  <p className="text-center mt-8 text-red-500 font-semibold">{error}</p>
                )}

                {recipes.length > 0 && (
                  <section className="mt-10">
                    <div className="flex items-baseline justify-between mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold">Recipe Results</h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {recipes.map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onFavorite={() => toggleFavorite(recipe)}
                          isFavorite={favorites.some((f) => f.id === recipe.id)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {favorites.length > 0 && (
                  <section className="mt-14">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-amber-400">⭐</span>
                      <h2 className="text-xl sm:text-2xl font-bold">Saved Favorites</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-2">
                        {favorites.length} saved
                      </span>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {favorites.map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onFavorite={() => toggleFavorite(recipe)}
                          isFavorite
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Suggestion chips when nothing yet */}
                {!loading && !error && recipes.length === 0 && favorites.length === 0 && (
                  <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
                    <p className="mb-2 text-lg">Try something like:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["chicken, rice", "eggs, tomato", "pasta, bacon", "tofu, broccoli"].map(
                        (s) => (
                          <button
                            key={s}
                            className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                            onClick={() => fetchRecipes(s)}
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </main>
            }
          />

          <Route path="/recipe/:id" element={<RecipePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;