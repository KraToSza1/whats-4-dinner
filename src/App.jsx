// src/pages/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header.jsx";
import SearchForm from "./components/SearchForm.jsx";
import RecipeCard from "./components/RecipeCard.jsx";
import RecipePage from "./pages/RecipePage.jsx";
import MealPlanner from "./pages/MealPlanner.jsx";

import Filters from "./components/Filters.jsx";
import PantryChips from "./components/PantryChips.jsx";
import GroceryDrawer from "./components/GroceryDrawer.jsx";
import DailyRecipe from "./components/DailyRecipe.jsx";
import { RecipeCardSkeletons } from "./components/LoadingSkeleton.jsx";
import PullToRefresh from "./components/PullToRefresh.jsx";
import BackToTop from "./components/BackToTop.jsx";
import CookingAnimation from "./components/CookingAnimation.jsx";
import { GroceryListProvider } from "./context/GroceryListContext.jsx";

import { searchRecipes } from "./api/spoonacular.js";
import { getPreferenceSummary } from "./utils/preferenceAnalyzer.js";



// "chicken,  rice , , tomato" -> ["chicken","rice","tomato"]
const toIngredientArray = (raw) =>
    raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

const App = () => {
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem("favorites");
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSearch, setLastSearch] = useState("");
    const [preferenceSummary, setPreferenceSummary] = useState(null);

    // NEW: filters & pantry chips
    const [diet, setDiet] = useState(() => {
        try { return localStorage.getItem("filters:diet") || ""; } catch { return ""; }
    });
    const [intolerances, setIntolerances] = useState(() => {
        try { return localStorage.getItem("filters:intolerances") || ""; } catch { return ""; }
    });
    const [maxTime, setMaxTime] = useState(() => {
        try { return localStorage.getItem("filters:maxTime") || ""; } catch { return ""; }
    }); // minutes
    const [mealType, setMealType] = useState(() => {
        try { return localStorage.getItem("filters:mealType") || ""; } catch { return ""; }
    });
    const [maxCalories, setMaxCalories] = useState(() => {
        try { return localStorage.getItem("filters:maxCalories") || ""; } catch { return ""; }
    });
    const [healthScore, setHealthScore] = useState(() => {
        try { return localStorage.getItem("filters:healthScore") || ""; } catch { return ""; }
    });
    const [pantry, setPantry] = useState(() => {
        try { return JSON.parse(localStorage.getItem("filters:pantry") || "[]"); } catch { return []; }
    }); // ["eggs","tomato"]

    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Persist filters and pantry chips
    useEffect(() => {
        try { localStorage.setItem("filters:diet", diet); } catch {}
    }, [diet]);
    useEffect(() => {
        try { localStorage.setItem("filters:intolerances", intolerances); } catch {}
    }, [intolerances]);
    useEffect(() => {
        try { localStorage.setItem("filters:maxTime", maxTime); } catch {}
    }, [maxTime]);
    useEffect(() => {
        try { localStorage.setItem("filters:mealType", mealType); } catch {}
    }, [mealType]);
    useEffect(() => {
        try { localStorage.setItem("filters:maxCalories", maxCalories); } catch {}
    }, [maxCalories]);
    useEffect(() => {
        try { localStorage.setItem("filters:healthScore", healthScore); } catch {}
    }, [healthScore]);
    useEffect(() => {
        try { localStorage.setItem("filters:pantry", JSON.stringify(pantry)); } catch {}
    }, [pantry]);

    // Ask once for browser notifications (non-blocking)
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
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

    // Update preference summary
    useEffect(() => {
        const summary = getPreferenceSummary();
        setPreferenceSummary(summary);
    }, [favorites]);

    // Main search using the unified API wrapper (handles quota fallback)
    const fetchRecipes = useCallback(
        async (raw) => {
            const includeIngredients = [
                ...toIngredientArray(raw),
                ...pantry.filter(Boolean),
            ];
            if (includeIngredients.length === 0) {
                setError("Please enter at least one ingredient.");
                setRecipes([]);
                return;
            }

            setLoading(true);
            setError(null);
            setRecipes([]);
            setLastSearch(raw); // Store for pull-to-refresh

            try {
                const data = await searchRecipes({
                    query: "",
                    includeIngredients,
                    diet,
                    intolerances,
                    type: mealType,
                    number: 24,
                });

                // Wrapper may return {results:[]} (complexSearch) or an array (mock)
                const list = Array.isArray(data) ? data : data?.results || [];

                // Client-side trim by maxTime, maxCalories, and healthScore if set
                const filtered = list.filter((r) => {
                    if (maxTime && Number(maxTime) > 0 && (r.readyInMinutes || 999) > Number(maxTime)) {
                        return false;
                    }
                    if (maxCalories && Number(maxCalories) > 0) {
                        const calories = r.nutrition?.nutrients?.find(n => n.name === "Calories")?.amount;
                        if (calories && calories > Number(maxCalories)) {
                            return false;
                        }
                    }
                    if (healthScore && Number(healthScore) > 0 && r.healthScore && r.healthScore < Number(healthScore)) {
                        return false;
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    setError("No recipes found. Try different filters or ingredients.");
                    return;
                }

                setRecipes(filtered);

                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(`🍽 Found ${filtered.length} recipes`);
                }
            } catch (e) {
                console.error("[fetchRecipes]", e);
                setError(e.message || "Network/API error.");
            } finally {
                setLoading(false);
            }
        },
        [diet, intolerances, maxTime, mealType, maxCalories, healthScore, pantry]
    );

    // Add/Remove favorite (dedupe by id)
    const toggleFavorite = (recipe) => {
        const exists = favorites.some((f) => f.id === recipe.id);
        const updated = exists ? favorites.filter((f) => f.id !== recipe.id) : [recipe, ...favorites];
        setFavorites(updated);
        localStorage.setItem("favorites", JSON.stringify(updated));
    };

    return (
        <Router>
            <GroceryListProvider>
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
                                <PullToRefresh onRefresh={() => lastSearch && fetchRecipes(lastSearch)}>
                                    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                                        {/* Daily Recipe Surprise */}
                                        <div className="mb-8">
                                            <DailyRecipe onRecipeSelect={toggleFavorite} />
                                        </div>

                                        <div className="mb-6">
                                            <SearchForm onSearch={fetchRecipes} />
                                        </div>

                                        {/* Divider */}
                                        <div className="border-b border-slate-200 dark:border-slate-800 mb-6" />

                                        {/* NEW: Filters + Pantry chips */}
                                    <Filters
                                        diet={diet}
                                        setDiet={setDiet}
                                        intolerances={intolerances}
                                        setIntolerances={setIntolerances}
                                        maxTime={maxTime}
                                        setMaxTime={setMaxTime}
                                        mealType={mealType}
                                        setMealType={setMealType}
                                        maxCalories={maxCalories}
                                        setMaxCalories={setMaxCalories}
                                        healthScore={healthScore}
                                        setHealthScore={setHealthScore}
                                    />
                                    
                                    {/* Divider */}
                                    <div className="border-b border-slate-200 dark:border-slate-800 my-6" />
                                    
                                    <PantryChips pantry={pantry} setPantry={setPantry} />

                                    {loading && (
                                        <div className="mt-10">
                                            <RecipeCardSkeletons count={12} />
                                        </div>
                                    )}

                                    {error && <p className="text-center mt-8 text-red-500 font-semibold">{error}</p>}

                                    {recipes.length > 0 && (
                                        <>
                                            {/* Divider */}
                                            <div className="border-b border-slate-200 dark:border-slate-800 my-6" />
                                            <section className="mt-10">
                                                <div className="flex items-baseline justify-between mb-4">
                                                    <h2 className="text-xl sm:text-2xl font-bold">Recipe Results</h2>
                                                </div>

                                            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                                {recipes.map((recipe, idx) => (
                                                    <RecipeCard
                                                        key={recipe.id}
                                                        recipe={recipe}
                                                        index={idx}
                                                        onFavorite={() => toggleFavorite(recipe)}
                                                        isFavorite={favorites.some((f) => f.id === recipe.id)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                        </>
                                    )}

                                    {favorites.length > 0 && (
                                        <section id="favorites-section" className="mt-14">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-amber-400">⭐</span>
                                                    <h2 className="text-xl sm:text-2xl font-bold">Saved Favorites</h2>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-2">
                              {favorites.length} saved
                            </span>
                                                </div>
                                                {preferenceSummary && preferenceSummary.total > 0 && (
                                                    <div className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                        <span>{preferenceSummary.emoji}</span>
                                                        <span className="font-semibold">{preferenceSummary.favoritePercent}% loved</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                                {favorites.map((recipe, idx) => (
                                                    <RecipeCard
                                                        key={recipe.id}
                                                        recipe={recipe}
                                                        index={idx}
                                                        onFavorite={() => toggleFavorite(recipe)}
                                                        isFavorite
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {!loading && !error && recipes.length === 0 && favorites.length === 0 && (
                                        <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex justify-center mb-6">
                                                <CookingAnimation type="recipe-book" className="w-32 h-32 opacity-50" />
                                            </div>
                                            <p className="mb-2 text-lg font-semibold">Ready to cook something delicious?</p>
                                            <p className="mb-4 text-sm">Try something like:</p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {["chicken, rice", "eggs, tomato", "pasta, bacon", "tofu, broccoli"].map(
                                                    (s) => (
                                                        <button
                                                            key={s}
                                                            className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
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
                                </PullToRefresh>
                            }
                        />
                        <Route path="/recipe/:id" element={<RecipePage />} />
                        <Route path="/meal-planner" element={<MealPlanner />} />
                    </Routes>

                    {/* Floating grocery list drawer */}
                    <GroceryDrawer />
                    
                    {/* Back to top button */}
                    <BackToTop />
                </div>
            </GroceryListProvider>
        </Router>
    );
};

export default App;
