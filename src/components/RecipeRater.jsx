import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackRecipeInteraction } from "../utils/analytics.js";

export default function RecipeRater({ recipeId, recipeTitle }) {
    const storageKey = `recipeRating:${recipeId}`;
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);

    // Load saved rating and notes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                setRating(data.rating || 0);
                setNotes(data.notes || "");
                setShowNotes(!!data.notes);
            }
        } catch {}
    }, [storageKey]);

    // Save when changed
    useEffect(() => {
        if (rating > 0 || notes) {
            try {
                localStorage.setItem(storageKey, JSON.stringify({ rating, notes }));
            } catch {}
        }
    }, [rating, notes, storageKey]);

    const handleRating = (stars) => {
        setRating(stars);
        // Track interaction
        if (recipeId) {
            trackRecipeInteraction(recipeId, "rate", {
                title: recipeTitle,
                rating: stars,
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>⭐</span>
                    Rate This Recipe
                </h3>
                {rating > 0 && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={() => setRating(0)}
                        className="text-xs text-slate-500 hover:text-red-500 transition-colors"
                    >
                        Clear
                    </motion.button>
                )}
            </div>

            {/* Star Rating */}
            <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRating(star)}
                        className="text-4xl leading-none"
                        aria-label={`Rate ${star} stars`}
                    >
                        <motion.span
                            animate={rating >= star ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {rating >= star ? "⭐" : "☆"}
                        </motion.span>
                    </motion.button>
                ))}
            </div>

            {/* Rating feedback */}
            <AnimatePresence>
                {rating > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {rating === 5 && "🌟 Amazing! Perfect recipe!"}
                            {rating === 4 && "👍 Great! Will make again"}
                            {rating === 3 && "😊 Good, but could be better"}
                            {rating === 2 && "🤷 Not my favorite"}
                            {rating === 1 && "👎 Didn't enjoy this"}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Personal Notes */}
            <div>
                <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2"
                >
                    {showNotes ? "▼" : "▶"} Personal Notes {notes && "(saved)"}
                </button>

                <AnimatePresence>
                    {showNotes && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add your cooking tips, substitutions, or modifications here..."
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                rows={4}
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                💡 Tip: "Used less salt - perfect!" or "Substituted butter for oil"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

