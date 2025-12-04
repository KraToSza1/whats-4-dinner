import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackToHome from '../components/BackToHome.jsx';
import {
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Users,
  ChefHat,
  ShoppingCart,
  Calendar,
  Heart,
  Settings,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Globe,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Video,
  FileText,
  ExternalLink,
  ArrowRight,
  Star,
  Gift,
  BarChart3,
  Target,
  Leaf,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Recipe Search',
    description: 'Find recipes by ingredients, cuisine, dietary restrictions, and more',
    color: 'emerald',
  },
  {
    icon: ChefHat,
    title: 'Meal Planning',
    description: 'Plan your entire week with AI-powered meal suggestions',
    color: 'purple',
  },
  {
    icon: ShoppingCart,
    title: 'Smart Grocery Lists',
    description: 'Automatically generate organized shopping lists from your meal plans',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Family Management',
    description: 'Track meals, allergies, and dietary needs for your entire family',
    color: 'pink',
  },
  {
    icon: BarChart3,
    title: 'Nutrition Analytics',
    description: 'Track your nutrition intake and get personalized insights',
    color: 'orange',
  },
  {
    icon: Heart,
    title: 'Recipe Collections',
    description: 'Organize your favorite recipes into custom collections',
    color: 'red',
  },
];

const QUICK_START_STEPS = [
  {
    step: 1,
    title: 'Search for Recipes',
    description: 'Use the search bar to find recipes by ingredients, cuisine, or dish name',
    icon: Search,
    action: 'Try searching now',
  },
  {
    step: 2,
    title: 'Save Your Favorites',
    description: 'Click the heart icon on any recipe to save it to your favorites',
    icon: Heart,
    action: 'Browse recipes',
  },
  {
    step: 3,
    title: 'Plan Your Meals',
    description: 'Go to Meal Planner and let AI suggest meals for your week',
    icon: Calendar,
    action: 'Open Meal Planner',
  },
  {
    step: 4,
    title: 'Create Grocery Lists',
    description: 'Add ingredients to your smart grocery list and shop efficiently',
    icon: ShoppingCart,
    action: 'View Grocery List',
  },
];

const FAQ_ITEMS = [
  {
    category: 'Getting Started',
    icon: Sparkles,
    color: 'emerald',
    questions: [
      {
        q: 'How do I search for recipes?',
        a: 'Use the search bar on the home page. You can search by ingredients, cuisine, or dish name. Add ingredients from your pantry to find recipes using what you have! The search is smart and will find recipes even with partial matches.',
      },
      {
        q: 'How do I save favorites?',
        a: 'Click the heart icon (❤️) on any recipe card or recipe page. Your favorites are saved locally in your browser and will persist across sessions. You can organize favorites into collections for better organization.',
      },
      {
        q: 'How does the meal planner work?',
        a: "Go to the Meal Planner page to plan your week. You can add recipes to breakfast, lunch, dinner, or snacks for any day. Use 'Generate Smart Plan' to automatically fill empty slots based on your preferences, dietary restrictions, and available ingredients!",
      },
      {
        q: 'Can I use this on mobile?',
        a: "Yes! What's 4 Dinner is fully responsive and works great on phones, tablets, and desktops. All features are optimized for touch interactions and smaller screens.",
      },
    ],
  },
  {
    category: 'Features',
    icon: Zap,
    color: 'purple',
    questions: [
      {
        q: 'What is the Family Plan?',
        a: 'Family Plan lets you manage multiple family members, track allergies and dietary restrictions per person, verify meals, and calculate portion sizes based on age and weight. Perfect for families with children, nannies, or au pairs who need to track who ate what. Includes BMI tracking and age-specific nutritional recommendations.',
      },
      {
        q: 'How do I add ingredients to my pantry?',
        a: "Use the 'What's in your pantry?' section on the home page. Type ingredients separated by commas, or click the chips to remove them. The app will use these when searching for recipes to find dishes you can make right now!",
      },
      {
        q: 'Can I change serving sizes?',
        a: 'Yes! On any recipe page, use the Servings Calculator to adjust portions. The ingredients will automatically scale, and you can add the adjusted amounts to your grocery list. Supports both metric and imperial units.',
      },
      {
        q: 'How does the grocery list work?',
        a: "Click 'Add all to List' on any recipe page to add ingredients. The grocery list drawer opens from the bottom. Items are automatically categorized (produce, meat, dairy, etc.) and quantities are aggregated. You can check off items as you shop, edit quantities, and get bulk purchase suggestions.",
      },
      {
        q: 'What are Recipe Collections?',
        a: "Collections let you organize recipes into custom groups like 'Quick Weeknight Dinners', 'Holiday Recipes', or 'Meal Prep'. Create collections, add recipes, and easily browse them later. Perfect for meal planning and recipe organization!",
      },
      {
        q: 'How does meal swapping work?',
        a: "In the Meal Planner, click the swap icon on any meal card. The app will suggest alternative recipes based on meal type, ingredients, and your dietary preferences. Great for when you want variety or don't have certain ingredients!",
      },
    ],
  },
  {
    category: 'Account & Settings',
    icon: Settings,
    color: 'blue',
    questions: [
      {
        q: 'How do I sign in?',
        a: "Click the menu button (☰) and select 'Sign In'. You can sign in with email (magic link - no password needed!) or Google OAuth. Your data is securely stored and synced across devices.",
      },
      {
        q: 'How do I export my data?',
        a: "Go to your Profile page and click 'Export All Data'. This downloads a JSON file with all your favorites, meal plans, grocery lists, family members, budget data, and preferences. We recommend exporting regularly as a backup!",
      },
      {
        q: 'How do I change units (metric/US/UK)?',
        a: "Go to your Profile page and select your preferred measurement system under 'Preferences'. Changes apply immediately to all recipes, ingredients, and nutrition information.",
      },
      {
        q: 'Can I delete my account?',
        a: "Yes. Go to your Profile page and click 'Delete Account'. This will remove all your data and sign you out. This action cannot be undone, so make sure to export your data first if you want to keep it.",
      },
      {
        q: 'Is my data private and secure?',
        a: 'Yes! We use industry-standard encryption and secure authentication. Your data is stored locally in your browser by default, and only synced to our secure servers when you sign in. We never share your personal information.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: AlertCircle,
    color: 'orange',
    questions: [
      {
        q: "Recipes aren't loading",
        a: 'Check your internet connection. The app caches recipes for offline use, but new searches require an active connection. Try refreshing the page (Ctrl+R or Cmd+R). If issues persist, check the browser console (F12) for errors.',
      },
      {
        q: 'My favorites disappeared',
        a: "Favorites are stored in your browser's local storage. Clearing your browser data will delete them. Make sure to export your data regularly as a backup! If you're signed in, your favorites should sync across devices.",
      },
      {
        q: "Google sign-in isn't working",
        a: 'Make sure Google OAuth is properly configured. Try clearing your browser cache and cookies, then attempt sign-in again. If the issue persists, try using email magic link authentication instead.',
      },
      {
        q: 'The app looks broken',
        a: "Try refreshing the page (Ctrl+R or Cmd+R). If issues persist, clear your browser cache or try an incognito window. Check the browser console (F12) for errors. Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge).",
      },
      {
        q: "Images aren't loading",
        a: 'Recipe images are loaded from our CDN. Check your internet connection and try refreshing. Some images may take a moment to load. If images consistently fail, there may be a network or firewall issue.',
      },
      {
        q: "Grocery list isn't updating",
        a: "Make sure you're clicking 'Add all to List' on recipe pages. The grocery drawer should open from the bottom. If items aren't appearing, try refreshing the page. Check that you haven't accidentally filtered or cleared the list.",
      },
    ],
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;

    const query = searchQuery.toLowerCase();
    return FAQ_ITEMS.map(category => ({
      ...category,
      questions: category.questions.filter(
        item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      ),
    })).filter(category => category.questions.length > 0);
  }, [searchQuery]);

  const handleQuickAction = action => {
    switch (action) {
      case 'Try searching now':
        navigate('/');
        break;
      case 'Browse recipes':
        navigate('/');
        break;
      case 'Open Meal Planner':
        navigate('/meal-planner');
        break;
      case 'View Grocery List':
        navigate('/');
        // Could trigger grocery drawer here
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Hero Section - MOBILE FRIENDLY */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10 md:mb-12"
        >
          <BackToHome className="mb-4 sm:mb-6" />
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 sm:mb-6 shadow-lg"
            >
              <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent px-2">
              Help & Support
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
              Everything you need to know about What's 4 Dinner. Get started, learn features, and
              get help when you need it.
            </p>
          </div>

          {/* Search Bar - MOBILE FRIENDLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for help topics, questions, or features..."
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base md:text-lg shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Start Guide - MOBILE FRIENDLY */}
        {!searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 sm:mb-10 md:mb-12"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold">Quick Start Guide</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {QUICK_START_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-lg hover:shadow-xl group cursor-pointer touch-manipulation"
                    onClick={() => handleQuickAction(step.action)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                        {step.step}
                      </div>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 mt-1 group-hover:scale-110 transition-transform shrink-0" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <button className="text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm flex items-center gap-1 group-hover:gap-2 transition-all touch-manipulation min-h-[44px]">
                      {step.action}
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Features Showcase - MOBILE FRIENDLY */}
        {!searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 sm:mb-10 md:mb-12"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold">Key Features</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                const colorClasses = {
                  emerald: 'from-emerald-500 to-teal-500',
                  purple: 'from-purple-500 to-pink-500',
                  blue: 'from-blue-500 to-cyan-500',
                  pink: 'from-pink-500 to-rose-500',
                  orange: 'from-orange-500 to-amber-500',
                  red: 'from-red-500 to-rose-500',
                };
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border-2 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all group"
                  >
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${colorClasses[feature.color]} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform shrink-0`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* FAQ Section - MOBILE FRIENDLY */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 sm:mb-10 md:mb-12"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold">
              {searchQuery
                ? `Search Results (${filteredFAQs.reduce((acc, cat) => acc + cat.questions.length, 0)} found)`
                : 'Frequently Asked Questions'}
            </h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {filteredFAQs.map((category, categoryIndex) => {
                const CategoryIcon = category.icon;
                const isOpen = openCategory === category.category;
                return (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: categoryIndex * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-all"
                  >
                    <button
                      onClick={() => setOpenCategory(isOpen ? null : category.category)}
                      className="w-full px-4 sm:px-5 md:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group touch-manipulation min-h-[44px]"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${
                            category.color === 'emerald'
                              ? 'from-emerald-500 to-teal-500'
                              : category.color === 'purple'
                                ? 'from-purple-500 to-pink-500'
                                : category.color === 'blue'
                                  ? 'from-blue-500 to-cyan-500'
                                  : 'from-orange-500 to-amber-500'
                          } flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0`}
                        >
                          <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {category.category}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {category.questions.length}{' '}
                            {category.questions.length === 1 ? 'question' : 'questions'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 transition-transform shrink-0 ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4 pt-2 space-y-2 sm:space-y-3 border-t border-slate-200 dark:border-slate-700">
                            {category.questions.map((item, index) => {
                              const questionId = `${category.category}-${index}`;
                              const isQuestionOpen = openQuestion === questionId;
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-2 sm:pb-3 last:pb-0"
                                >
                                  <button
                                    onClick={() =>
                                      setOpenQuestion(isQuestionOpen ? null : questionId)
                                    }
                                    className="w-full text-left flex items-start justify-between gap-3 sm:gap-4 group touch-manipulation min-h-[44px]"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2 sm:gap-3">
                                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                          {item.q}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight
                                      className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 transition-transform ${
                                        isQuestionOpen ? 'rotate-90' : ''
                                      }`}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {isQuestionOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <p className="mt-2 sm:mt-3 ml-6 sm:ml-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                          {item.a}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Quick Links & Resources - MOBILE FRIENDLY */}
        {!searchQuery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8 sm:mb-10 md:mb-12"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold">Resources & Links</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  icon: Settings,
                  title: 'Profile & Settings',
                  desc: 'Manage your account',
                  link: '/profile?tab=account',
                  color: 'blue',
                },
                {
                  icon: Users,
                  title: 'Family Plan',
                  desc: 'Manage family members',
                  link: '/family-plan',
                  color: 'pink',
                },
                {
                  icon: Calendar,
                  title: 'Meal Planner',
                  desc: 'Plan your week',
                  link: '/meal-planner',
                  color: 'purple',
                },
                {
                  icon: ShoppingCart,
                  title: 'Grocery List',
                  desc: 'View shopping list',
                  link: '/',
                  color: 'emerald',
                },
                {
                  icon: Heart,
                  title: 'Favorites',
                  desc: 'Your saved recipes',
                  link: '/favorites',
                  color: 'red',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  desc: 'View your stats',
                  link: '/analytics',
                  color: 'orange',
                },
                {
                  icon: FileText,
                  title: 'Terms of Service',
                  desc: 'Legal information',
                  link: '/terms',
                  color: 'slate',
                },
                {
                  icon: Shield,
                  title: 'Privacy Policy',
                  desc: 'Data protection',
                  link: '/privacy',
                  color: 'indigo',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.title}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (item.link) {
                        navigate(item.link);
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-md hover:shadow-xl group text-left cursor-pointer touch-manipulation"
                    type="button"
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${
                        item.color === 'blue'
                          ? 'from-blue-500 to-cyan-500'
                          : item.color === 'pink'
                            ? 'from-pink-500 to-rose-500'
                            : item.color === 'purple'
                              ? 'from-purple-500 to-pink-500'
                              : item.color === 'emerald'
                                ? 'from-emerald-500 to-teal-500'
                                : item.color === 'red'
                                  ? 'from-red-500 to-rose-500'
                                  : item.color === 'orange'
                                    ? 'from-orange-500 to-amber-500'
                                    : 'from-slate-500 to-slate-600'
                      } flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform shrink-0`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium group-hover:gap-2 transition-all">
                      Visit <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Contact & Support - MOBILE FRIENDLY */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 text-white shadow-2xl"
        >
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.9 }}
              className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 sm:mb-6"
            >
              <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Still Need Help?
            </h2>
            <p className="text-base sm:text-lg text-emerald-50 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 leading-relaxed">
              Can't find what you're looking for? We're here to help! Check out our resources or get
              in touch with our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center relative z-10 px-2">
              <motion.button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/profile?tab=account');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 sm:px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[44px] relative z-10 w-full sm:w-auto"
                type="button"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Account Settings</span>
              </motion.button>
              <div className="relative group w-full sm:w-auto">
                <motion.button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/terms');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 sm:px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[44px] relative z-10 w-full sm:w-auto"
                  type="button"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Terms & Privacy</span>
                </motion.button>
                {/* Quick links dropdown - Hidden on mobile, shown on hover for desktop */}
                <div className="hidden sm:block absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/terms');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-t-lg transition-colors touch-manipulation min-h-[44px]"
                  >
                    Terms of Service
                  </button>
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate('/privacy');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-b-lg transition-colors touch-manipulation min-h-[44px]"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20 px-2">
              <p className="text-emerald-50 text-xs sm:text-sm">
                <strong>What's 4 Dinner</strong> - Your smart meal planning companion
              </p>
              <p className="text-emerald-100/80 text-[10px] sm:text-xs mt-2">
                Made with ❤️ for food lovers everywhere
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
