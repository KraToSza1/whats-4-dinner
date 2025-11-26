import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';

const FEATURE_MESSAGES = {
  budget_tracker: {
    emoji: '💰',
    title: 'Smart Budget Tracking',
    message:
      'Want to save money on groceries? Our Budget Tracker helps you track meal costs, analyze spending patterns, and stay within your budget!',
    benefits: [
      'Track meal costs',
      'Analyze spending',
      'Stay within budget',
      'Smart savings insights',
    ],
  },
  analytics: {
    emoji: '📊',
    title: 'Analytics & Insights',
    message:
      'Discover your cooking patterns! See what you cook most, track your nutrition trends, and get personalized insights about your food journey.',
    benefits: [
      'View cooking patterns',
      'Track nutrition trends',
      'Get personalized insights',
      'Understand your habits',
    ],
  },
  meal_planner: {
    emoji: '🍽️',
    title: 'Meal Planner',
    message:
      'Never wonder "what\'s for dinner?" again! Plan your entire week, get smart meal suggestions, and make grocery shopping a breeze.',
    benefits: [
      'Plan your week',
      'Smart meal suggestions',
      'Easy grocery lists',
      'Never wonder what to cook',
    ],
  },
  collections: {
    emoji: '📚',
    title: 'Recipe Collections',
    message:
      'Keep your recipes organized! Create custom collections like "Weeknight Dinners", "Holiday Favorites", or "Meal Prep Ideas".',
    benefits: ['Organize recipes', 'Custom collections', 'Easy access', 'Never lose a recipe'],
  },
  dietician_ai: {
    emoji: '🤖',
    title: 'AI Dietician',
    message:
      'Meet your personal AI Dietician! Get instant nutrition advice, meal planning help, and answers to all your food questions.',
    benefits: [
      'Instant nutrition advice',
      'Meal planning help',
      'Answer food questions',
      'Personalized guidance',
    ],
  },
  full_nutrition: {
    emoji: '🥗',
    title: 'Full Nutrition Label',
    message:
      "Want to know exactly what you're eating? View complete FDA-style nutrition facts with detailed macros, vitamins, and minerals.",
    benefits: [
      'Complete nutrition facts',
      'Detailed macros',
      'Vitamins & minerals',
      'FDA-style labels',
    ],
  },
  cuisine_filter: {
    emoji: '🌍',
    title: 'Cuisine Filter',
    message:
      'Explore world cuisines! Filter by Italian, Asian, Mexican, and more. Discover flavors from around the globe!',
    benefits: [
      'Filter by cuisine',
      'Explore world flavors',
      'Find authentic recipes',
      'Discover new cultures',
    ],
  },
  difficulty_filter: {
    emoji: '🎯',
    title: 'Difficulty Filter',
    message:
      'Find recipes that match your skill level! Filter by Easy, Medium, or Hard difficulty and cook with confidence!',
    benefits: [
      'Match your skill level',
      'Easy, Medium, Hard options',
      'Cook with confidence',
      'Learn at your pace',
    ],
  },
  family_plan: {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Family Plan',
    message:
      "Manage your entire family's meals, allergies, and preferences! Track multiple family members, customize portion sizes, and ensure everyone gets the nutrition they need.",
    benefits: [
      'Unlimited family members',
      'Track allergies & dietary restrictions',
      'Age-appropriate portion sizes',
      'BMI tracking & nutrition recommendations',
      'Meal logging for each member',
      'Family meal planning',
    ],
  },
};

export default function PremiumFeatureModal({ isOpen, onClose, featureKey }) {
  const feature = FEATURE_MESSAGES[featureKey] || FEATURE_MESSAGES.meal_planner;

  const handleViewPlans = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openProModal'));
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 pointer-events-auto relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition-colors z-10 touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg text-4xl">
                    {feature.emoji}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-slate-900 dark:text-white">
                  {feature.title}
                </h2>

                {/* Message */}
                <p className="text-center text-slate-700 dark:text-slate-300 mb-6 text-sm sm:text-base leading-relaxed">
                  {feature.message}
                </p>

                {/* Benefits */}
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm sm:text-base">
                        <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleViewPlans}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                  >
                    <span>View Plans</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-colors touch-manipulation min-h-[44px]"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Footer text */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                  Unlock this feature and more with our premium plans! ✨
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
