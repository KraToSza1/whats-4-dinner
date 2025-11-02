import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COMMON_SWAPS = {
    // Dairy swaps
    "butter": ["olive oil", "coconut oil", "avocado", "applesauce", "vegan butter"],
    "milk": ["almond milk", "oat milk", "soy milk", "coconut milk", "cashew milk"],
    "cream": ["coconut cream", "cashew cream", "silken tofu blended"],
    "cheese": ["nutritional yeast", "vegan cheese", "cashew cheese"],
    
    // Protein swaps
    "chicken": ["tofu", "tempeh", "chickpeas", "jackfruit", "mushrooms"],
    "beef": ["lentils", "mushrooms", "tofu", "tempeh", "black beans"],
    "eggs": ["flax eggs", "chickpea flour", "apple sauce", "silken tofu"],
    
    // Gluten swaps
    "flour": ["almond flour", "coconut flour", "oat flour", "gluten-free flour blend", "rice flour"],
    "bread crumbs": ["almond meal", "corn flakes", "gluten-free bread crumbs"],
    "pasta": ["zucchini noodles", "spaghetti squash", "rice noodles", "gluten-free pasta"],
    
    // Sweeteners
    "sugar": ["honey", "maple syrup", "agave", "stevia", "monk fruit"],
    "white sugar": ["coconut sugar", "maple syrup", "date paste"],
    
    // All-purpose
    "onion": ["shallots", "scallions", "leeks"],
    "garlic": ["garlic powder", "shallots"],
    "salt": ["sea salt", "kosher salt", "low-sodium alternatives"],
};

export default function SmartSwaps({ ingredientName }) {
    const [showSwaps, setShowSwaps] = useState(false);
    
    if (!ingredientName) return null;
    
    const lowerName = ingredientName.toLowerCase();
    const swaps = COMMON_SWAPS[lowerName] || 
                  Object.entries(COMMON_SWAPS).find(([key]) => lowerName.includes(key))?.[1] ||
                  null;
    
    if (!swaps) return null;

    return (
        <div className="relative inline-block">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSwaps(!showSwaps)}
                className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                title="Don't have this? See alternatives!"
            >
                🔄 Swap
            </motion.button>

            <AnimatePresence>
                {showSwaps && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSwaps(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute z-50 left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">🔄</span>
                                <span className="font-bold text-sm">Swap for:</span>
                            </div>
                            <ul className="space-y-2">
                                {swaps.map((swap, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(swap);
                                            alert(`Copied "${swap}" to clipboard! 📋`);
                                            setShowSwaps(false);
                                        }}
                                    >
                                        <span>✓</span>
                                        <span className="capitalize">{swap}</span>
                                    </motion.li>
                                ))}
                            </ul>
                            <p className="text-xs text-slate-500 mt-3">
                                Click to copy
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

