import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Send,
  Loader,
  Copy,
  Check,
  Trash2,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useToast } from './Toast.jsx';
import { getMealPlannerContext } from '../utils/mealPlannerContext.js';
import { readMealPlan } from '../pages/MealPlanner.jsx';
import { getCalorieHistory, getTopRecipes, getRecipeDiversity } from '../utils/analytics.js';
import { searchSupabaseRecipes } from '../api/supabaseRecipes.js';

const STORAGE_KEY = 'dietician:ai:history:v1';

export default function DieticianAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const toast = useToast();
  const hasShownWarning = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get comprehensive user context
  const userContext = useMemo(() => {
    try {
      const context = getMealPlannerContext();
      const mealPlan = readMealPlan();
      const calorieHistory = getCalorieHistory(7); // Last 7 days
      const topRecipes = getTopRecipes(10);
      const recipeDiversity = getRecipeDiversity(30);
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

      // Get recent meal plan recipes (last week)
      const recentRecipes = [];
      const today = new Date();
      const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayIndex = date.getDay();
        const dayKey = DAYS_SHORT[dayIndex === 0 ? 6 : dayIndex - 1];
        const dayMeals = mealPlan[dayKey];

        if (dayMeals) {
          [
            'breakfast',
            'lunch',
            'dinner',
            'morning_snack',
            'afternoon_snack',
            'evening_snack',
          ].forEach(mealType => {
            if (dayMeals[mealType] && dayMeals[mealType].title) {
              recentRecipes.push({
                title: dayMeals[mealType].title,
                mealType,
                day: dayKey,
                daysAgo: i,
              });
            }
          });
        }
      }

      return {
        ...context,
        mealPlan,
        calorieHistory,
        topRecipes,
        recipeDiversity,
        favorites,
        recentRecipes,
        hasRecentMeals: recentRecipes.length > 0,
        avgDailyCalories:
          calorieHistory.length > 0
            ? Math.round(
                calorieHistory.reduce((sum, day) => sum + day.calories, 0) / calorieHistory.length
              )
            : null,
      };
    } catch (_error) {
      if (import.meta.env.DEV) {
        console.error('Error loading user context:', _error);
      }
      return getMealPlannerContext();
    }
  }, []);

  // Show experimental warning on mount (only once)
  useEffect(() => {
    if (!hasShownWarning.current) {
      hasShownWarning.current = true;
      toast.warning(
        '⚠️ AI Dietician is currently experimental. Responses may not always be accurate. Please consult a healthcare professional for medical advice.',
        { duration: 8000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const saveHistory = useCallback(() => {
    try {
      // Check if localStorage is available and secure
      if (typeof Storage === 'undefined' || !window.localStorage) {
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      // Handle localStorage errors gracefully (e.g., "operation is insecure")
      if (import.meta.env.DEV) {
        console.warn('[DieticianAI] Could not save history:', error);
      }
      // Ignore errors - history just won't persist
    }
  }, [messages]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveHistory();
  }, [saveHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount (mobile-friendly)
  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const loadHistory = () => {
    try {
      // Check if localStorage is available and secure
      if (typeof Storage === 'undefined' || !window.localStorage) {
        throw new Error('localStorage not available');
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (saved.length === 0) {
        // Initial greeting with personalized context
        const contextSummary = buildContextSummary(userContext);
        let greeting = "👋 Hello! I'm your AI Dietician assistant. ";

        if (contextSummary) {
          greeting += `I can see your profile includes: ${contextSummary.split(' | ').slice(0, 2).join(', ')}. `;
        }

        greeting += 'I can help you with:\n\n';
        greeting += '• Meal planning and nutrition advice\n';
        greeting += '• Dietary recommendations based on your goals\n';
        greeting += '• Recipe suggestions for specific dietary needs\n';
        greeting += '• Understanding nutritional information\n';
        greeting += '• Creating balanced meal plans\n';

        if (userContext.hasRecentMeals) {
          greeting +=
            "\n💡 I can see your recent meal history and can suggest recipes that complement what you've been eating!";
        }

        greeting += '\n\nWhat would you like help with today?';

        setMessages([
          {
            role: 'assistant',
            content: greeting,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages(saved);
      }
    } catch (error) {
      // Handle localStorage errors gracefully (e.g., "operation is insecure")
      if (import.meta.env.DEV) {
        console.warn('[DieticianAI] Could not load history:', error);
      }
      setMessages([
        {
          role: 'assistant',
          content: "👋 Hello! I'm your AI Dietician assistant. How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Generate AI response with user context
      const response = await generateAIResponse(currentInput);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (_error) {
      if (import.meta.env.DEV) {
        console.error('Error generating AI response:', _error);
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Build context summary for AI responses
  const buildContextSummary = context => {
    const summary = [];

    // Recent meals
    if (context.hasRecentMeals && context.recentRecipes.length > 0) {
      const recentMeals = context.recentRecipes
        .slice(0, 5)
        .map(r => r.title)
        .join(', ');
      summary.push(`Recently ate: ${recentMeals}`);
    }

    // Allergies and restrictions
    if (context.allFoodsToAvoid && context.allFoodsToAvoid.length > 0) {
      summary.push(`Allergies/avoid: ${context.allFoodsToAvoid.join(', ')}`);
    }

    // Dietary restrictions
    if (context.allDietaryRestrictions && context.allDietaryRestrictions.length > 0) {
      summary.push(`Dietary preferences: ${context.allDietaryRestrictions.join(', ')}`);
    }

    // Calorie goals
    if (context.hasCalorieGoal) {
      summary.push(`Calorie goal: ${context.calorieGoal} calories/day`);
    }

    // Average daily calories
    if (context.avgDailyCalories) {
      summary.push(`Average daily intake: ${context.avgDailyCalories} calories`);
    }

    // Family members
    if (context.hasFamily && context.familyMembers && context.familyMembers.length > 0) {
      summary.push(
        `Family members: ${context.familyMembers.length} (${context.familyMembers.map(m => m.role).join(', ')})`
      );
    }

    // Medical conditions
    if (
      context.hasMedicalConditions &&
      context.medicalConditions &&
      context.medicalConditions.length > 0
    ) {
      summary.push(`Medical conditions: ${context.medicalConditions.join(', ')}`);
    }

    // Favorites
    if (context.favorites && context.favorites.length > 0) {
      summary.push(`Favorite recipes: ${context.favorites.length} saved`);
    }

    return summary.join(' | ');
  };

  const generateAIResponse = async userInput => {
    const lowerInput = userInput.toLowerCase();
    const contextSummary = buildContextSummary(userContext);

    // Recipe search helper
    const searchRecipes = async (query, filters = {}) => {
      try {
        const results = await searchSupabaseRecipes(query, {
          limit: 5,
          ...filters,
        });
        return results.recipes || [];
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error searching recipes:', error);
        }
        return [];
      }
    };

    // Meal planning with context
    if (
      lowerInput.includes('meal plan') ||
      lowerInput.includes('plan meals') ||
      lowerInput.includes('suggest meals')
    ) {
      let response = `Based on your profile${contextSummary ? ` (${contextSummary})` : ''}, here's a personalized meal plan suggestion:\n\n`;

      // Get personalized recipe suggestions
      const breakfastQuery =
        userContext.allDietaryRestrictions?.includes('vegetarian') ||
        userContext.allDietaryRestrictions?.includes('vegan')
          ? 'vegetarian breakfast'
          : 'healthy breakfast';
      const lunchQuery =
        userContext.allDietaryRestrictions?.includes('low-carb') ||
        userContext.allDietaryRestrictions?.includes('keto')
          ? 'low carb lunch'
          : 'healthy lunch';
      const dinnerQuery =
        userContext.allDietaryRestrictions?.includes('vegetarian') ||
        userContext.allDietaryRestrictions?.includes('vegan')
          ? 'vegetarian dinner'
          : 'healthy dinner';

      const [breakfastRecipes, lunchRecipes, dinnerRecipes] = await Promise.all([
        searchRecipes(breakfastQuery, { diet: userContext.diet }),
        searchRecipes(lunchQuery, { diet: userContext.diet }),
        searchRecipes(dinnerQuery, { diet: userContext.diet }),
      ]);

      response += '**Breakfast:**\n';
      if (breakfastRecipes.length > 0) {
        response += `• ${breakfastRecipes[0].title} (${breakfastRecipes[0].readyInMinutes || 'N/A'} min)\n`;
        if (breakfastRecipes[0].nutrition) {
          response += `  Calories: ~${Math.round(breakfastRecipes[0].nutrition.calories || 0)} | Protein: ${Math.round(breakfastRecipes[0].nutrition.protein || 0)}g\n`;
        }
      } else {
        response += '• Oatmeal with berries and nuts (300-400 calories)\n';
      }

      response += '\n**Lunch:**\n';
      if (lunchRecipes.length > 0) {
        response += `• ${lunchRecipes[0].title} (${lunchRecipes[0].readyInMinutes || 'N/A'} min)\n`;
        if (lunchRecipes[0].nutrition) {
          response += `  Calories: ~${Math.round(lunchRecipes[0].nutrition.calories || 0)} | Protein: ${Math.round(lunchRecipes[0].nutrition.protein || 0)}g\n`;
        }
      } else {
        response += '• Grilled chicken salad with mixed greens (400-500 calories)\n';
      }

      response += '\n**Dinner:**\n';
      if (dinnerRecipes.length > 0) {
        response += `• ${dinnerRecipes[0].title} (${dinnerRecipes[0].readyInMinutes || 'N/A'} min)\n`;
        if (dinnerRecipes[0].nutrition) {
          response += `  Calories: ~${Math.round(dinnerRecipes[0].nutrition.calories || 0)} | Protein: ${Math.round(dinnerRecipes[0].nutrition.protein || 0)}g\n`;
        }
      } else {
        response += '• Baked salmon with quinoa and steamed vegetables (500-600 calories)\n';
      }

      if (userContext.avgDailyCalories) {
        response += `\n**Your Average Daily Intake:** ${userContext.avgDailyCalories} calories\n`;
        if (userContext.hasCalorieGoal) {
          const diff = userContext.calorieGoal - userContext.avgDailyCalories;
          if (diff > 0) {
            response += `You're currently ${diff} calories below your goal. Consider adding healthy snacks!\n`;
          } else if (diff < 0) {
            response += `You're currently ${Math.abs(diff)} calories above your goal. Consider lighter meal options.\n`;
          }
        }
      }

      if (userContext.allFoodsToAvoid && userContext.allFoodsToAvoid.length > 0) {
        response += `\n**Note:** All suggestions avoid: ${userContext.allFoodsToAvoid.join(', ')}\n`;
      }

      response +=
        '\nWould you like me to suggest specific recipes from your app that match these meals?';

      return response;
    }

    // Weight loss with context
    if (lowerInput.includes('lose weight') || lowerInput.includes('weight loss')) {
      let response = `For healthy weight loss${contextSummary ? ` based on your profile` : ''}, I recommend:\n\n`;

      if (userContext.avgDailyCalories && userContext.hasCalorieGoal) {
        const currentIntake = userContext.avgDailyCalories;
        const goal = userContext.calorieGoal;
        const deficit = currentIntake - goal;

        if (deficit > 0) {
          response += `**Current Status:** You're averaging ${currentIntake} calories/day, which is ${deficit} calories above your goal of ${goal}.\n\n`;
        } else {
          response += `**Current Status:** You're averaging ${currentIntake} calories/day, which is ${Math.abs(deficit)} calories below your goal. Great progress!\n\n`;
        }
      }

      response += `**Key Principles:**\n`;
      response += `1. **Caloric Deficit**: Aim for 500-750 calories below your maintenance level\n`;
      response += `2. **High Protein**: 0.8-1g per pound of body weight to preserve muscle\n`;
      response += `3. **Fiber-Rich Foods**: Vegetables, fruits, whole grains for satiety\n`;
      response += `4. **Regular Meals**: Don't skip meals - it can slow metabolism\n\n`;

      response += `**Foods to Focus On:**\n`;
      response += `• Lean proteins (chicken, fish, tofu, legumes)\n`;
      response += `• Non-starchy vegetables (broccoli, spinach, peppers)\n`;
      response += `• Whole grains in moderation (quinoa, brown rice, oats)\n`;
      response += `• Healthy fats (avocado, nuts, olive oil)\n\n`;

      if (userContext.recentRecipes && userContext.recentRecipes.length > 0) {
        response += `**Recent Meals Analysis:**\n`;
        const recentCount = userContext.recentRecipes.length;
        response += `You've logged ${recentCount} meal${recentCount !== 1 ? 's' : ''} recently. `;
        response += `To support weight loss, focus on meals with higher protein and fiber content.\n\n`;
      }

      response += `**Meal Timing:**\n`;
      response += `• Eat within 1 hour of waking\n`;
      response += `• Space meals 3-4 hours apart\n`;
      response += `• Finish eating 2-3 hours before bed\n\n`;

      response += `Would you like me to search for specific low-calorie, high-protein recipes that fit your dietary preferences?`;

      return response;
    }

    // Recipe suggestions
    if (
      lowerInput.includes('recipe') ||
      lowerInput.includes('suggest recipe') ||
      lowerInput.includes('recommend recipe')
    ) {
      // Extract what type of recipe they want
      let query = userInput;
      if (lowerInput.includes('breakfast')) query = 'healthy breakfast';
      else if (lowerInput.includes('lunch')) query = 'healthy lunch';
      else if (lowerInput.includes('dinner')) query = 'healthy dinner';
      else if (lowerInput.includes('snack')) query = 'healthy snack';
      else query = 'healthy recipe';

      const recipes = await searchRecipes(query, {
        diet: userContext.diet,
        intolerances: userContext.intolerances,
      });

      if (recipes.length > 0) {
        let response = `Here are some recipe suggestions${contextSummary ? ` based on your preferences` : ''}:\n\n`;

        recipes.slice(0, 3).forEach((recipe, idx) => {
          response += `**${idx + 1}. ${recipe.title}**\n`;
          if (recipe.readyInMinutes) {
            response += `⏱️ Ready in ${recipe.readyInMinutes} minutes\n`;
          }
          if (recipe.nutrition) {
            response += `📊 Calories: ~${Math.round(recipe.nutrition.calories || 0)} | Protein: ${Math.round(recipe.nutrition.protein || 0)}g\n`;
          }
          if (recipe.summary) {
            const summary = recipe.summary.replace(/<[^>]*>/g, '').substring(0, 100);
            response += `${summary}...\n`;
          }
          response += '\n';
        });

        response += `These recipes are available in your app! Would you like me to suggest more or help you plan meals with these?`;
        return response;
      } else {
        return `I couldn't find specific recipes matching your query right now. Try asking for "healthy breakfast recipes" or "vegetarian dinner ideas" and I'll search our recipe database for you!`;
      }
    }

    // Protein with context
    if (lowerInput.includes('protein') || lowerInput.includes('how much protein')) {
      let response = `Protein recommendations depend on your goals${contextSummary ? ` and your current profile` : ''}:\n\n`;

      response += `**General Health:** 0.8g per kg (0.36g per pound) of body weight\n`;
      response += `**Active Individuals:** 1.2-1.7g per kg (0.54-0.77g per pound)\n`;
      response += `**Muscle Building:** 1.6-2.2g per kg (0.73-1g per pound)\n`;
      response += `**Weight Loss:** 1.2-1.6g per kg (0.54-0.73g per pound)\n\n`;

      response += `**High Protein Foods:**\n`;
      response += `• Chicken breast: ~31g per 100g\n`;
      response += `• Salmon: ~25g per 100g\n`;
      response += `• Greek yogurt: ~10g per 100g\n`;
      response += `• Lentils: ~9g per 100g\n`;
      response += `• Eggs: ~6g per egg\n\n`;

      response += `**Tips:**\n`;
      response += `• Distribute protein across all meals\n`;
      response += `• Include protein in snacks\n`;
      response += `• Combine plant proteins for complete amino acids\n\n`;

      if (userContext.avgDailyCalories) {
        response += `Based on your average daily intake of ${userContext.avgDailyCalories} calories, `;
        response += `aim for ${Math.round((userContext.avgDailyCalories * 0.15) / 4)}-${Math.round((userContext.avgDailyCalories * 0.35) / 4)}g of protein per day.\n\n`;
      }

      response += `What's your current weight and activity level? I can calculate your specific needs!`;

      return response;
    }

    // Vegetarian/Vegan
    if (lowerInput.includes('vegetarian') || lowerInput.includes('vegan')) {
      return `Great choice! Here's how to ensure proper nutrition on a plant-based diet:

**Protein Sources:**
• Legumes (lentils, chickpeas, black beans)
• Tofu, tempeh, edamame
• Quinoa, amaranth (complete proteins)
• Nuts and seeds
• Whole grains

**Key Nutrients to Watch:**
• **B12**: Fortified foods or supplement (essential for vegans)
• **Iron**: Dark leafy greens, legumes, fortified cereals (pair with vitamin C)
• **Calcium**: Fortified plant milks, tofu, dark leafy greens
• **Omega-3**: Flaxseeds, chia seeds, walnuts, algae supplements

**Meal Ideas:**
• Buddha bowls with grains, legumes, and vegetables
• Stir-fries with tofu and vegetables
• Lentil soups and stews
• Chickpea curries

Would you like specific recipe recommendations?`;
    }

    // General nutrition
    if (lowerInput.includes('nutrition') || lowerInput.includes('healthy eating')) {
      return `Here are the fundamentals of healthy eating:

**Macronutrients:**
• **Carbohydrates**: 45-65% of calories (focus on whole grains, fruits, vegetables)
• **Protein**: 10-35% of calories (lean sources)
• **Fats**: 20-35% of calories (healthy fats like olive oil, nuts, avocados)

**Micronutrients:**
• Eat a variety of colorful fruits and vegetables
• Include sources of vitamins and minerals daily

**Portion Control:**
• Use the plate method: 1/2 vegetables, 1/4 protein, 1/4 grains
• Listen to hunger and fullness cues

**Hydration:**
• Aim for 2-3 liters of water daily
• More if you're active

**Meal Frequency:**
• 3 main meals + 1-2 snacks
• Don't skip breakfast

What specific aspect of nutrition would you like to learn more about?`;
    }

    // Default response
    return `I understand you're asking about "${userInput}". 

As your AI Dietician, I can help with:
• Creating personalized meal plans
• Nutritional advice for specific goals
• Understanding macronutrients and micronutrients
• Recipe recommendations
• Dietary restrictions and alternatives

Could you provide more details about what you'd like help with? For example:
- Your dietary goals (weight loss, muscle gain, maintenance)
- Any dietary restrictions or preferences
- Your current activity level
- Specific questions about nutrition

This will help me give you more personalized advice!`;
  };

  const clearHistory = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([
        {
          role: 'assistant',
          content:
            "👋 Hello! I'm your AI Dietician assistant. I can help you with:\n\n• Meal planning and nutrition advice\n• Dietary recommendations based on your goals\n• Recipe suggestions for specific dietary needs\n• Understanding nutritional information\n• Creating balanced meal plans\n\nWhat would you like help with today?",
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success('History cleared!');
    }
  };

  const copyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Message copied!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (_error) {
      toast.error('Failed to copy message');
    }
  };

  const formatMessage = content => {
    // Escape HTML first to prevent XSS
    const escapeHtml = text => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // Format markdown-like text for better display
    const lines = content.split('\n');
    const formatted = lines
      .map((line, idx) => {
        // Skip empty lines (but keep structure)
        if (!line.trim()) {
          return idx === 0 || idx === lines.length - 1 ? '' : '<br />';
        }

        // Escape HTML
        let safeLine = escapeHtml(line);

        // Bold text (**text**)
        safeLine = safeLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          const text = safeLine.replace(/^[•-]\s*/, '');
          return `<div class="flex items-start gap-2 my-1"><span class="text-purple-500 dark:text-purple-400 mt-0.5 shrink-0">•</span><span>${text}</span></div>`;
        }

        // Headers (lines ending with : and short)
        if (line.trim().endsWith(':') && line.length < 50 && !line.includes('•')) {
          return `<div class="font-bold text-base mt-3 mb-2 first:mt-0">${safeLine}</div>`;
        }

        return `<div class="my-1">${safeLine}</div>`;
      })
      .filter(line => line !== '' || line === '<br />')
      .join('');

    return formatted || escapeHtml(content);
  };

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 pt-2 xs:pt-0"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-1 xs:mb-2">
            <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl xs:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
              <Brain className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI Dietician
            </span>
          </h2>
          <p className="text-xs xs:text-sm text-slate-600 dark:text-slate-400 ml-10 xs:ml-12 sm:ml-14">
            Get personalized nutrition advice and meal planning help
          </p>
        </div>
        {messages.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearHistory}
            className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 text-xs xs:text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation min-h-[44px] shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <span className="hidden xs:inline">Clear History</span>
            <span className="xs:hidden">Clear</span>
          </motion.button>
        )}
      </motion.div>

      {/* Chat Container - Mobile Optimized */}
      <div className="bg-white dark:bg-slate-900 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-280px)] xs:h-[calc(100vh-320px)] sm:h-[600px] md:h-[650px]">
        {/* Messages - Enhanced */}
        <div className="flex-1 overflow-y-auto p-3 xs:p-4 sm:p-6 space-y-3 xs:space-y-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 xs:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <Brain className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[85%] xs:max-w-[80%] sm:max-w-[75%]">
                  <div
                    className={`rounded-2xl p-3 xs:p-4 shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm'
                        : 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap text-xs xs:text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                  {message.role === 'assistant' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyMessage(message.content, idx)}
                      className="self-start p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors opacity-60 hover:opacity-100"
                      title="Copy message"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 xs:w-4 xs:h-4 text-slate-500" />
                      )}
                    </motion.button>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                    <MessageSquare className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start gap-3"
            >
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                <Brain className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl rounded-bl-sm p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 xs:w-5 xs:h-5 animate-spin text-purple-500" />
                  <span className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Mobile Optimized */}
        <div className="border-t-2 border-slate-200 dark:border-slate-700 p-3 xs:p-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex gap-2 xs:gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me about nutrition, meal planning..."
              className="flex-1 px-3 xs:px-4 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl border-2 border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 focus:outline-none bg-white dark:bg-slate-900 text-sm xs:text-base touch-manipulation min-h-[44px]"
              disabled={loading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 xs:px-5 py-2.5 xs:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl xs:rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 xs:gap-2 shadow-lg touch-manipulation min-h-[44px] shrink-0 transition-all"
            >
              <Send className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
              <span className="hidden xs:inline">Send</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Suggestions - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-xl xs:rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-800 p-4 xs:p-5 sm:p-6"
      >
        <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4 flex items-center gap-2">
          <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
          </div>
          <span>Quick Questions</span>
        </h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
          {[
            { text: 'Create a meal plan for weight loss', icon: '🎯' },
            { text: 'How much protein do I need?', icon: '💪' },
            { text: 'Vegetarian nutrition tips', icon: '🥗' },
            { text: 'Healthy snack ideas', icon: '🍎' },
            { text: 'Meal planning for the week', icon: '📅' },
            { text: 'Nutrition basics explained', icon: '📚' },
          ].map((suggestion, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInput(suggestion.text);
                setTimeout(() => sendMessage(), 100);
              }}
              className="p-3 xs:p-4 text-left rounded-xl xs:rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 text-xs xs:text-sm transition-all touch-manipulation min-h-[44px] flex items-center gap-2 group"
            >
              <span className="text-lg xs:text-xl shrink-0">{suggestion.icon}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                {suggestion.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
