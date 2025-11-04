import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const FAQ_ITEMS = [
    {
        category: "Getting Started",
        questions: [
            {
                q: "How do I search for recipes?",
                a: "Use the search bar on the home page. You can search by ingredients, cuisine, or dish name. Add ingredients from your pantry to find recipes using what you have!",
            },
            {
                q: "How do I save favorites?",
                a: "Click the heart icon on any recipe card or recipe page. Your favorites are saved locally in your browser and will persist across sessions.",
            },
            {
                q: "How does the meal planner work?",
                a: "Go to the Meal Planner page to plan your week. You can add recipes to breakfast, lunch, or dinner for any day. Use 'AI Plan My Week' to automatically fill empty slots based on your preferences!",
            },
        ],
    },
    {
        category: "Features",
        questions: [
            {
                q: "What is the Family Plan?",
                a: "Family Plan lets you manage multiple family members, track allergies and dietary restrictions per person, and verify meals. Perfect for families with children, nannies, or au pairs who need to track who ate what.",
            },
            {
                q: "How do I add ingredients to my pantry?",
                a: "Use the 'What's in your pantry?' section on the home page. Type ingredients separated by commas, or click the chips to remove them. The app will use these when searching for recipes.",
            },
            {
                q: "Can I change serving sizes?",
                a: "Yes! On any recipe page, use the Servings Calculator to adjust portions. The ingredients will automatically scale, and you can add the adjusted amounts to your grocery list.",
            },
            {
                q: "How does the grocery list work?",
                a: "Click 'Add all to List' on any recipe page to add ingredients. The grocery list drawer opens from the bottom. You can check off items as you shop. Quantities are automatically converted to grams/ounces.",
            },
        ],
    },
    {
        category: "Account & Settings",
        questions: [
            {
                q: "How do I sign in?",
                a: "Click the menu button and select 'Sign In'. You can sign in with email (magic link) or Google. No password needed!",
            },
            {
                q: "How do I export my data?",
                a: "Go to your Profile page and click 'Export All Data'. This downloads a JSON file with all your favorites, meal plans, grocery lists, and preferences.",
            },
            {
                q: "How do I change units (metric/US/UK)?",
                a: "Go to your Profile page and select your preferred measurement system under 'Preferences'. Changes apply immediately to all recipes.",
            },
            {
                q: "Can I delete my account?",
                a: "Yes. Go to your Profile page and click 'Delete Account'. This will remove all your data and sign you out. This action cannot be undone.",
            },
        ],
    },
    {
        category: "Troubleshooting",
        questions: [
            {
                q: "Recipes aren't loading",
                a: "Check your internet connection. The app caches recipes for offline use, but new searches require an active connection. Try refreshing the page.",
            },
            {
                q: "My favorites disappeared",
                a: "Favorites are stored in your browser's local storage. Clear your browser data will delete them. Make sure to export your data regularly as a backup!",
            },
            {
                q: "Google sign-in isn't working",
                a: "Make sure Google OAuth is enabled in your Supabase dashboard. Check the GOOGLE_AUTH_STEP_BY_STEP.md guide for setup instructions.",
            },
            {
                q: "The app looks broken",
                a: "Try refreshing the page (Ctrl+R or Cmd+R). If issues persist, clear your browser cache or try an incognito window. Check the browser console (F12) for errors.",
            },
        ],
    },
];

export default function Help() {
    const navigate = useNavigate();
    const [openCategory, setOpenCategory] = useState(null);
    const [openQuestion, setOpenQuestion] = useState(null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate("/")}
                        className="mb-4 text-emerald-600 hover:underline flex items-center gap-2"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-4xl font-bold mb-2">Help & FAQ</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Everything you need to know about What's 4 Dinner
                    </p>
                </motion.div>

                {/* Quick Links */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8"
                >
                    <h2 className="text-xl font-bold mb-4">Quick Links</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                            href="/profile"
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="font-semibold">Profile & Settings</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Manage your account
                            </div>
                        </a>
                        <a
                            href="/family-plan"
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="font-semibold">Family Plan</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Manage family members
                            </div>
                        </a>
                        <a
                            href="/meal-planner"
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="font-semibold">Meal Planner</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Plan your week
                            </div>
                        </a>
                        <a
                            href="/terms"
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="font-semibold">Terms of Service</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Legal information
                            </div>
                        </a>
                    </div>
                </motion.section>

                {/* FAQ */}
                <div className="space-y-6">
                    {FAQ_ITEMS.map((category, categoryIndex) => (
                        <motion.section
                            key={category.category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + categoryIndex * 0.1 }}
                            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <button
                                onClick={() =>
                                    setOpenCategory(
                                        openCategory === category.category ? null : category.category
                                    )
                                }
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <h2 className="text-xl font-bold">{category.category}</h2>
                                <span className="text-2xl">
                                    {openCategory === category.category ? "−" : "+"}
                                </span>
                            </button>

                            {openCategory === category.category && (
                                <div className="px-6 pb-4 space-y-2">
                                    {category.questions.map((item, index) => (
                                        <div
                                            key={index}
                                            className="border-b border-slate-200 dark:border-slate-700 last:border-0 pb-3 last:pb-0 pt-3 first:pt-0"
                                        >
                                            <button
                                                onClick={() =>
                                                    setOpenQuestion(
                                                        openQuestion === `${category.category}-${index}`
                                                            ? null
                                                            : `${category.category}-${index}`
                                                    )
                                                }
                                                className="w-full text-left flex items-start justify-between gap-4"
                                            >
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {item.q}
                                                </span>
                                                <span className="text-slate-500 flex-shrink-0">
                                                    {openQuestion === `${category.category}-${index}` ? "−" : "+"}
                                                </span>
                                            </button>
                                            {openQuestion === `${category.category}-${index}` && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-2 text-slate-600 dark:text-slate-400"
                                                >
                                                    {item.a}
                                                </motion.p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ))}
                </div>

                {/* Contact */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mt-8 text-center"
                >
                    <h2 className="text-xl font-bold mb-2">Still Need Help?</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Check your Profile page for account settings, or visit the Terms of Service
                        for legal information.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <a
                            href="/profile"
                            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Go to Profile
                        </a>
                        <a
                            href="/terms"
                            className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Terms of Service
                        </a>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

