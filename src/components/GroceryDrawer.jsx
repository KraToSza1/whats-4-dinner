import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGroceryList } from "../context/GroceryListContext.jsx";
import ShareButton from "./ShareButton.jsx";
import { getSimpleConversion } from "../utils/groceryParser.js";

export default function GroceryDrawer() {
    const { open, setOpen, items, removeAt, clear } = useGroceryList();
    const [checkedItems, setCheckedItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("grocery:checked") || "{}");
        } catch {
            return {};
        }
    });

    const toggleCheck = (idx) => {
        setCheckedItems((prev) => {
            const key = `item-${idx}`;
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem("grocery:checked", JSON.stringify(updated));
            return updated;
        });
    };

    const copy = async () => {
        const text = items.join("\n");
        try {
            await navigator.clipboard.writeText(text);
            alert("Grocery list copied!");
        } catch {
            // no-op
        }
    };

    const share = async () => {
        const text = items.join("\n");
        if (navigator.share) {
            try {
                await navigator.share({ title: "Grocery List", text });
                return;
            } catch {
                /* fall through to copy */
            }
        }
        await copy();
    };

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={items.length > 0 ? {
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
                } : {}}
                className="fixed bottom-4 right-4 rounded-full px-4 py-2 bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow z-40"
                aria-label={`Open grocery list (${items.length} items)`}
            >
                <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="inline-block mr-2"
                >
                    🛒
                </motion.span>
                Grocery list ({items.length})
            </motion.button>

            {/* Drawer */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40"
                        onClick={() => setOpen(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="absolute right-0 top-0 h-full w-[90%] max-w-sm bg-white dark:bg-slate-900 p-4 shadow-xl border-l border-slate-200 dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                    <span className="text-xl">🛒</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">My Grocery List</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{items.length} items</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                aria-label="Close grocery list"
                            >
                                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        {items.length > 0 && (
                            <div className="mb-3 flex justify-end">
                                <ShareButton
                                    title="My Grocery List"
                                    text={`My grocery list:\n${items.join("\n")}`}
                                    url={window.location.href}
                                />
                            </div>
                        )}

                        <ul className="space-y-2 max-h-[65vh] overflow-auto pb-2">
                            {items.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🛒</div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Your list is empty</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add ingredients from recipes to get started!</p>
                                </div>
                            )}
                            {items.map((it, idx) => {
                                const isChecked = checkedItems[`item-${idx}`];
                                return (
                                    <motion.li
                                        key={`${it}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                                            isChecked
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                                        }`}
                                    >
                                        <motion.input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleCheck(idx)}
                                            whileTap={{ scale: 0.9 }}
                                            className="w-5 h-5 cursor-pointer accent-emerald-600 rounded"
                                        />
                                        <div className={`flex-1 min-w-0 ${isChecked ? "line-through text-slate-500" : ""}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-medium break-words">{it}</span>
                                                {!isChecked && (() => {
                                                    const conversion = getSimpleConversion(it);
                                                    return conversion ? (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono flex-shrink-0">
                                                            {conversion}
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => removeAt(idx)}
                                            className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            aria-label={`Remove ${it}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.button>
                                    </motion.li>
                                );
                            })}
                        </ul>

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={copy}
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                                disabled={items.length === 0}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </div>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={clear}
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                disabled={items.length === 0}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Clear
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}