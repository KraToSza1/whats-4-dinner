import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    getRecipeNotes,
    updateGeneralNotes,
    updateIngredientNotes,
    updateStepNotes,
} from "../utils/recipeNotes.js";

export default function RecipeNotes({ recipeId, ingredients = [], steps = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [notes, setNotes] = useState(getRecipeNotes(recipeId));
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (recipeId) {
            setNotes(getRecipeNotes(recipeId));
        }
    }, [recipeId]);

    useEffect(() => {
        if (showModal) {
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const handleGeneralChange = (text) => {
        if (!recipeId) return;
        updateGeneralNotes(recipeId, text);
        setNotes({ ...notes, general: text });
    };

    const handleIngredientChange = (index, text) => {
        if (!recipeId) return;
        updateIngredientNotes(recipeId, index, text);
        setNotes({
            ...notes,
            ingredients: { ...notes.ingredients, [index]: text },
        });
    };

    const handleStepChange = (index, text) => {
        if (!recipeId) return;
        updateStepNotes(recipeId, index, text);
        setNotes({
            ...notes,
            steps: { ...notes.steps, [index]: text },
        });
    };

    if (!recipeId) return null;

    const hasNotes = notes.general || Object.keys(notes.ingredients || {}).length > 0 || Object.keys(notes.steps || {}).length > 0;

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Notes button clicked, recipeId:", recipeId);
                    setShowModal(true);
                }}
                type="button"
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-0 touch-manipulation flex-shrink-0 ${
                    hasNotes
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
                title="Recipe notes"
            >
                <span className="text-base sm:text-lg">📝</span>
                <span className="hidden sm:inline">Notes</span>
                {hasNotes && <span className="text-xs">•</span>}
            </motion.button>

            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            key="notes-modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
                            onClick={() => setShowModal(false)}
                            style={{ 
                                zIndex: 99999, 
                                position: 'fixed', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                bottom: 0,
                                pointerEvents: 'auto'
                            }}
                        >
                        <div className="min-h-full flex items-start justify-center pt-8 sm:pt-16 pb-8">
                            <motion.div
                                key="notes-modal-content"
                                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/30 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl"
                                style={{ zIndex: 100000, position: 'relative', pointerEvents: 'auto' }}
                            >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    📝 Recipe Notes
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-2xl hover:text-emerald-400 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setActiveTab("general")}
                                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                                        activeTab === "general"
                                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                            : "border-transparent text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    General
                                </button>
                                {ingredients.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab("ingredients")}
                                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                                            activeTab === "ingredients"
                                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                : "border-transparent text-slate-600 dark:text-slate-400"
                                        }`}
                                    >
                                        Ingredients ({ingredients.length})
                                    </button>
                                )}
                                {steps.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab("steps")}
                                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                                            activeTab === "steps"
                                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                : "border-transparent text-slate-600 dark:text-slate-400"
                                        }`}
                                    >
                                        Steps ({steps.length})
                                    </button>
                                )}
                            </div>

                            {/* General Notes */}
                            {activeTab === "general" && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        General Notes
                                    </label>
                                    <textarea
                                        value={notes.general || ""}
                                        onChange={(e) => handleGeneralChange(e.target.value)}
                                        placeholder="Add your personal notes, tips, modifications, etc..."
                                        className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[200px] resize-y"
                                    />
                                </div>
                            )}

                            {/* Ingredient Notes */}
                            {activeTab === "ingredients" && (
                                <div className="space-y-4">
                                    {ingredients.map((ingredient, index) => (
                                        <div key={index}>
                                            <label className="block text-sm font-medium mb-2">
                                                {ingredient.displayText || ingredient.original || `Ingredient ${index + 1}`}
                                            </label>
                                            <textarea
                                                value={notes.ingredients?.[index] || ""}
                                                onChange={(e) => handleIngredientChange(index, e.target.value)}
                                                placeholder="Add notes for this ingredient..."
                                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[80px] resize-y"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Step Notes */}
                            {activeTab === "steps" && (
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <div key={index}>
                                            <label className="block text-sm font-medium mb-2">
                                                Step {index + 1}
                                            </label>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {step}
                                            </p>
                                            <textarea
                                                value={notes.steps?.[index] || ""}
                                                onChange={(e) => handleStepChange(index, e.target.value)}
                                                placeholder="Add notes for this step..."
                                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[80px] resize-y"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

