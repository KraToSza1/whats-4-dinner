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
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
            {Number(value || 0).toFixed(2)}
          </span>
                </div>
                <div className="h-2 rounded bg-slate-200/70 dark:bg-slate-700/70 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-emerald-500"
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
        }
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
                        {/* Add to planner */}
                        <button
                            onClick={() => {
                                // Default to adding as dinner
                                const currentDay = new Date().getDay() - 1;
                                const todayIdx = currentDay >= 0 ? currentDay : 6;
                                setMealPlanDay(todayIdx, "dinner", recipe);
                                triggerHaptic("success");
                            }}
                            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            title="Add to today's dinner"
                        >
                            Add to Planner
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
                            className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700"
                            title="Print"
                        >
                            🖨️
                        </motion.button>
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
                        transition={{ duration: 0.35 }}
                        className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight"
                    >
                        {title}
                    </motion.h1>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <Stat
                            label="Ready"
                            value={recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : "—"}
                            icon="⏱️"
                        />
                        <Stat label="Servings" value={recipe.servings} icon="🍽️" />
                        <Stat label="Health" value={recipe.healthScore ?? "—"} icon="💚" />
                        <Stat label="Likes" value={recipe.aggregateLikes ?? "—"} icon="👍" />
                    </div>

                    {steps.length > 0 && (
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={openCookMode}
                                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Open step-by-step Cook Mode with timer"
                            >
                                Start Cook Mode
                            </button>
                        </div>
                    )}

                    {image && (
                        <div className="flex justify-center mt-6">
                            <motion.img
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1 }}
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
                <section>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h2 className="text-xl font-bold text-center sm:text-left">🧂 Ingredients</h2>
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1.5 rounded-md border"
                                onClick={() => setOpen(true)}
                                title="Open grocery list"
                            >
                                Open List
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white"
                                onClick={addAllToGrocery}
                                title="Add all ingredients to grocery list"
                            >
                                Add all to List
                            </motion.button>
                            {nutrient("Calories") && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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
                                        className={`flex items-start gap-3 rounded-lg px-3 py-2 border transition-all ${
                                            isChecked
                                                ? "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50"
                                                : "bg-slate-100/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/60"
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

                {/* Recipe Rater */}
                <section>
                    <RecipeRater recipeId={id} recipeTitle={title} />
                </section>
            </div>

            {/* Cook Mode overlay */}
            {cookOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Cook Mode</h3>
                            <button onClick={closeCookMode} className="px-3 py-1.5 rounded-md border border-slate-700">Close</button>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={prevStep} disabled={stepIndex === 0} className="px-3 py-2 rounded-md border border-slate-700 disabled:opacity-40">← Prev</button>
                            <div className="text-sm opacity-80">Step {stepIndex + 1} of {steps.length}</div>
                            <button onClick={nextStep} disabled={stepIndex === steps.length - 1} className="px-3 py-2 rounded-md border border-slate-700 disabled:opacity-40">Next →</button>
                        </div>
                        <div className="min-h-[160px] text-lg leading-relaxed bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                            {steps[stepIndex]}
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm opacity-80">Timer</div>
                                <div className="font-mono text-2xl tabular-nums">
                                    {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={() => startTimerMins(5)} className="px-3 py-1.5 rounded-md border border-slate-700">5m</button>
                                <button onClick={() => startTimerMins(10)} className="px-3 py-1.5 rounded-md border border-slate-700">10m</button>
                                <button onClick={() => startTimerMins(15)} className="px-3 py-1.5 rounded-md border border-slate-700">15m</button>
                                <span className="mx-1 opacity-40">|</span>
                                {!ticking ? (
                                    <button onClick={resumeTimer} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white">Start</button>
                                ) : (
                                    <button onClick={pauseTimer} className="px-3 py-1.5 rounded-md border border-slate-700">Pause</button>
                                )}
                                <button onClick={resetTimer} className="px-3 py-1.5 rounded-md border border-slate-700">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
