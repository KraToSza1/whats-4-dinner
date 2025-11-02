// src/components/PantryChips.jsx
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
    "chicken","rice","eggs","tomato","pasta","broccoli","bacon","tofu","onion","cheese"
];

export default function PantryChips({ pantry, setPantry }) {
    const [custom, setCustom] = useState("");
    const inputRef = useRef(null);

    const toggle = (item) =>
        setPantry((cur) => (cur.includes(item) ? cur.filter((i) => i !== item) : [...cur, item]));

    const addCustom = () => {
        const val = custom.trim().toLowerCase();
        if (!val) return;
        setPantry((cur) => (cur.includes(val) ? cur : [...cur, val]));
        setCustom("");
        inputRef.current?.focus();
    };

    const clearAll = () => setPantry([]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🧊</span>
                    <h3 className="font-semibold text-base sm:text-lg">What's in your pantry?</h3>
                </div>
                <AnimatePresence>
                    {pantry.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={clearAll}
                            className="text-xs px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium transition-colors"
                            title="Clear all ingredients"
                        >
                            ✕ Clear All
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTIONS.map((s, idx) => {
                    const active = pantry.includes(s);
                    return (
                        <motion.button
                            key={s}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => toggle(s)}
                            aria-pressed={active}
                            className={`px-4 py-2 rounded-full border-2 font-medium transition-all text-sm sm:text-base ${
                                active
                                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-300 shadow-sm"
                                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700"
                            }`}
                        >
                            {active && <span className="mr-1">✓</span>}
                            {s}
                        </motion.button>
                    );
                })}
            </div>

            {/* Add your own */}
            <div className="relative flex items-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-lg">➕</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                    placeholder="Add any ingredient..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    aria-label="Add a custom ingredient"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={addCustom}
                    disabled={!custom.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add
                </motion.button>
            </div>

            {pantry.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 px-4 py-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                        ✓ {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {pantry.join(", ")}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
