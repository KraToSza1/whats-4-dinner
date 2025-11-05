import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getRecipeInformation } from "../api/spoonacular";
import { useGroceryList } from "../context/GroceryListContext.jsx";
import { setMealPlanDay } from "./MealPlanner.jsx";
import ServingsCalculator from "../components/ServingsCalculator.jsx";
import ShareButton from "../components/ShareButton.jsx";
import RecipeRater from "../components/RecipeRater.jsx";
import SmartSwaps from "../components/SmartSwaps.jsx";
import { convertIngredient } from "../utils/unitConverter.js";
import { RecipePageSkeleton } from "../components/LoadingSkeleton.jsx";
import { triggerHaptic } from "../utils/haptics.js";
import { addMealToTracker } from "../components/CalorieTracker.jsx";
import { trackRecipeView, trackRecipeInteraction } from "../utils/analytics.js";

export default function RecipePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const rrLocation = useLocation(); // avoid colliding with window.location

    // Use card data for instant paint, but always fetch full details
    const preloaded = rrLocation.state?.recipe || null;

    const [recipe, setRecipe] = useState(preloaded);
    const [loading, setLoading] = useState(!preloaded);
    const [error, setError] = useState(null);

    // Grocery list context
    const { addMany, setOpen } = useGroceryList();

    // Servings calculator state
    const [targetServings, setTargetServings] = useState(4);
    
    // Unit system state to trigger re-render
    const [unitSystem, setUnitSystem] = useState(() => {
        try {
            return localStorage.getItem("unitSystem") || "metric";
        } catch {
            return "metric";
        }
    });

    // Cook Mode state
    const [cookOpen, setCookOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [ticking, setTicking] = useState(false);

    // simple timer tick
    useEffect(() => {
        if (!ticking || secondsLeft <= 0) return;
        const id = setInterval(() => {
            setSecondsLeft((s) => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [ticking, secondsLeft]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const full = await getRecipeInformation(id); // unified API wrapper
                if (!ignore) {
                    setRecipe(full);
                    // Track recipe view
                    if (full?.id) {
                        trackRecipeView(full.id);
                        trackRecipeInteraction(full.id, "view", {
                            title: full.title,
                            image: full.image,
                        });
                    }
                    // Set initial servings from saved or recipe default
                    try {
                        const saved = localStorage.getItem(`servings:${id}`);
                        if (saved) {
                            setTargetServings(parseInt(saved, 10));
                        } else if (full?.servings) {
                            setTargetServings(full.servings);
                        }
                    } catch {}
                }
            } catch (e) {
                if (!ignore) setError(e.message || "Failed to load recipe.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [id]);
    
    // Save servings preference
    useEffect(() => {
        if (recipe?.id && targetServings !== recipe.servings) {
            try {
                localStorage.setItem(`servings:${recipe.id}`, String(targetServings));
            } catch {}
        }
    }, [targetServings, recipe?.id, recipe?.servings]);
    
    // Listen for unit system changes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "unitSystem") {
                setUnitSystem(e.newValue || "metric");
            }
        };
        window.addEventListener("storage", handleStorageChange);
        // Also check for same-tab changes
        const interval = setInterval(() => {
            try {
                const current = localStorage.getItem("unitSystem") || "metric";
                if (current !== unitSystem) {
                    setUnitSystem(current);
                }
            } catch {}
        }, 500);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearInterval(interval);
        };
    }, [unitSystem]);

    const title = recipe?.title || "Recipe";
    const image = recipe?.image;

    const nutrient = (name) =>
        recipe?.nutrition?.nutrients?.find((x) => x.name === name)?.amount ?? null;

    const macros = useMemo(
        () => [
            { key: "Calories", label: "Calories", value: nutrient("Calories") || 0, max: 800 },
            { key: "Protein", label: "Protein (g)", value: nutrient("Protein") || 0, max: 60 },
            { key: "Carbs", label: "Carbs (g)", value: nutrient("Carbohydrates") || 0, max: 90 },
            { key: "Fat", label: "Fat (g)", value: nutrient("Fat") || 0, max: 60 },
        ],
        [recipe]
    );

    // Scaling logic for ingredients
    const originalServings = recipe?.servings || 4;
    const scaleRatio = targetServings / originalServings;
    
    const scaleIngredientText = (originalText) => {
        if (!originalText || scaleRatio === 1) return originalText;
        
        // Match patterns like "2 cups", "1.5 tbsp", "3 large eggs"
        const patterns = [
            /\b(\d+(?:\.\d+)?)\s*(cup|tbsp|tsp|oz|g|kg|lb|lbs|tablespoon|teaspoon|pound|gram|kilogram)\b/gi,
            /\b(\d+(?:\.\d+)?)\s*(large|medium|small)\b/gi,
            /\b(\d+(?:\.\d+)?)\b/g
        ];
        
        let scaledText = originalText;
        
        // First pass: handle measurements
        scaledText = scaledText.replace(/\b(\d+(?:\.\d+)?)\s*(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|g|kg|lb|lbs|pound|pounds|gram|grams|kilogram|kilograms)\b/gi, (match, num, unit) => {
            const amount = parseFloat(num);
            const scaled = Math.round(amount * scaleRatio * 100) / 100;
            return `${scaled} ${unit}`;
        });
        
        // Second pass: handle whole numbers
        if (scaleRatio !== 1) {
            scaledText = scaledText.replace(/\b(\d+)\b/g, (match, num) => {
                const amount = parseFloat(num);
                if (amount >= 1 && amount <= 20) {
                    const scaled = Math.round(amount * scaleRatio * 100) / 100;
                    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2);
                }
                return match;
            });
        }
        
        return scaledText;
    };
    
    // Scaled ingredients with ratio
    const scaledIngredients = useMemo(() => {
        if (!recipe?.extendedIngredients) return [];
        return recipe.extendedIngredients.map(ing => {
            const scaled = scaleIngredientText(ing.original);
            const converted = convertIngredient(scaled);
            // Simple display: just show the converted (scaled) text
            return {
                ...ing,
                displayText: converted,
                originalText: ing.original
            };
        });
    }, [recipe?.extendedIngredients, scaleRatio, unitSystem]);

    const steps = useMemo(() => {
        const analyzed = recipe?.analyzedInstructions?.[0]?.steps;
        if (Array.isArray(analyzed) && analyzed.length) {
            return analyzed.map((s) => s.step).filter(Boolean);
        }
        if (recipe?.instructions) {
            const tmp = document.createElement("div");
            tmp.innerHTML = recipe.instructions;
            const text = tmp.textContent || tmp.innerText || "";
            return text.split(/\.\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
        }
        return [];
    }, [recipe]);

    const openCookMode = () => {
        setStepIndex(0);
        setSecondsLeft(0);
        setTicking(false);
        setCookOpen(true);
        triggerHaptic("light");
    };
    const closeCookMode = () => {
        setCookOpen(false);
        setTicking(false);
        setSecondsLeft(0);
    };
    const nextStep = useCallback(() => setStepIndex((i) => Math.min(steps.length - 1, i + 1)), [steps.length]);
    const prevStep = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
    
    // Swipe gestures for cook mode
    useEffect(() => {
        if (!cookOpen) return;

        let startX = 0;
        let startY = 0;
        let swipeDistance = 0;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        };

        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            swipeDistance = touch.clientX - startX;
        };

        const handleTouchEnd = () => {
            const threshold = 100;
            
            if (Math.abs(swipeDistance) > threshold) {
                if (swipeDistance > 0) {
                    // Swipe right - previous step
                    prevStep();
                    triggerHaptic("light");
                } else {
                    // Swipe left - next step
                    nextStep();
                    triggerHaptic("light");
                }
            }
            
            swipeDistance = 0;
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [cookOpen, nextStep, prevStep]);
    
    const startTimerMins = (m) => {
        setSecondsLeft(m * 60);
        setTicking(true);
        triggerHaptic("success");
    };
    const pauseTimer = () => setTicking(false);
    const resumeTimer = () => secondsLeft > 0 && setTicking(true);
    const resetTimer = () => {
        setTicking(false);
        setSecondsLeft(0);
    };

    const checklistKey = `checklist:${id}`;
    const [checked, setChecked] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(checklistKey) || "{}");
        } catch {
            return {};
        }
    });
    useEffect(() => {
        localStorage.setItem(checklistKey, JSON.stringify(checked));
    }, [checked, checklistKey]);
    const toggleChecked = (uid) => setChecked((c) => ({ ...c, [uid]: !c[uid] }));

    if (loading) {
        return <RecipePageSkeleton />;
    }
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
                        >
                            ← Back
                        </button>
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
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-800 shadow-md backdrop-blur-sm"
            title={label}
        >
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{label}:</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-100">{value ?? "—"}</span>
        </motion.div>
    );

    const MacroBar = ({ label, value, max }) => {
        const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
        const colors = {
            "Calories": "from-orange-500 to-red-500",
            "Protein": "from-blue-500 to-cyan-500",
            "Carbs": "from-yellow-500 to-amber-500",
            "Fat": "from-purple-500 to-pink-500"
        };
        const colorClass = colors[label] || "from-emerald-500 to-teal-500";
        return (
            <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 p-4 border-2 border-emerald-200 dark:border-emerald-800 shadow-md">
                <div className="flex items-center justify-between text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                    <span>{label}</span>
                    <span className="text-lg">
            {Number(value || 0).toFixed(1)}
          </span>
                </div>
                <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${colorClass} shadow-sm`}
                    />
                </div>
            </div>
        );
    };

    const addAllToGrocery = () => {
        const items = scaledIngredients.length > 0
            ? scaledIngredients.map((i) => i.displayText || "")
            : (recipe?.extendedIngredients || []).map((i) => i.original || "");
        const filtered = items.filter(Boolean);
        if (filtered.length) {
            addMany(filtered, true); // Keep full quantities
            setOpen(true);
            // Track interaction
            if (recipe?.id) {
                trackRecipeInteraction(recipe.id, "add_to_grocery", {
                    title: recipe.title,
                    ingredientCount: filtered.length,
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Top bar */}
            <div className="sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
                <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex items-center justify-between gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px] sm:min-h-0 touch-manipulation"
                    >
                        ← <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Add to planner */}
                        <button
                            onClick={() => {
                                // Default to adding as dinner
                                const currentDay = new Date().getDay() - 1;
                                const todayIdx = currentDay >= 0 ? currentDay : 6;
                                setMealPlanDay(todayIdx, "dinner", recipe);
                                triggerHaptic("success");
                            }}
                            className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-xs sm:text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
                            title="Add to today's dinner"
                        >
                            <span className="hidden sm:inline">Add to Planner</span>
                            <span className="sm:hidden">📅</span>
                        </button>

                        {/* Share */}
                        <ShareButton
                            title={title}
                            text={`Check out this recipe: ${title}`}
                            url={window.location.href}
                        />

                        {/* Print */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.print()}
                            className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md border border-slate-300 dark:border-slate-700 min-h-[44px] sm:min-h-0 touch-manipulation text-base sm:text-lg"
                            title="Print"
                        >
                            🖨️
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {image && (
                    <>
                        <img
                            src={image}
                            alt=""
                            className="absolute inset-0 w-full h-[40vh] object-cover blur-3xl opacity-40 scale-110"
                            aria-hidden
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/15 to-emerald-950/60 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/8 to-cyan-900/8 pointer-events-none" />
                    </>
                )}
                <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-8 sm:py-12 relative">
                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight px-4 sm:px-6 md:px-8 break-words hyphens-auto bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-lg mb-4 sm:mb-6 select-none"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word', userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                        {title}
                    </motion.h1>

                    <div className="mt-6 flex flex-wrap gap-3 justify-center px-2">
                        <Stat
                            label="Ready"
                            value={recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : "—"}
                            icon="⏱️"
                        />
                        <Stat label="Servings" value={recipe.servings} icon="🍽️" />
                        <Stat label="Health" value={recipe.healthScore ?? "—"} icon="💚" />
                        <Stat label="Likes" value={recipe.aggregateLikes ?? "—"} icon="👍" />
                    </div>

                    {image && (
                        <div className="flex justify-center mt-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="relative group"
                            >
                                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                                <motion.img
                                    whileHover={{ scale: 1.02 }}
                                    src={image}
                                    alt={title}
                                    className="relative mx-auto w-full max-w-3xl aspect-[4/3] object-cover rounded-2xl shadow-2xl ring-4 ring-emerald-200/50 dark:ring-emerald-800/50"
                                />
                            </motion.div>
                        </div>
                    )}

                    {steps.length > 0 && (
                        <div className="mt-6 flex justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(5, 150, 105, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={openCookMode}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                title="Open step-by-step Cook Mode with timer"
                            >
                                <span className="text-xl">👨‍🍳</span>
                                Start Cook Mode
                            </motion.button>
                        </div>
                    )}
                </div>
            </section>

            {/* Body */}
            <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
                {/* Macros */}
                <section className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                    <h2 className="text-2xl font-extrabold mb-4 text-center bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                        🍽️ Nutritional Info
                    </h2>
                    <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {macros.map((m) => (
                            <MacroBar key={m.key} label={m.label} value={m.value} max={m.max} />
                        ))}
                    </div>
                </section>

                {/* Servings Calculator */}
                {recipe?.servings && (
                    <section>
                        <ServingsCalculator
                            originalServings={originalServings}
                            targetServings={targetServings}
                            onServingsChange={setTargetServings}
                        />
                    </section>
                )}

                {/* Ingredients checklist + Grocery */}
                <section className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h2 className="text-2xl font-extrabold text-center sm:text-left bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                            🧂 Ingredients
                        </h2>
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(34, 197, 94, 0.3)" }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-semibold shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                                onClick={() => setOpen(true)}
                                title="Open grocery list"
                            >
                                🛒 Open List
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(5, 150, 105, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                onClick={addAllToGrocery}
                                title="Add all ingredients to grocery list"
                            >
                                ➕ Add All to List
                            </motion.button>
                            {nutrient("Calories") && (
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(139, 92, 246, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => {
                                        const calories = Math.round(nutrient("Calories") * (targetServings / originalServings));
                                        addMealToTracker(recipe.id, title, calories);
                                        triggerHaptic("success");
                                        alert(`Added ${calories} calories to your tracker! 🎯`);
                                    }}
                                    title="Add to calorie tracker"
                                >
                                    📊 Add to Tracker
                                </motion.button>
                            )}
                        </div>
                    </div>

                    <ul className="mx-auto max-w-3xl grid sm:grid-cols-2 gap-2">
                        {scaledIngredients.length ? (
                            scaledIngredients.map((ing, idx) => {
                                const uid = `${ing.id ?? "noid"}-${idx}`;
                                const isChecked = !!checked[uid];
                                return (
                                    <motion.li
                                        key={uid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className={`flex items-start gap-3 rounded-xl px-4 py-3 border-2 transition-all shadow-sm ${
                                            isChecked
                                                ? "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-300 dark:border-emerald-700"
                                                : "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600"
                                        }`}
                                    >
                                        <motion.input
                                            type="checkbox"
                                            whileTap={{ scale: 0.9 }}
                                            className="mt-1 h-4 w-4 cursor-pointer"
                                            checked={isChecked}
                                            onChange={() => toggleChecked(uid)}
                                        />
                                        <div className="flex-1 flex items-start justify-between gap-2">
                                            <span className={isChecked ? "line-through opacity-70" : ""}>
                                                {ing.displayText}
                                            </span>
                                            <SmartSwaps ingredientName={ing.displayText} />
                                        </div>
                                    </motion.li>
                                );
                            })
                        ) : (
                            <li className="text-slate-500 text-center">No ingredient list available.</li>
                        )}
                    </ul>
                </section>

                {/* Steps */}
                {steps.length > 0 && (
                    <section className="print:break-inside-avoid bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                        <h2 className="text-2xl font-extrabold mb-4 text-center bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                            📋 Instructions
                        </h2>
                        <ol className="mx-auto max-w-3xl space-y-4">
                            {steps.map((s, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-4 items-start bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-800 shadow-md"
                                >
                                    <span className="shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg">
                                        {i + 1}
                                    </span>
                                    <p className="leading-relaxed text-slate-700 dark:text-slate-200 font-medium">{s}</p>
                                </motion.li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* Recipe Rater */}
                <section>
                    <RecipeRater recipeId={id} recipeTitle={title} />
                </section>
            </div>

            {/* Cook Mode overlay */}
            {cookOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && closeCookMode()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 border-2 border-emerald-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background gradient decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        {/* Header */}
                        <div className="relative flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">👨‍🍳</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                                        Cook Mode
                                    </h3>
                                    <p className="text-xs text-slate-400">Step-by-step cooking guide</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={closeCookMode}
                                className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-red-500/20 border border-slate-600 hover:border-red-500/50 flex items-center justify-center transition-all"
                                title="Close Cook Mode"
                            >
                                <span className="text-xl">✕</span>
                            </motion.button>
                        </div>

                        {/* Step Navigation */}
                        <div className="relative flex items-center justify-between mb-6">
                            <motion.button
                                whileHover={{ scale: 1.05, x: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={prevStep}
                                disabled={stepIndex === 0}
                                className="px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-emerald-600/20 border-2 border-slate-600 hover:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-slate-700/50 disabled:hover:border-slate-600 transition-all flex items-center gap-2 font-semibold"
                            >
                                <span className="text-lg">←</span>
                                <span className="hidden sm:inline">Previous</span>
                            </motion.button>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                                <span className="text-sm font-semibold text-emerald-300">Step</span>
                                <span className="font-mono text-lg font-bold text-white">{stepIndex + 1}</span>
                                <span className="text-sm text-slate-400">of</span>
                                <span className="font-mono text-lg font-bold text-white">{steps.length}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, x: 2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={nextStep}
                                disabled={stepIndex === steps.length - 1}
                                className="px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-emerald-600/20 border-2 border-slate-600 hover:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-slate-700/50 disabled:hover:border-slate-600 transition-all flex items-center gap-2 font-semibold"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <span className="text-lg">→</span>
                            </motion.button>
                        </div>

                        {/* Current Step */}
                        <motion.div
                            key={stepIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="relative min-h-[200px] text-lg leading-relaxed bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/20 shadow-xl mb-6"
                        >
                            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold shadow-lg">
                                {stepIndex + 1}
                            </div>
                            <p className="text-slate-100 font-medium pt-4 sm:pt-0 sm:pl-12">{steps[stepIndex]}</p>
                        </motion.div>

                        {/* Timer Section */}
                        <div className="relative bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-2xl p-6 border-2 border-emerald-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">⏱️</span>
                                    <span className="text-sm font-semibold text-emerald-300">Timer</span>
                                </div>
                                <motion.div
                                    animate={ticking ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 1, repeat: ticking ? Infinity : 0 }}
                                    className="font-mono text-3xl sm:text-4xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                                >
                                    {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                                </motion.div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startTimerMins(5)}
                                    className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold transition-all"
                                >
                                    5m
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startTimerMins(10)}
                                    className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold transition-all"
                                >
                                    10m
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startTimerMins(15)}
                                    className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold transition-all"
                                >
                                    15m
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startTimerMins(30)}
                                    className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-emerald-600/30 border-2 border-slate-600 hover:border-emerald-500 font-semibold transition-all"
                                >
                                    30m
                                </motion.button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {!ticking && secondsLeft > 0 ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(5, 150, 105, 0.4)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={resumeTimer}
                                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>▶</span>
                                        <span>Resume</span>
                                    </motion.button>
                                ) : ticking ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={pauseTimer}
                                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>⏸</span>
                                        <span>Pause</span>
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(5, 150, 105, 0.4)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={resumeTimer}
                                        disabled={secondsLeft === 0}
                                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>▶</span>
                                        <span>Start Timer</span>
                                    </motion.button>
                                )}
                                {secondsLeft > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={resetTimer}
                                        className="px-6 py-3 rounded-xl bg-slate-700/50 hover:bg-red-600/30 border-2 border-slate-600 hover:border-red-500 font-semibold transition-all"
                                    >
                                        Reset
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
