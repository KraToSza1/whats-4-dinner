import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabaseRecipeById } from '../api/supabaseRecipes.js';
import { recipeImg, fallbackOnce } from '../utils/img.ts';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { RecipePageSkeleton } from '../components/LoadingSkeleton.jsx';
import { FullPageRecipeLoader } from '../components/FoodLoaders.jsx';
import { cleanRecipeTitle, cleanRecipeInstructions } from '../utils/recipeFormatter.js';
import {
  convertIngredient,
  formatIngredientQuantity,
  formatNutrientAmount,
  UNIT_SYSTEMS,
} from '../utils/unitConverter.js';
import { Heart, Clock, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import BackToHome from '../components/BackToHome.jsx';

export default function SharedRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unitSystem, setUnitSystem] = useState(() => {
    try {
      return localStorage.getItem('unitSystem') || 'metric';
    } catch {
      return 'metric';
    }
  });

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!id) {
        setError('Recipe ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const full = await getSupabaseRecipeById(id);

        if (ignore) return;

        if (!full) {
          setError('Recipe not found');
          setLoading(false);
          return;
        }

        // Clean title and instructions
        if (full) {
          full.title = cleanRecipeTitle(full.title);
          if (full.instructions) {
            full.instructions = cleanRecipeInstructions(full.instructions).join(' ');
          }
        }

        setRecipe(full);

        // Track share view (for analytics)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sharedRecipeViewed', {
              detail: { recipeId: id, userId: user?.id || null },
            })
          );
        }
      } catch (e) {
        if (!ignore) {
          console.error('[SharedRecipePage]', e);
          setError(e.message || 'Failed to load recipe.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="page-shell py-6 sm:py-8">
          <RecipePageSkeleton />
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || 'This recipe may have been removed.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const title = recipe.title || 'Untitled Recipe';
  const image = recipeImg(recipe.image, recipe.title);
  const servings = recipe.servings || 4;
  const readyInMinutes = recipe.readyInMinutes || 0;
  const ingredients = recipe.extendedIngredients || recipe.ingredients || [];
  const instructions = recipe.instructions || '';
  const nutrients = recipe.nutrition?.nutrients || [];

  // Sign-up CTA Banner
  const SignUpBanner = () => {
    if (user) return null; // Don't show if user is logged in

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Love this recipe?
            </h3>
            <p className="text-emerald-50 mb-3">
              Sign up for free to save recipes, plan meals, create grocery lists, and discover
              thousands more!
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-white/20 px-2 py-1 rounded">✓ Save favorites</span>
              <span className="bg-white/20 px-2 py-1 rounded">✓ Meal planning</span>
              <span className="bg-white/20 px-2 py-1 rounded">✓ Smart grocery lists</span>
              <span className="bg-white/20 px-2 py-1 rounded">✓ 30-day free trial</span>
            </div>
          </div>
          <button
            onClick={() => {
              // Navigate to home and trigger sign-in modal
              navigate('/');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openAuthModal'));
              }, 300);
            }}
            className="px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Sign Up Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="page-shell py-6 sm:py-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="flex-shrink-0">
            <BackToHome className="mb-0" />
          </div>
          <div className="flex-1 min-w-0 sm:hidden">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">Shared Recipe</h1>
          </div>
        </div>

        {/* Sign-up Banner */}
        <SignUpBanner />

        {/* Recipe Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6"
        >
          <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              onError={fallbackOnce}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                {readyInMinutes > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{readyInMinutes} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{servings} servings</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recipe Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
          >
            <h2 className="text-xl font-bold mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {ingredients.map((ing, idx) => {
                const converted = convertIngredient(ing, unitSystem);
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span className="flex-1">
                      {formatIngredientQuantity(converted.amount)} {converted.unit} {converted.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
          >
            <h2 className="text-xl font-bold mb-4">Instructions</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {instructions.split('\n').map((step, idx) => (
                <p key={idx} className="mb-4">
                  {step.trim()}
                </p>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Nutrition Info */}
        {nutrients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"
          >
            <h2 className="text-xl font-bold mb-4">Nutrition (per serving)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {nutrients
                .filter(n => ['Calories', 'Protein', 'Fat', 'Carbohydrates'].includes(n.name))
                .map(nutrient => (
                  <div key={nutrient.name} className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNutrientAmount(nutrient.amount, nutrient.unit)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {nutrient.name}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-2">Want more recipes like this?</h3>
            <p className="text-purple-50 mb-4">
              Join thousands of users discovering amazing recipes every day!
            </p>
            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openAuthModal'));
                }, 300);
              }}
              className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
