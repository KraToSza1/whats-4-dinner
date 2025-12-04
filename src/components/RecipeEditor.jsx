import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import {
  getRecipeForEditing,
  updateRecipeTitle,
  updateRecipeDescription,
  updateRecipeImage,
  updateRecipeSteps,
  updateRecipeIngredients,
  updateRecipeMetadata,
  updateRecipeNutrition,
  createRecipe,
  searchRecipesForEditing,
  getAllRecipesForEditing,
  uploadRecipeImage,
} from '../api/recipeEditor';
import { useToast } from './Toast';
import { getUnitSystem, convertMeasurement, UNIT_SYSTEMS } from '../utils/unitConverter';
import { supabase } from '../lib/supabaseClient';
import { PLACEHOLDER } from '../utils/img';
import BulkRecipeEditor from './BulkRecipeEditor';

export default function RecipeEditor({
  recipeId: initialRecipeId = null,
  onClose = null,
  focusOnImage = false,
}) {
  const toast = useToast();
  const [viewMode, setViewMode] = useState(initialRecipeId ? 'edit' : 'browse'); // "browse", "edit", or "bulk"
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [originalIngredients, setOriginalIngredients] = useState([]); // Store original units for conversion
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlTimestamp, setImageUrlTimestamp] = useState(null); // Track when image was last updated
  const [newImageFile, setNewImageFile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Additional recipe metadata
  const [prepMinutes, setPrepMinutes] = useState('');
  const [cookMinutes, setCookMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [cuisine, setCuisine] = useState([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [mealTypes, setMealTypes] = useState([]);
  const [diets, setDiets] = useState([]);
  const [author, setAuthor] = useState('');

  // Nutrition state
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    fiber: '',
    sugar: '',
    sodium: '',
    cholesterol: '',
    saturated_fat: '',
    trans_fat: '',
    vitamin_a: '',
    vitamin_c: '',
    vitamin_d: '',
    potassium: '',
    calcium: '',
    iron: '',
  });
  const [unitSystem, setUnitSystem] = useState(() => {
    try {
      return localStorage.getItem('unitSystem') || 'metric';
    } catch {
      return 'metric';
    }
  });

  // JSON Import state
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');
  const [importMode, setImportMode] = useState('single'); // 'single' or 'batch'

  // Export complete recipe for ChatGPT (with all correct data as reference)
  const handleExportCompleteRecipe = () => {
    if (!selectedRecipe?.id && !title.trim()) {
      toast.error('Please select a recipe or create one first');
      return;
    }

    try {
      // Get servings for nutrition conversion (totals → per-serving)
      const servingsValue = servings ? parseFloat(servings) : 4;

      // Convert nutrition from totals back to per-serving (ChatGPT needs per-serving)
      const nutritionPerServing = {};
      if (nutrition && servingsValue > 0) {
        Object.keys(nutrition).forEach(key => {
          const value = nutrition[key]?.trim();
          if (value) {
            const totalValue = parseFloat(value);
            if (!isNaN(totalValue) && totalValue > 0) {
              // Convert total back to per-serving
              nutritionPerServing[key] = totalValue / servingsValue;
            }
          }
        });
      }

      // Format ingredients
      const formattedIngredients = ingredients.map(ing => ({
        ingredient_name: ing.ingredient_name || '',
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        unit: ing.unit || '',
        preparation: ing.preparation || '',
      }));

      // Format steps
      const formattedSteps = steps
        .filter(s => s.instruction && s.instruction.trim())
        .map((step, index) => ({
          position: index + 1,
          instruction: step.instruction || '',
          timer_seconds: step.timer_seconds || null,
        }));

      // Build complete recipe JSON
      const completeRecipe = {
        recipe_id: selectedRecipe?.id || null,
        title: title || 'Untitled Recipe',
        description: description || '',
        prep_minutes: prepMinutes ? parseInt(prepMinutes) : null,
        cook_minutes: cookMinutes ? parseInt(cookMinutes) : null,
        servings: servingsValue,
        difficulty: difficulty || 'easy',
        author: author || 'Community',
        cuisine: cuisine || [],
        meal_types: mealTypes || [],
        diets: diets || [],
        ingredients: formattedIngredients,
        steps: formattedSteps,
        nutrition: nutritionPerServing,
        image_prompt: `A delicious ${title}, professionally photographed, appetizing presentation, food photography style, 1024x1024`,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(completeRecipe, null, 2);

      // Copy to clipboard
      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          toast.success(
            '✅ Complete recipe copied! Paste this to ChatGPT as a REFERENCE for correct format and values.'
          );
        })
        .catch(() => {
          // Fallback: show in alert
          alert('Copy this complete recipe JSON:\n\n' + jsonString);
        });
    } catch (error) {
      console.error('❌ [RECIPE EDITOR] Export error:', error);
      toast.error(`Failed to export recipe: ${error.message}`);
    }
  };

  // Handle JSON import from ChatGPT
  const handleJsonImport = async () => {
    try {
      console.log('📥 [JSON IMPORT] Starting import...');
      const data = JSON.parse(jsonImportText);
      console.log('📥 [JSON IMPORT] Parsed JSON:', {
        recipe_id: data.recipe_id,
        title: data.title,
        hasIngredients: Array.isArray(data.ingredients),
        ingredientsCount: data.ingredients?.length || 0,
        hasSteps: Array.isArray(data.steps),
        stepsCount: data.steps?.length || 0,
        hasNutrition: !!data.nutrition,
        servings: data.servings,
      });

      // If recipe_id exists, load the existing recipe FIRST
      if (data.recipe_id) {
        console.log('📥 [JSON IMPORT] Recipe ID found, loading existing recipe first...', {
          recipe_id: data.recipe_id,
        });

        setLoading(true);
        const loadResult = await getRecipeForEditing(data.recipe_id);
        setLoading(false);

        if (loadResult.success && loadResult.data.recipe) {
          console.log('✅ [JSON IMPORT] Existing recipe loaded:', {
            title: loadResult.data.recipe.title,
            currentServings: loadResult.data.recipe.servings,
            currentIngredientsCount: loadResult.data.ingredients?.length || 0,
            currentStepsCount: loadResult.data.steps?.length || 0,
          });

          // Set selected recipe
          setSelectedRecipe({
            id: data.recipe_id,
            title: loadResult.data.recipe.title || data.title,
          });
          setRecipeData(loadResult.data);
          setViewMode('edit');

          // Load existing recipe fields FIRST
          const existingRecipe = loadResult.data.recipe;
          console.log('📥 [JSON IMPORT] Loading existing recipe fields...');

          setTitle(existingRecipe.title || '');
          setDescription(existingRecipe.description || '');
          setImageUrl(existingRecipe.hero_image_url || '');
          setImageUrlTimestamp(null); // Reset timestamp when loading existing recipe
          setPrepMinutes(existingRecipe.prep_minutes?.toString() || '');
          setCookMinutes(existingRecipe.cook_minutes?.toString() || '');
          setServings(existingRecipe.servings?.toString() || '');
          setDifficulty(existingRecipe.difficulty || 'easy');
          setCuisine(Array.isArray(existingRecipe.cuisine) ? existingRecipe.cuisine : []);
          setCuisineInput(
            Array.isArray(existingRecipe.cuisine) ? existingRecipe.cuisine.join(', ') : ''
          );
          setMealTypes(Array.isArray(existingRecipe.meal_types) ? existingRecipe.meal_types : []);
          setDiets(Array.isArray(existingRecipe.diets) ? existingRecipe.diets : []);
          setAuthor(existingRecipe.author || '');

          // Convert stored total nutrition to per-serving for display
          const loadedNutrition = {};
          if (loadResult.data.nutrition && existingRecipe.servings) {
            const s = parseFloat(existingRecipe.servings);
            console.log(
              '📥 [JSON IMPORT] Converting existing nutrition from TOTAL to PER-SERVING:',
              {
                servings: s,
              }
            );
            Object.keys(loadResult.data.nutrition).forEach(key => {
              if (key !== 'recipe_id' && loadResult.data.nutrition[key] !== null) {
                const total = loadResult.data.nutrition[key];
                const perServing = total / s;
                loadedNutrition[key] =
                  perServing % 1 === 0 ? perServing.toString() : perServing.toFixed(1);
                console.log(`  ${key}: ${total} (total) → ${loadedNutrition[key]} (per-serving)`);
              }
            });
          }
          setNutrition(prev => ({ ...prev, ...loadedNutrition }));

          // Convert ingredients and steps from DB format to editor format
          const loadedIngredients = (loadResult.data.ingredients || []).map(ing => ({
            ingredient_name: ing.ingredient.name || '',
            quantity: ing.quantity?.toString() || '',
            unit: ing.unit || '',
            preparation: ing.preparation || '',
          }));
          setIngredients(loadedIngredients);
          setOriginalIngredients(loadedIngredients);

          const loadedSteps = (loadResult.data.steps || []).map(step => ({
            instruction: step.instruction || '',
            timer_seconds: step.timer_seconds || null,
          }));
          setSteps(loadedSteps);

          console.log(
            '✅ [JSON IMPORT] Existing recipe fields loaded, now overlaying ChatGPT data...'
          );
          toast.info(
            `Loaded existing recipe "${existingRecipe.title || data.recipe_id}" for update.`
          );
        } else {
          console.warn('⚠️ [JSON IMPORT] Recipe not found, creating new recipe:', {
            recipe_id: data.recipe_id,
          });
          toast.warning(`Recipe with ID ${data.recipe_id} not found. Creating new recipe.`);
          handleCreateNewRecipe(); // Initialize new recipe fields
        }
      } else {
        console.log('📥 [JSON IMPORT] No recipe_id, creating new recipe...');
        handleCreateNewRecipe(); // Initialize new recipe fields
      }

      // NOW overlay ChatGPT's imported data on top
      console.log('📥 [JSON IMPORT] Overlaying ChatGPT data...');

      // Basic info
      if (data.title) {
        console.log(`  Title: "${title}" → "${data.title}"`);
        setTitle(data.title);
      }
      if (data.description) {
        console.log(
          `  Description: "${description?.substring(0, 30)}..." → "${data.description.substring(0, 30)}..."`
        );
        setDescription(data.description);
      }
      if (data.prep_minutes !== undefined) {
        console.log(`  Prep: ${prepMinutes} → ${data.prep_minutes}`);
        setPrepMinutes(data.prep_minutes?.toString() || '');
      }
      if (data.cook_minutes !== undefined) {
        console.log(`  Cook: ${cookMinutes} → ${data.cook_minutes}`);
        setCookMinutes(data.cook_minutes?.toString() || '');
      }
      if (data.servings !== undefined) {
        console.log(`  Servings: ${servings} → ${data.servings}`);
        setServings(data.servings?.toString() || '');
      }
      if (data.difficulty) {
        console.log(`  Difficulty: ${difficulty} → ${data.difficulty}`);
        setDifficulty(data.difficulty);
      }
      if (data.author) {
        setAuthor(data.author);
      }

      // Tags
      if (Array.isArray(data.cuisine)) {
        console.log(`  Cuisine: [${cuisine.join(', ')}] → [${data.cuisine.join(', ')}]`);
        setCuisine(data.cuisine);
        setCuisineInput(data.cuisine.join(', '));
      }
      if (Array.isArray(data.meal_types)) {
        console.log(`  Meal Types: [${mealTypes.join(', ')}] → [${data.meal_types.join(', ')}]`);
        setMealTypes(data.meal_types);
      }
      if (Array.isArray(data.diets)) {
        console.log(`  Diets: [${diets.join(', ')}] → [${data.diets.join(', ')}]`);
        setDiets(data.diets);
      }

      // Ingredients - convert from ChatGPT format to editor format
      if (Array.isArray(data.ingredients)) {
        console.log(`  Ingredients: ${ingredients.length} → ${data.ingredients.length}`);
        const formattedIngredients = data.ingredients.map(ing => ({
          ingredient_name: ing.ingredient_name || '',
          quantity: ing.quantity?.toString() || '',
          unit: ing.unit || '',
          preparation: ing.preparation || '',
        }));
        setIngredients(formattedIngredients);
        setOriginalIngredients(formattedIngredients);
      }

      // Steps - convert from ChatGPT format to editor format
      if (Array.isArray(data.steps)) {
        console.log(`  Steps: ${steps.length} → ${data.steps.length}`);
        const formattedSteps = data.steps
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map(step => ({
            instruction: step.instruction || '',
            timer_seconds: step.timer_seconds || null,
          }));
        setSteps(formattedSteps);
      }

      // Nutrition - ChatGPT provides per-serving, we store per-serving in editor (system scales on save)
      // Handle both formats: "protein" OR "protein_g", "carbs" OR "carbohydrates_g", etc.
      if (data.nutrition) {
        console.log('  Nutrition: Overlaying ChatGPT nutrition data...');

        // Helper function to get value from nutrition object, trying multiple field name variations
        const getNutritionValue = (nut, fieldName, altNames = []) => {
          // Try primary field name first
          if (nut[fieldName] !== undefined && nut[fieldName] !== null) {
            return nut[fieldName];
          }
          // Try alternative field names
          for (const altName of altNames) {
            if (nut[altName] !== undefined && nut[altName] !== null) {
              return nut[altName];
            }
          }
          return null;
        };

        const nutritionData = {
          calories: getNutritionValue(data.nutrition, 'calories')?.toString() || '',
          protein: getNutritionValue(data.nutrition, 'protein', ['protein_g'])?.toString() || '',
          fat: getNutritionValue(data.nutrition, 'fat', ['fat_g'])?.toString() || '',
          carbs:
            getNutritionValue(data.nutrition, 'carbs', [
              'carbohydrates_g',
              'carbs_g',
            ])?.toString() || '',
          fiber: getNutritionValue(data.nutrition, 'fiber', ['fiber_g'])?.toString() || '',
          sugar: getNutritionValue(data.nutrition, 'sugar', ['sugar_g'])?.toString() || '',
          sodium: getNutritionValue(data.nutrition, 'sodium', ['sodium_mg'])?.toString() || '',
          cholesterol:
            getNutritionValue(data.nutrition, 'cholesterol', ['cholesterol_mg'])?.toString() || '',
          saturated_fat:
            getNutritionValue(data.nutrition, 'saturated_fat', ['saturated_fat_g'])?.toString() ||
            '',
          trans_fat:
            getNutritionValue(data.nutrition, 'trans_fat', ['trans_fat_g'])?.toString() || '',
          vitamin_a:
            getNutritionValue(data.nutrition, 'vitamin_a', ['vitamin_a_iu'])?.toString() || '',
          vitamin_c:
            getNutritionValue(data.nutrition, 'vitamin_c', ['vitamin_c_mg'])?.toString() || '',
          vitamin_d:
            getNutritionValue(data.nutrition, 'vitamin_d', ['vitamin_d_iu'])?.toString() || '',
          potassium:
            getNutritionValue(data.nutrition, 'potassium', ['potassium_mg'])?.toString() || '',
          calcium: getNutritionValue(data.nutrition, 'calcium', ['calcium_mg'])?.toString() || '',
          iron: getNutritionValue(data.nutrition, 'iron', ['iron_mg'])?.toString() || '',
        };
        console.log('  Nutrition values:', {
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          fat: nutritionData.fat,
          carbs: nutritionData.carbs,
        });
        setNutrition(nutritionData);
      }

      // Image URL (if provided)
      if (data.hero_image_url) {
        console.log(
          `  Image URL: ${imageUrl ? 'existing' : 'none'} → ${data.hero_image_url ? 'provided' : 'none'}`
        );
        setImageUrl(data.hero_image_url);
        setImageUrlTimestamp(null); // Reset timestamp when importing JSON
      }

      // If no recipe_id, switch to edit mode for new recipe
      if (!data.recipe_id) {
        setViewMode('edit');
      }

      setHasChanges(true);
      console.log('✅ [JSON IMPORT] Import complete!');

      // If batch mode, keep modal open for next import
      if (importMode === 'batch') {
        setJsonImportText('');
        toast.success('✅ Recipe imported! Paste next JSON or click "Close" when done.');
      } else {
        setShowJsonImport(false);
        setJsonImportText('');
        toast.success(
          '✅ Recipe data imported successfully! Review and click "Save All Changes" when ready.'
        );
      }
    } catch (error) {
      console.error('❌ [JSON IMPORT] JSON import error:', error);
      toast.error(`Failed to import JSON: ${error.message}`);
    }
  };

  // Load recipes for browsing
  useEffect(() => {
    console.log('🔄 [RECIPE EDITOR] useEffect triggered', { viewMode, currentPage });
    if (viewMode === 'browse') {
      loadRecipes();
    }
  }, [viewMode, currentPage]);

  const loadRecipes = async () => {
    console.log('📚 [RECIPE EDITOR] loadRecipes called', { searchQuery, currentPage, viewMode });
    setLoading(true);
    if (searchQuery.trim()) {
      console.log('🔍 [RECIPE EDITOR] Searching recipes with query:', searchQuery);
      const result = await searchRecipesForEditing(searchQuery.trim(), 50);
      if (result.success) {
        console.log('✅ [RECIPE EDITOR] Search results loaded', { count: result.data.length });
        setRecipes(result.data);
        setTotalPages(1);
      } else {
        console.error('❌ [RECIPE EDITOR] Search failed:', result.error);
      }
    } else {
      console.log('📖 [RECIPE EDITOR] Loading all recipes', { page: currentPage });
      const result = await getAllRecipesForEditing(currentPage, 24);
      if (result.success) {
        console.log('✅ [RECIPE EDITOR] Recipes loaded', {
          count: result.data.length,
          total: result.total,
          totalPages: result.totalPages,
        });
        setRecipes(result.data);
        setTotalPages(result.totalPages || 1);
      } else {
        console.error('❌ [RECIPE EDITOR] Load failed:', result.error);
      }
    }
    setLoading(false);
    console.log('✅ [RECIPE EDITOR] loadRecipes complete');
  };

  // Create new recipe
  const handleCreateNewRecipe = () => {
    console.log('➕ [RECIPE EDITOR] Creating new recipe');
    setSelectedRecipe({ id: null, title: 'New Recipe' });
    setRecipeData(null);
    setViewMode('edit');

    // Initialize with default values
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImageUrlTimestamp(null);
    setPrepMinutes('');
    setCookMinutes('');
    setServings('4');
    setDifficulty('easy');
    setCuisine([]);
    setCuisineInput('');
    setMealTypes([]);
    setDiets([]);
    setAuthor('Community');
    setSteps([{ id: null, instruction: '', position: 1 }]);
    setIngredients([]);
    setOriginalIngredients([]);
    setNutrition({
      calories: '',
      protein: '',
      fat: '',
      carbs: '',
      fiber: '',
      sugar: '',
      sodium: '',
      cholesterol: '',
      saturated_fat: '',
      trans_fat: '',
      vitamin_a: '',
      vitamin_c: '',
      vitamin_d: '',
      potassium: '',
      calcium: '',
      iron: '',
    });
    setActiveTab('basic');
    setHasChanges(false);
    setNewImageFile(null);

    console.log('✅ [RECIPE EDITOR] New recipe initialized');
  };

  // Create and save new recipe
  const handleCreateAndSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a recipe title');
      return;
    }

    console.log('➕ [RECIPE EDITOR] Creating new recipe...', {
      title: title.trim(),
      stepsCount: steps.length,
      ingredientsCount: ingredients.length,
    });

    setSaving(true);

    // Convert ingredients back to original units for saving
    const ingredientsToSave = convertIngredientsToOriginal(ingredients);

    // Prepare nutrition data (convert empty strings to null, but ensure calories is never null)
    // IMPORTANT: Multiply by servings to convert per-serving to total
    const servingsForNutrition = servings ? parseFloat(servings) : 4;
    const nutritionToSave = {};
    Object.keys(nutrition).forEach(key => {
      const value = nutrition[key]?.trim();
      if (key === 'calories') {
        // Calories is REQUIRED - default to 0 if empty
        const parsedValue = value ? parseFloat(value) : 0;
        // Multiply by servings to get total
        nutritionToSave[key] = Math.round(parsedValue * servingsForNutrition);
      } else {
        const parsedValue = value ? parseFloat(value) : null;
        // Multiply by servings to get total
        nutritionToSave[key] =
          parsedValue !== null && !isNaN(parsedValue)
            ? Math.round(parsedValue * servingsForNutrition)
            : null;
      }
    });

    console.log('💾 [RECIPE EDITOR] Converting nutrition for new recipe:', {
      servings: servingsForNutrition,
      nutritionToSave,
      note: 'Nutrition values multiplied by servings to store as TOTAL',
    });

    const recipeDataToSave = {
      title: title.trim(),
      description: description || null,
      hero_image_url: imageUrl || null,
      prep_minutes: prepMinutes ? parseInt(prepMinutes) : null,
      cook_minutes: cookMinutes ? parseInt(cookMinutes) : null,
      servings: servings ? parseFloat(servings) : 4,
      difficulty: difficulty || 'easy',
      cuisine: cuisine || [],
      meal_types: mealTypes || [],
      diets: diets || [],
      author: author || 'Community',
      steps: steps.filter(s => s.instruction && s.instruction.trim()),
      ingredients: ingredientsToSave,
      nutrition: nutritionToSave,
    };

    const result = await createRecipe(recipeDataToSave);

    setSaving(false);

    if (result.success) {
      console.log('✅ [RECIPE EDITOR] Recipe created successfully', { recipeId: result.recipeId });
      toast.success(`✅ Recipe created successfully!`);

      // Reload the recipe to get full data
      const loadResult = await getRecipeForEditing(result.recipeId);
      if (loadResult.success) {
        setRecipeData(loadResult.data);
        setSelectedRecipe({
          id: result.recipeId,
          title: title.trim(),
          hero_image_url: imageUrl,
        });
        setHasChanges(false);

        // Reload recipe list
        loadRecipes();
      }
    } else {
      console.error('❌ [RECIPE EDITOR] Recipe creation failed:', result.error);
      toast.error(`Failed to create recipe: ${result.error}`);
    }
  };

  // Load recipe by ID (for when opened from MissingImagesViewer)
  useEffect(() => {
    if (initialRecipeId && viewMode === 'edit' && !selectedRecipe) {
      const loadRecipeById = async () => {
        setLoading(true);
        const result = await getRecipeForEditing(initialRecipeId);
        setLoading(false);

        if (result.success) {
          const recipeData_recipe = result.data.recipe;
          setRecipeData(result.data);
          setSelectedRecipe({
            id: initialRecipeId,
            title: recipeData_recipe.title || 'Untitled Recipe',
            hero_image_url: recipeData_recipe.hero_image_url,
          });

          // Load all recipe fields (same as handleSelectRecipe)
          setTitle(recipeData_recipe.title || '');
          setDescription(recipeData_recipe.description || '');
          const imageToSet = recipeData_recipe.hero_image_url || '';
          setImageUrl(imageToSet);
          setImageUrlTimestamp(null);
          setPrepMinutes(recipeData_recipe.prep_minutes?.toString() || '');
          setCookMinutes(recipeData_recipe.cook_minutes?.toString() || '');
          setServings(recipeData_recipe.servings?.toString() || '');
          setDifficulty(recipeData_recipe.difficulty || 'easy');
          setCuisine(Array.isArray(recipeData_recipe.cuisine) ? recipeData_recipe.cuisine : []);
          setCuisineInput(
            Array.isArray(recipeData_recipe.cuisine) ? recipeData_recipe.cuisine.join(', ') : ''
          );
          setMealTypes(
            Array.isArray(recipeData_recipe.meal_types) ? recipeData_recipe.meal_types : []
          );
          setDiets(Array.isArray(recipeData_recipe.diets) ? recipeData_recipe.diets : []);
          setAuthor(recipeData_recipe.author || '');

          // Load nutrition (convert from total to per-serving)
          const nutritionData = result.data.nutrition || {};
          const recipeServings = recipeData_recipe.servings || 1;
          const servingsDivisor = recipeServings > 0 ? recipeServings : 1;
          const convertToPerServing = value => {
            if (!value || value === null || value === undefined) return '';
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(num) || num === 0) return '';
            const perServing = num / servingsDivisor;
            return perServing % 1 === 0 ? perServing.toString() : perServing.toFixed(1);
          };
          setNutrition({
            calories: convertToPerServing(nutritionData.calories),
            protein: convertToPerServing(nutritionData.protein),
            fat: convertToPerServing(nutritionData.fat),
            carbs: convertToPerServing(nutritionData.carbs),
            fiber: convertToPerServing(nutritionData.fiber),
            sugar: convertToPerServing(nutritionData.sugar),
            sodium: convertToPerServing(nutritionData.sodium),
            cholesterol: convertToPerServing(nutritionData.cholesterol),
            saturated_fat: convertToPerServing(nutritionData.saturated_fat),
            trans_fat: convertToPerServing(nutritionData.trans_fat),
            vitamin_a: convertToPerServing(nutritionData.vitamin_a),
            vitamin_c: convertToPerServing(nutritionData.vitamin_c),
            vitamin_d: convertToPerServing(nutritionData.vitamin_d),
            potassium: convertToPerServing(nutritionData.potassium),
            calcium: convertToPerServing(nutritionData.calcium),
            iron: convertToPerServing(nutritionData.iron),
          });

          // Load ingredients and steps
          const loadedIngredients = (result.data.ingredients || []).map(ing => ({
            ingredient_name: ing.ingredient.name || '',
            quantity: ing.quantity?.toString() || '',
            unit: ing.unit || '',
            preparation: ing.preparation || '',
          }));
          setIngredients(loadedIngredients);
          setOriginalIngredients(loadedIngredients);

          const loadedSteps = (result.data.steps || []).map(step => ({
            instruction: step.instruction || '',
            timer_seconds: step.timer_seconds || null,
          }));
          setSteps(loadedSteps);

          // Auto-focus on Basic tab if focusOnImage is true
          if (focusOnImage) {
            setActiveTab('basic');
          }
        } else {
          toast.error('Failed to load recipe');
        }
      };

      loadRecipeById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipeId]);

  // Load recipe for editing
  const handleSelectRecipe = async recipe => {
    console.log('🎯 [RECIPE EDITOR] handleSelectRecipe called', {
      recipeId: recipe.id,
      title: recipe.title,
    });
    setSelectedRecipe(recipe);
    setViewMode('edit');
    setLoading(true);
    const result = await getRecipeForEditing(recipe.id);
    setLoading(false);

    if (result.success) {
      console.log('✅ [RECIPE EDITOR] Recipe loaded for editing', {
        recipeId: recipe.id,
        hasRecipe: !!result.data.recipe,
        stepsCount: result.data.steps?.length || 0,
        ingredientsCount: result.data.ingredients?.length || 0,
      });
      setRecipeData(result.data);
      const recipeData_recipe = result.data.recipe;

      // Set all fields in a batch to prevent multiple re-renders
      console.log('📝 [RECIPE EDITOR] Setting recipe fields', {
        hasImage: !!recipeData_recipe.hero_image_url,
        imageUrl: recipeData_recipe.hero_image_url?.substring(0, 50) + '...',
      });

      setTitle(recipeData_recipe.title || '');
      setDescription(recipeData_recipe.description || '');
      // Set image URL only once to prevent flashing - use a stable reference
      const imageToSet = recipeData_recipe.hero_image_url || '';
      setImageUrl(imageToSet);
      setImageUrlTimestamp(null); // Reset timestamp when loading recipe
      console.log('🖼️ [RECIPE EDITOR] Image URL set', {
        hasImage: !!imageToSet,
        imageUrl: imageToSet ? imageToSet.substring(0, 50) + '...' : 'empty',
      });
      setPrepMinutes(recipeData_recipe.prep_minutes?.toString() || '');
      setCookMinutes(recipeData_recipe.cook_minutes?.toString() || '');
      setServings(recipeData_recipe.servings?.toString() || '');
      setDifficulty(recipeData_recipe.difficulty || 'easy');
      setCuisine(Array.isArray(recipeData_recipe.cuisine) ? recipeData_recipe.cuisine : []);
      setCuisineInput(
        Array.isArray(recipeData_recipe.cuisine) ? recipeData_recipe.cuisine.join(', ') : ''
      );
      setMealTypes(Array.isArray(recipeData_recipe.meal_types) ? recipeData_recipe.meal_types : []);
      setDiets(Array.isArray(recipeData_recipe.diets) ? recipeData_recipe.diets : []);
      setAuthor(recipeData_recipe.author || '');

      // Load nutrition data
      // IMPORTANT: Nutrition is stored as TOTAL, but we display as PER-SERVING in the editor
      // Divide by servings to show per-serving values for easier editing
      const nutritionData = result.data.nutrition || {};
      const recipeServings = recipeData_recipe.servings || 1;
      const servingsDivisor = recipeServings > 0 ? recipeServings : 1;

      console.log('📊 [RECIPE EDITOR] Loading nutrition data', {
        hasNutrition: !!result.data.nutrition,
        servings: recipeServings,
        note: 'Converting TOTAL nutrition to PER-SERVING for display',
      });

      const convertToPerServing = value => {
        if (!value || value === null || value === undefined) return '';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num === 0) return '';
        const perServing = num / servingsDivisor;
        // Round to 1 decimal place for display
        return perServing % 1 === 0 ? perServing.toString() : perServing.toFixed(1);
      };

      setNutrition({
        calories: convertToPerServing(nutritionData.calories),
        protein: convertToPerServing(nutritionData.protein),
        fat: convertToPerServing(nutritionData.fat),
        carbs: convertToPerServing(nutritionData.carbs),
        fiber: convertToPerServing(nutritionData.fiber),
        sugar: convertToPerServing(nutritionData.sugar),
        sodium: convertToPerServing(nutritionData.sodium),
        cholesterol: convertToPerServing(nutritionData.cholesterol),
        saturated_fat: convertToPerServing(nutritionData.saturated_fat),
        trans_fat: convertToPerServing(nutritionData.trans_fat),
        vitamin_a: convertToPerServing(nutritionData.vitamin_a),
        vitamin_c: convertToPerServing(nutritionData.vitamin_c),
        vitamin_d: convertToPerServing(nutritionData.vitamin_d),
        potassium: convertToPerServing(nutritionData.potassium),
        calcium: convertToPerServing(nutritionData.calcium),
        iron: convertToPerServing(nutritionData.iron),
      });

      setSteps(
        result.data.steps.map(s => ({
          id: s.id,
          instruction: s.instruction || '',
          position: s.position,
        }))
      );
      // Store original ingredients (for unit conversion)
      const originalIngs = result.data.ingredients.map(ing => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient?.name || '',
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        preparation: ing.preparation || '',
      }));
      setOriginalIngredients(originalIngs);

      // Convert to current unit system
      const convertedIngs = convertIngredientsToSystem(originalIngs, unitSystem);
      setIngredients(convertedIngs);

      setActiveTab('basic');
      setHasChanges(false);
      console.log('✅ [RECIPE EDITOR] Recipe state initialized', {
        title: result.data.recipe.title,
        stepsCount: result.data.steps.length,
        ingredientsCount: result.data.ingredients.length,
      });
    } else {
      console.error('❌ [RECIPE EDITOR] Failed to load recipe:', result.error);
      toast.error(`Failed to load recipe: ${result.error}`);
    }
  };

  // Convert ingredients to selected unit system
  const convertIngredientsToSystem = (ings, system) => {
    return ings.map(ing => {
      const qty = parseFloat(ing.quantity);
      const unitLower = (ing.unit || '').toLowerCase().trim();

      // Skip conversion for count-based units (unit, piece, pieces, etc.)
      // These are items like "1 egg" or "2 apples" that shouldn't be converted
      const countBasedUnits = [
        'unit',
        'units',
        'piece',
        'pieces',
        'item',
        'items',
        'whole',
        'each',
      ];
      if (countBasedUnits.includes(unitLower) || !ing.unit || unitLower === '') {
        // Keep as-is for count-based items
        return {
          ...ing,
          _originalQuantity: ing.quantity,
          _originalUnit: ing.unit || 'unit',
        };
      }

      // Try to convert measurable units
      if (!isNaN(qty) && ing.unit) {
        const converted = convertMeasurement(qty, ing.unit, system);
        if (converted) {
          return {
            ...ing,
            quantity: converted.amount.toString(),
            unit: converted.unit,
            _originalQuantity: ing.quantity, // Store original for conversion back
            _originalUnit: ing.unit,
          };
        }
      }

      // If conversion failed, keep original but store it
      return {
        ...ing,
        _originalQuantity: ing.quantity,
        _originalUnit: ing.unit,
      };
    });
  };

  // Helper: Get base value (grams or ml) from any unit
  const getBaseValue = (amount, unit) => {
    const qty = parseFloat(amount);
    if (isNaN(qty) || !unit) return null;

    // Use the unit converter's internal logic
    // Convert to metric which uses base units (g/ml)
    const converted = convertMeasurement(qty, unit, 'metric');
    if (!converted) return null;

    let baseValue = converted.amount;
    // Convert kg/L to g/ml
    if (converted.unit.toLowerCase() === 'kg') baseValue *= 1000;
    if (converted.unit.toLowerCase() === 'l') baseValue *= 1000;

    return baseValue;
  };

  // Convert from base value to a specific unit
  const convertFromBase = (baseValue, targetUnit, isMass) => {
    if (baseValue === null || baseValue === undefined || !targetUnit) return null;

    // Convert from base (g/ml) to target unit via the appropriate system
    const system = isMass
      ? targetUnit.toLowerCase().includes('oz') || targetUnit.toLowerCase().includes('lb')
        ? 'us'
        : 'metric'
      : targetUnit.toLowerCase().includes('cup') ||
          targetUnit.toLowerCase().includes('tbsp') ||
          targetUnit.toLowerCase().includes('tsp')
        ? 'us'
        : 'metric';

    const converted = convertMeasurement(baseValue, isMass ? 'g' : 'ml', system);
    if (!converted) return null;

    // If the converted unit matches target, use it
    if (converted.unit.toLowerCase() === targetUnit.toLowerCase()) {
      return { amount: converted.amount, unit: targetUnit };
    }

    // Otherwise, try direct conversion
    // For now, return the converted value (user can adjust if needed)
    return converted;
  };

  // Convert ingredients back to original units (for saving)
  const convertIngredientsToOriginal = ings => {
    return ings.map(ing => {
      // CRITICAL: Preserve ingredient_name and other essential fields
      const essentialFields = {
        id: ing.id,
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name || '', // PRESERVE THIS!
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        preparation: ing.preparation || '',
      };

      const currentUnitLower = (ing.unit || '').toLowerCase().trim();
      const originalUnitLower = (ing._originalUnit || '').toLowerCase().trim();

      // Skip conversion for count-based units (unit, piece, pieces, etc.)
      const countBasedUnits = [
        'unit',
        'units',
        'piece',
        'pieces',
        'item',
        'items',
        'whole',
        'each',
      ];
      if (
        countBasedUnits.includes(currentUnitLower) ||
        countBasedUnits.includes(originalUnitLower)
      ) {
        // Keep count-based items as-is, but preserve essential fields
        return essentialFields;
      }

      // If we have original units stored and they differ from current, convert back
      if (ing._originalUnit && originalUnitLower !== currentUnitLower) {
        const qty = parseFloat(ing.quantity);
        if (!isNaN(qty) && ing.unit) {
          // Get base value from current unit
          const baseValue = getBaseValue(qty, ing.unit);
          if (baseValue !== null) {
            // Determine if it's mass or volume based on original unit
            const isMass = [
              'g',
              'gram',
              'grams',
              'kg',
              'kilogram',
              'kilograms',
              'oz',
              'ounce',
              'ounces',
              'lb',
              'lbs',
              'pound',
              'pounds',
            ].includes(originalUnitLower);

            // Convert from base to original unit
            const converted = convertFromBase(baseValue, ing._originalUnit, isMass);
            if (converted) {
              console.log('🔄 [RECIPE EDITOR] Converted ingredient back to original unit', {
                from: `${qty} ${ing.unit}`,
                to: `${converted.amount} ${converted.unit}`,
                original: `${ing._originalQuantity} ${ing._originalUnit}`,
              });
              return {
                ...essentialFields,
                quantity: converted.amount.toString(),
                unit: converted.unit,
              };
            }
          }
        }
      }
      // If no conversion needed or conversion failed, return essential fields only
      return essentialFields;
    });
  };

  // Handle unit system change
  const handleUnitSystemChange = newSystem => {
    console.log('🔄 [RECIPE EDITOR] Unit system changed', { from: unitSystem, to: newSystem });
    setUnitSystem(newSystem);
    try {
      localStorage.setItem('unitSystem', newSystem);
    } catch (e) {
      console.warn('⚠️ [RECIPE EDITOR] Failed to save unit system preference', e);
    }

    // Convert ingredients to new system
    // Use original ingredients if available, otherwise use current (converting back first)
    const baseIngredients =
      originalIngredients.length > 0
        ? originalIngredients
        : ingredients.map(ing => ({
            ...ing,
            quantity: ing._originalQuantity || ing.quantity,
            unit: ing._originalUnit || ing.unit,
          }));

    const converted = convertIngredientsToSystem(baseIngredients, newSystem);
    setIngredients(converted);

    // Update original ingredients if we're converting from stored originals
    if (originalIngredients.length > 0) {
      setOriginalIngredients(baseIngredients);
    }
  };

  // Track changes
  useEffect(() => {
    if (selectedRecipe && recipeData) {
      const hasTitleChange = title.trim() !== (selectedRecipe.title || '');
      const hasDescChange = description !== (recipeData.recipe.description || '');
      const hasImageChange = imageUrl !== (recipeData.recipe.hero_image_url || '');

      // Compare steps
      const originalSteps = (recipeData.steps || []).map(s => ({
        id: s.id,
        instruction: s.instruction || '',
        position: s.position,
      }));
      const hasStepsChange = JSON.stringify(steps) !== JSON.stringify(originalSteps);

      // Compare ingredients
      const originalIngredients = (recipeData.ingredients || []).map(ing => ({
        id: ing.id,
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient?.name || '',
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        preparation: ing.preparation || '',
      }));
      const hasIngredientsChange =
        JSON.stringify(ingredients) !== JSON.stringify(originalIngredients);

      // Check metadata changes
      const recipe = recipeData.recipe;
      const hasMetadataChange =
        prepMinutes !== (recipe?.prep_minutes?.toString() || '') ||
        cookMinutes !== (recipe?.cook_minutes?.toString() || '') ||
        servings !== (recipe?.servings?.toString() || '') ||
        difficulty !== (recipe?.difficulty || 'easy') ||
        JSON.stringify(cuisine) !== JSON.stringify(recipe?.cuisine || []) ||
        JSON.stringify(mealTypes) !== JSON.stringify(recipe?.meal_types || []) ||
        JSON.stringify(diets) !== JSON.stringify(recipe?.diets || []) ||
        author !== (recipe?.author || '');

      // Check nutrition changes
      const originalNutrition = recipeData.nutrition || {};
      const nutritionFields = [
        'calories',
        'protein',
        'fat',
        'carbs',
        'fiber',
        'sugar',
        'sodium',
        'cholesterol',
        'saturated_fat',
        'trans_fat',
        'vitamin_a',
        'vitamin_c',
        'vitamin_d',
        'potassium',
        'calcium',
        'iron',
      ];
      const hasNutritionChange = nutritionFields.some(field => {
        const currentValue = nutrition[field]?.trim() || '';
        const originalValue = originalNutrition[field]?.toString() || '';
        return currentValue !== originalValue;
      });

      const hasAnyChanges =
        hasTitleChange ||
        hasDescChange ||
        hasImageChange ||
        hasStepsChange ||
        hasIngredientsChange ||
        hasMetadataChange ||
        hasNutritionChange;

      if (hasAnyChanges !== hasChanges) {
        console.log('🔄 [RECIPE EDITOR] Change detected', {
          hasTitleChange,
          hasDescChange,
          hasImageChange,
          hasStepsChange,
          hasIngredientsChange,
          hasMetadataChange,
          hasAnyChanges,
        });
        setHasChanges(hasAnyChanges);
      }
    }
  }, [
    title,
    description,
    steps,
    ingredients,
    imageUrl,
    prepMinutes,
    cookMinutes,
    servings,
    difficulty,
    cuisine,
    mealTypes,
    diets,
    author,
    nutrition,
    selectedRecipe,
    recipeData,
  ]);

  // Save all changes (or create new recipe)
  const handleSaveAll = async () => {
    const isNewRecipe = !selectedRecipe || !selectedRecipe.id;

    if (isNewRecipe) {
      console.log('➕ [RECIPE EDITOR] Creating new recipe...');
      return handleCreateAndSave();
    }

    if (!selectedRecipe) {
      console.warn('⚠️ [RECIPE EDITOR] handleSaveAll called but no recipe selected');
      return;
    }

    console.log('💾 [RECIPE EDITOR] handleSaveAll called', {
      recipeId: selectedRecipe.id,
      titleChanged: title.trim() !== selectedRecipe.title,
      descriptionChanged: description !== recipeData?.recipe.description,
      stepsCount: steps.length,
      ingredientsCount: ingredients.length,
      imageChanged: imageUrl !== recipeData?.recipe.hero_image_url,
    });

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;
    const savedItems = []; // Track what was saved
    const errors = []; // Track any errors

    // Save title
    if (title.trim() && title !== selectedRecipe.title) {
      console.log('💾 [RECIPE EDITOR] Saving title...');
      const result = await updateRecipeTitle(selectedRecipe.id, title.trim());
      if (result.success) {
        successCount++;
        savedItems.push('Title');
        console.log('✅ [RECIPE EDITOR] Title saved');
      } else {
        errorCount++;
        errors.push(`Title: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Title save failed:', result.error);
      }
    }

    // Save description
    if (description !== recipeData?.recipe.description) {
      console.log('💾 [RECIPE EDITOR] Saving description...');
      const result = await updateRecipeDescription(selectedRecipe.id, description);
      if (result.success) {
        successCount++;
        savedItems.push('Description');
        console.log('✅ [RECIPE EDITOR] Description saved');
      } else {
        errorCount++;
        errors.push(`Description: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Description save failed:', result.error);
      }
    }

    // Save steps
    const validSteps = steps.filter(s => s.instruction && s.instruction.trim());
    if (validSteps.length > 0) {
      console.log('💾 [RECIPE EDITOR] Saving steps...', { count: validSteps.length });
      const result = await updateRecipeSteps(selectedRecipe.id, validSteps);
      if (result.success) {
        successCount++;
        savedItems.push(
          `Instructions (${validSteps.length} step${validSteps.length !== 1 ? 's' : ''})`
        );
        console.log('✅ [RECIPE EDITOR] Steps saved');
      } else {
        errorCount++;
        errors.push(`Instructions: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Steps save failed:', result.error);
      }
    }

    // Save ingredients (convert back to original units first)
    if (ingredients.length > 0) {
      console.log('💾 [RECIPE EDITOR] Saving ingredients...', { count: ingredients.length });
      console.log(
        '💾 [RECIPE EDITOR] Ingredients BEFORE conversion:',
        ingredients.map(ing => ({
          name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          hasName: !!ing.ingredient_name,
          nameLength: ing.ingredient_name?.length || 0,
        }))
      );

      // Check for ingredients without names
      const ingredientsWithoutNames = ingredients.filter(
        ing => !ing.ingredient_name || !ing.ingredient_name.trim()
      );
      if (ingredientsWithoutNames.length > 0) {
        console.warn(
          '⚠️ [RECIPE EDITOR] Some ingredients are missing names:',
          ingredientsWithoutNames.length
        );
        toast.warning(
          `⚠️ ${ingredientsWithoutNames.length} ingredient(s) are missing names and will be skipped!`
        );
      }

      // Convert ingredients back to original units for saving
      const ingredientsToSave = convertIngredientsToOriginal(ingredients);
      console.log('🔄 [RECIPE EDITOR] Converted ingredients for saving', {
        originalCount: ingredients.length,
        convertedCount: ingredientsToSave.length,
        sampleIngredient: ingredientsToSave[0],
        sampleKeys: ingredientsToSave[0] ? Object.keys(ingredientsToSave[0]) : [],
        allIngredients: ingredientsToSave.map(ing => ({
          name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
          hasName: !!ing.ingredient_name,
          nameLength: ing.ingredient_name?.length || 0,
        })),
      });

      const result = await updateRecipeIngredients(selectedRecipe.id, ingredientsToSave);
      if (result.success) {
        successCount++;
        savedItems.push(
          `Ingredients (${ingredientsToSave.length} item${ingredientsToSave.length !== 1 ? 's' : ''})`
        );
        console.log('✅ [RECIPE EDITOR] Ingredients saved');
        // Update original ingredients with saved values
        setOriginalIngredients(
          ingredientsToSave.map(ing => ({
            ...ing,
            _originalQuantity: ing.quantity,
            _originalUnit: ing.unit,
          }))
        );
      } else {
        errorCount++;
        errors.push(`Ingredients: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Ingredients save failed:', result.error);
      }
    }

    // Save image URL if changed
    if (imageUrl && imageUrl !== recipeData?.recipe.hero_image_url) {
      console.log('💾 [RECIPE EDITOR] Saving image URL...');
      const result = await updateRecipeImage(selectedRecipe.id, imageUrl);
      if (result.success) {
        successCount++;
        savedItems.push('Image');
        console.log('✅ [RECIPE EDITOR] Image URL saved');
      } else {
        errorCount++;
        errors.push(`Image: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Image URL save failed:', result.error);
      }
    }

    // Save metadata (prep_time, cook_time, servings, difficulty, cuisine, meal_types, diets, author)
    const metadata = {};
    const recipe = recipeData?.recipe;

    // Handle prep_minutes - allow 0 as a valid value
    const prepMinutesValue =
      prepMinutes.trim() === ''
        ? null
        : isNaN(parseInt(prepMinutes))
          ? null
          : parseInt(prepMinutes);
    if (prepMinutesValue !== (recipe?.prep_minutes ?? null)) {
      metadata.prep_minutes = prepMinutesValue;
      console.log('💾 [RECIPE EDITOR] Prep time changed', {
        from: recipe?.prep_minutes,
        to: prepMinutesValue,
      });
    }

    // Handle cook_minutes - allow 0 as a valid value
    const cookMinutesValue =
      cookMinutes.trim() === ''
        ? null
        : isNaN(parseInt(cookMinutes))
          ? null
          : parseInt(cookMinutes);
    if (cookMinutesValue !== (recipe?.cook_minutes ?? null)) {
      metadata.cook_minutes = cookMinutesValue;
      console.log('💾 [RECIPE EDITOR] Cook time changed', {
        from: recipe?.cook_minutes,
        to: cookMinutesValue,
      });
    }
    if (servings !== (recipe?.servings?.toString() || '')) {
      metadata.servings = servings ? parseFloat(servings) : null;
    }
    if (difficulty !== (recipe?.difficulty || 'easy')) {
      metadata.difficulty = difficulty;
    }
    if (JSON.stringify(cuisine) !== JSON.stringify(recipe?.cuisine || [])) {
      metadata.cuisine = cuisine;
    }
    if (JSON.stringify(mealTypes) !== JSON.stringify(recipe?.meal_types || [])) {
      metadata.meal_types = mealTypes;
    }
    if (JSON.stringify(diets) !== JSON.stringify(recipe?.diets || [])) {
      metadata.diets = diets;
    }
    if (author !== (recipe?.author || '')) {
      metadata.author = author || 'Community';
    }

    if (Object.keys(metadata).length > 0) {
      console.log('💾 [RECIPE EDITOR] Saving metadata...', metadata);
      console.log('💾 [RECIPE EDITOR] Metadata includes:', {
        hasPrepMinutes: 'prep_minutes' in metadata,
        prepMinutes: metadata.prep_minutes,
        hasCookMinutes: 'cook_minutes' in metadata,
        cookMinutes: metadata.cook_minutes,
        hasServings: 'servings' in metadata,
        servings: metadata.servings,
      });
      const result = await updateRecipeMetadata(selectedRecipe.id, metadata);
      if (result.success) {
        successCount++;
        const metadataFields = Object.keys(metadata).map(field => {
          // Format field names nicely
          const fieldMap = {
            prep_minutes: 'Prep Time',
            cook_minutes: 'Cook Time',
            servings: 'Servings',
            difficulty: 'Difficulty',
            cuisine: 'Cuisine',
            meal_types: 'Meal Types',
            diets: 'Diets',
            author: 'Author',
          };
          return fieldMap[field] || field;
        });
        savedItems.push(`Metadata (${metadataFields.join(', ')})`);
        console.log('✅ [RECIPE EDITOR] Metadata saved successfully', {
          savedFields: Object.keys(metadata),
        });
      } else {
        errorCount++;
        errors.push(`Metadata: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Metadata save failed:', result.error);
      }
    } else {
      console.log('ℹ️ [RECIPE EDITOR] No metadata changes to save');
    }

    // Save nutrition data
    // IMPORTANT: Nutrition values should be stored as TOTAL for the recipe (not per-serving)
    // If user enters per-serving values, we multiply by servings to get total
    const originalNutrition = recipeData?.nutrition || {};
    const nutritionToSave = {};
    let hasNutritionChanges = false;

    // Get current servings (use the NEW servings value if changed, or fall back to recipe's current servings)
    // IMPORTANT: Use the servings value that will be saved (from metadata or current state)
    const currentServings = servings ? parseFloat(servings) : recipeData?.recipe?.servings || 12;
    const servingsMultiplier = currentServings > 0 ? currentServings : 1;

    console.log('💾 [RECIPE EDITOR] Using servings for nutrition conversion:', {
      servingsFromState: servings,
      servingsFromMetadata: metadata.servings,
      recipeServings: recipeData?.recipe?.servings,
      finalServings: currentServings,
      multiplier: servingsMultiplier,
    });

    // Convert empty strings to null and compare
    const nutritionFields = [
      'calories',
      'protein',
      'fat',
      'carbs',
      'fiber',
      'sugar',
      'sodium',
      'cholesterol',
      'saturated_fat',
      'trans_fat',
      'vitamin_a',
      'vitamin_c',
      'vitamin_d',
      'potassium',
      'calcium',
      'iron',
    ];

    nutritionFields.forEach(field => {
      const currentValue = nutrition[field]?.trim() || '';
      const originalValue = originalNutrition[field]?.toString() || '';

      if (currentValue !== originalValue) {
        hasNutritionChanges = true;
        const parsedValue = currentValue ? parseFloat(currentValue) : null;

        // Multiply by servings to convert per-serving to total
        // This ensures nutrition is stored as TOTAL for the recipe
        // IMPORTANT: Default to 0 instead of null for required database fields
        if (parsedValue !== null && parsedValue !== undefined && !isNaN(parsedValue)) {
          nutritionToSave[field] = Math.round(parsedValue * servingsMultiplier);
          console.log(`💾 [RECIPE EDITOR] Converting ${field} from per-serving to total:`, {
            perServing: parsedValue,
            servings: servingsMultiplier,
            total: nutritionToSave[field],
          });
        } else {
          // Default to 0 for required fields (database has NOT NULL constraints)
          // This prevents database errors when fields are empty
          nutritionToSave[field] = 0;
          console.log(`💾 [RECIPE EDITOR] ${field} is empty, defaulting to 0 for database`);
        }
      }
    });

    if (hasNutritionChanges) {
      // VALIDATION: Check for unrealistic values before saving
      const caloriesTotal = nutritionToSave.calories || 0;
      const caloriesPerServing = caloriesTotal / servingsMultiplier;

      if (caloriesTotal > 0) {
        if (caloriesPerServing > 2000) {
          const warning = `⚠️ Warning: Calories per serving (${caloriesPerServing.toFixed(0)}) seems very high. Most recipes are 200-800 kcal per serving.`;
          console.warn('⚠️ [RECIPE EDITOR]', warning);
          toast.warning(warning);
        }
        if (caloriesTotal > 10000) {
          const error = `❌ ERROR: Total calories (${caloriesTotal.toFixed(0)}) exceeds 10,000! This is likely incorrect. Please check your values.`;
          console.error('❌ [RECIPE EDITOR]', error);
          toast.error(error);
          setSaving(false);
          return; // Don't save if values are clearly wrong
        }
      }

      console.log('💾 [RECIPE EDITOR] Saving nutrition data (as TOTAL for recipe)...', {
        nutritionToSave,
        servings: servingsMultiplier,
        caloriesPerServing: caloriesPerServing.toFixed(1),
        note: 'Nutrition values are stored as TOTAL for the recipe, not per-serving',
      });
      const result = await updateRecipeNutrition(selectedRecipe.id, nutritionToSave);
      if (result.success) {
        successCount++;
        const nutritionFieldsUpdated = Object.keys(nutritionToSave).length;
        savedItems.push(
          `Nutrition (${nutritionFieldsUpdated} field${nutritionFieldsUpdated !== 1 ? 's' : ''})`
        );
        console.log('✅ [RECIPE EDITOR] Nutrition saved');
      } else {
        errorCount++;
        errors.push(`Nutrition: ${result.error}`);
        console.error('❌ [RECIPE EDITOR] Nutrition save failed:', result.error);
      }
    }

    setSaving(false);

    console.log('💾 [RECIPE EDITOR] Save complete', {
      successCount,
      errorCount,
      savedItems,
      errors,
    });

    // Mark recipe as having complete nutrition/data if everything saved successfully
    // This makes it searchable on the home page (filters by has_complete_nutrition = true)
    if (errorCount === 0 && successCount >= 5) {
      // If we saved title, description, steps, ingredients, and at least one more thing
      console.log('✅ [RECIPE EDITOR] All major data saved, marking recipe as complete...');
      try {
        const { error: flagError } = await supabase
          .from('recipes')
          .update({ has_complete_nutrition: true })
          .eq('id', selectedRecipe.id);

        if (flagError) {
          console.warn('⚠️ [RECIPE EDITOR] Failed to set has_complete_nutrition flag:', flagError);
        } else {
          console.log(
            '✅ [RECIPE EDITOR] Recipe marked as having complete nutrition - it will now appear in search!'
          );
          savedItems.push('Recipe marked as complete');
        }
      } catch (err) {
        console.warn('⚠️ [RECIPE EDITOR] Error setting complete flag:', err);
      }
    }

    // Show detailed success/error feedback
    if (errorCount === 0 && successCount > 0) {
      // Build detailed success message
      let successMessage = `✅ Successfully saved ${successCount} update${successCount !== 1 ? 's' : ''}:`;
      if (savedItems.length > 0) {
        successMessage += `\n\n${savedItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`;
      }

      // Show toast with details (format for display)
      const formattedMessage = successMessage
        .split('\n')
        .map((line, idx) => (idx === 0 ? line : `  ${line}`))
        .join('\n');
      toast.success(formattedMessage, 5000);

      // Also log to console for debugging
      console.log('✅ [RECIPE EDITOR] Save Summary:', {
        totalSaved: successCount,
        items: savedItems,
        recipeId: selectedRecipe.id,
        recipeTitle: title || selectedRecipe.title,
      });

      setHasChanges(false);
      // Reload recipe data to ensure servings and nutrition are in sync
      console.log('🔄 [RECIPE EDITOR] Reloading recipe data after save...');
      const result = await getRecipeForEditing(selectedRecipe.id);
      if (result.success) {
        const updatedRecipe = result.data.recipe;
        const updatedNutrition = result.data.nutrition || {};

        setRecipeData(result.data);

        // Update servings in state
        if (updatedRecipe.servings) {
          setServings(updatedRecipe.servings.toString());
        }

        // Recalculate nutrition display (convert from total to per-serving)
        const recipeServings = updatedRecipe.servings || 1;
        const servingsDivisor = recipeServings > 0 ? recipeServings : 1;

        const convertToPerServing = value => {
          if (!value || value === null || value === undefined) return '';
          const num = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(num) || num === 0) return '';
          const perServing = num / servingsDivisor;
          return perServing % 1 === 0 ? perServing.toString() : perServing.toFixed(1);
        };

        setNutrition({
          calories: convertToPerServing(updatedNutrition.calories),
          protein: convertToPerServing(updatedNutrition.protein),
          fat: convertToPerServing(updatedNutrition.fat),
          carbs: convertToPerServing(updatedNutrition.carbs),
          fiber: convertToPerServing(updatedNutrition.fiber),
          sugar: convertToPerServing(updatedNutrition.sugar),
          sodium: convertToPerServing(updatedNutrition.sodium),
          cholesterol: convertToPerServing(updatedNutrition.cholesterol),
          saturated_fat: convertToPerServing(updatedNutrition.saturated_fat),
          trans_fat: convertToPerServing(updatedNutrition.trans_fat),
          vitamin_a: convertToPerServing(updatedNutrition.vitamin_a),
          vitamin_c: convertToPerServing(updatedNutrition.vitamin_c),
          vitamin_d: convertToPerServing(updatedNutrition.vitamin_d),
          potassium: convertToPerServing(updatedNutrition.potassium),
          calcium: convertToPerServing(updatedNutrition.calcium),
          iron: convertToPerServing(updatedNutrition.iron),
        });

        console.log('✅ [RECIPE EDITOR] Recipe data reloaded and nutrition recalculated', {
          servings: updatedRecipe.servings,
          caloriesTotal: updatedNutrition.calories,
          caloriesPerServing: convertToPerServing(updatedNutrition.calories),
          note: 'Nutrition converted from total to per-serving for editor display',
        });
      }
    } else if (errorCount > 0) {
      // Show error message with details
      let errorMessage = `❌ ${errorCount} error${errorCount !== 1 ? 's' : ''} occurred:`;
      if (errors.length > 0) {
        errorMessage += `\n\n${errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`;
      }

      if (successCount > 0) {
        errorMessage += `\n\n✅ ${successCount} update${successCount !== 1 ? 's' : ''} saved successfully.`;
      }

      // Format for display
      const formattedMessage = errorMessage
        .split('\n')
        .map((line, idx) => (idx === 0 ? line : `  ${line}`))
        .join('\n');
      toast.error(formattedMessage, 7000);

      console.error('❌ [RECIPE EDITOR] Save Summary with Errors:', {
        successCount,
        errorCount,
        savedItems,
        errors,
        recipeId: selectedRecipe.id,
      });
    } else if (successCount === 0) {
      toast.info('ℹ️ No changes detected - nothing to save.');
      console.log('ℹ️ [RECIPE EDITOR] No changes to save');
      toast.info('No changes to save');
    }
  };

  // Add step
  const handleAddStep = () => {
    console.log('➕ [RECIPE EDITOR] Adding step', { currentStepsCount: steps.length });
    setSteps([...steps, { id: null, instruction: '', position: steps.length + 1 }]);
  };

  // Remove step
  const handleRemoveStep = index => {
    console.log('🗑️ [RECIPE EDITOR] Removing step', { index, totalSteps: steps.length });
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i + 1 })));
  };

  // Update step
  const handleUpdateStep = (index, instruction) => {
    const newSteps = [...steps];
    newSteps[index].instruction = instruction;
    setSteps(newSteps);
    // Only log if instruction is substantial to avoid spam
    if (instruction.length > 10) {
      console.log('✏️ [RECIPE EDITOR] Step updated', {
        index,
        instructionLength: instruction.length,
      });
    }
  };

  // Add ingredient
  const handleAddIngredient = () => {
    // Get default unit for the current system
    const defaultUnit = unitSystem === 'metric' ? 'g' : unitSystem === 'us' ? 'cup' : 'ml';

    const newIngredient = {
      id: null,
      ingredient_id: null,
      ingredient_name: '',
      quantity: '',
      unit: defaultUnit,
      preparation: '',
      _originalQuantity: '',
      _originalUnit: defaultUnit,
    };
    console.log('➕ [RECIPE EDITOR] Adding ingredient', {
      currentIngredientsCount: ingredients.length,
      unitSystem,
      defaultUnit,
    });
    setIngredients([...ingredients, newIngredient]);
  };

  // Remove ingredient
  const handleRemoveIngredient = index => {
    console.log('🗑️ [RECIPE EDITOR] Removing ingredient', {
      index,
      totalIngredients: ingredients.length,
    });
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Update ingredient
  const handleUpdateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
    // Only log if value is substantial to avoid spam
    if (value && value.length > 3) {
      console.log('✏️ [RECIPE EDITOR] Ingredient updated', {
        index,
        field,
        valueLength: value.length,
      });
    }
  };

  // Clear all ingredients
  const handleClearAllIngredients = async () => {
    try {
      setSaving(true);
      console.log('🗑️ [RECIPE EDITOR] Clearing all ingredients', {
        recipeId: selectedRecipe?.id,
        isNewRecipe: !selectedRecipe?.id,
      });

      // Clear local state immediately
      setIngredients([]);
      setOriginalIngredients([]);

      // If it's an existing recipe, save to database
      if (selectedRecipe?.id) {
        const result = await updateRecipeIngredients(selectedRecipe.id, []);

        if (result.success) {
          console.log('✅ [RECIPE EDITOR] All ingredients cleared');
          toast.success('All ingredients cleared!');
          // Reload recipe data to reflect changes
          const loadResult = await getRecipeForEditing(selectedRecipe.id);
          if (loadResult.success) {
            setOriginalIngredients([]);
            setIngredients([]);
          }
        } else {
          console.error('❌ [RECIPE EDITOR] Failed to clear ingredients:', result.error);
          toast.error(`Failed to clear ingredients: ${result.error}`);
        }
      } else {
        // For new recipes, just show success
        toast.success('All ingredients cleared!');
      }
    } catch (error) {
      console.error('❌ [RECIPE EDITOR] Error clearing ingredients:', error);
      toast.error(`Error clearing ingredients: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Clear all steps/instructions
  const handleClearAllSteps = async () => {
    try {
      setSaving(true);
      console.log('🗑️ [RECIPE EDITOR] Clearing all steps', {
        recipeId: selectedRecipe?.id,
        isNewRecipe: !selectedRecipe?.id,
      });

      // Clear local state immediately (keep one empty step for UX)
      setSteps([{ id: null, instruction: '', position: 1 }]);

      // If it's an existing recipe, save to database
      if (selectedRecipe?.id) {
        const result = await updateRecipeSteps(selectedRecipe.id, []);

        if (result.success) {
          console.log('✅ [RECIPE EDITOR] All steps cleared');
          toast.success('All instructions cleared!');
          // Reload recipe data to reflect changes
          const loadResult = await getRecipeForEditing(selectedRecipe.id);
          if (loadResult.success) {
            setSteps([{ id: null, instruction: '', position: 1 }]);
          }
        } else {
          console.error('❌ [RECIPE EDITOR] Failed to clear steps:', result.error);
          toast.error(`Failed to clear instructions: ${result.error}`);
        }
      } else {
        // For new recipes, just show success
        toast.success('All instructions cleared!');
      }
    } catch (error) {
      console.error('❌ [RECIPE EDITOR] Error clearing steps:', error);
      toast.error(`Error clearing instructions: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Upload image file
  const handleUploadImage = async () => {
    if (!selectedRecipe || !newImageFile) {
      console.warn('⚠️ [RECIPE EDITOR] handleUploadImage called but no file selected');
      toast.error('Please select an image file');
      return;
    }

    const fileSizeMB = (newImageFile.size / (1024 * 1024)).toFixed(2);
    const fileSizeKB = (newImageFile.size / 1024).toFixed(2);
    const isPNG =
      newImageFile.type.includes('png') || newImageFile.name.toLowerCase().endsWith('.png');

    console.log('📤 [RECIPE EDITOR] handleUploadImage called', {
      recipeId: selectedRecipe.id,
      fileName: newImageFile.name,
      fileSize: `${fileSizeMB}MB`,
      fileType: newImageFile.type,
      isPNG,
    });

    setSaving(true);

    // Warn if PNG or large file
    if (isPNG) {
      toast.info(`🔄 PNG detected (${fileSizeMB}MB) - Converting to JPEG ≤100KB...`, 5000);
    } else if (newImageFile.size > 100 * 1024) {
      toast.info(`🔄 Large file detected (${fileSizeKB}KB) - Compressing to ≤100KB...`, 5000);
    }

    const result = await uploadRecipeImage(selectedRecipe.id, newImageFile);
    setSaving(false);

    if (result.success) {
      const newImageUrl = result.data.url;
      console.log('✅ [RECIPE EDITOR] Image uploaded successfully', {
        url: newImageUrl,
        urlLength: newImageUrl?.length,
        urlPreview: newImageUrl?.substring(0, 100),
        fullUrl: newImageUrl,
      });

      if (!newImageUrl) {
        console.error('❌ [RECIPE EDITOR] No URL returned from upload!');
        toast.error('Image uploaded but no URL returned. Please refresh the page.');
        return;
      }

      const finalSizeKB =
        newImageFile.size > 100 * 1024 ? ` (compressed from ${fileSizeMB}MB to ~100KB)` : '';
      toast.success(`✅ Image uploaded successfully${finalSizeKB}!`, 5000);

      // Update all state to reflect new image (store clean URL, cache-busting added in img tag)
      const uploadTimestamp = Date.now();
      setImageUrl(newImageUrl);
      setImageUrlTimestamp(uploadTimestamp);
      setSelectedRecipe({ ...selectedRecipe, hero_image_url: newImageUrl });

      // If opened from MissingImagesViewer, trigger refresh of parent
      if (focusOnImage && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('recipeImageUpdated', {
            detail: { recipeId: selectedRecipe.id, imageUrl: newImageUrl },
          })
        );
      }

      // Update recipeData if it exists (store original URL without cache-bust)
      if (recipeData) {
        setRecipeData({
          ...recipeData,
          recipe: {
            ...recipeData.recipe,
            hero_image_url: newImageUrl,
          },
        });
        console.log('✅ [RECIPE EDITOR] Updated recipeData with new image URL', {
          storedUrl: newImageUrl,
          timestamp: uploadTimestamp,
        });
      }

      setNewImageFile(null);

      console.log('✅ [RECIPE EDITOR] All state updated, image should be visible now', {
        imageUrlState: newImageUrl,
        imageUrlTimestamp: uploadTimestamp,
        selectedRecipeImageUrl: newImageUrl,
      });
    } else {
      console.error('❌ [RECIPE EDITOR] Image upload failed:', result.error);
      toast.error(`Failed to upload image: ${result.error}`);
    }
  };

  return (
    <div className="w-full">
      {viewMode === 'bulk' ? (
        <BulkRecipeEditor onBack={() => setViewMode('browse')} />
      ) : viewMode === 'browse' ? (
        // Browse Mode - Grid of Recipes
        <div className="space-y-4">
          {/* ChatGPT Import Banner - Prominent */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 shadow-lg mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="text-white font-bold text-lg">ChatGPT Recipe Import</h3>
                  <p className="text-white/90 text-sm">
                    Import complete recipes from ChatGPT JSON (ingredients, instructions, nutrition,
                    images)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJsonImport(true)}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-purple-600 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
              >
                <span>📥</span>
                <span>Import JSON from ChatGPT</span>
              </button>
            </div>
          </div>

          {/* Bulk Edit Banner - Prominent */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h3 className="text-white font-bold text-lg">Bulk Recipe Editor</h3>
                  <p className="text-white/90 text-sm">
                    Edit multiple recipes at once with CSV import/export
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('bulk')}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-purple-600 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
              >
                <span>🚀</span>
                <span>Open Bulk Editor</span>
              </button>
            </div>
          </div>

          {/* Search Bar and Create Button */}
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && loadRecipes()}
              placeholder="Search recipes by title... (or leave empty to see all)"
              className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
            <button
              onClick={loadRecipes}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  loadRecipes();
                }}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-semibold"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleExportCompleteRecipe}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg"
              title="Export complete recipe with correct data as reference for ChatGPT (select a recipe first)"
            >
              <span>📤</span>
              <span>Export Complete Recipe</span>
            </button>
            <button
              onClick={() => setShowJsonImport(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg"
              title="Import recipe from ChatGPT JSON"
            >
              <span>📥</span>
              <span>Import JSON from ChatGPT</span>
            </button>
            <button
              onClick={handleCreateNewRecipe}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <span>➕</span>
              <span>Create New Recipe</span>
            </button>
          </div>

          {/* Recipe Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No recipes found</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                {recipes.map(recipe => (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="cursor-pointer bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden transition-colors"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={recipe.hero_image_url || PLACEHOLDER}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Stop infinite loop - just hide the image if it fails
                          e.target.style.display = 'none';
                        }}
                      />
                      {!recipe.hero_image_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3
                        className="font-semibold text-sm text-slate-900 dark:text-white truncate"
                        title={recipe.title}
                      >
                        {recipe.title}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {!searchQuery && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          {/* ChatGPT Import/Export Banner - Prominent */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 shadow-lg mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="text-white font-bold text-lg">ChatGPT Recipe Import/Export</h3>
                  <p className="text-white/90 text-sm">
                    Import complete recipes from ChatGPT JSON or export current recipe as reference
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportCompleteRecipe}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 text-indigo-600 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
                  title="Export complete recipe with correct data as reference for ChatGPT"
                >
                  <span>📤</span>
                  <span>Export Complete Recipe</span>
                </button>
                <button
                  onClick={() => setShowJsonImport(true)}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 text-purple-600 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
                  title="Import recipe from ChatGPT JSON"
                >
                  <span>📥</span>
                  <span>Import JSON from ChatGPT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Header with Back Button */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => {
                setViewMode('browse');
                setSelectedRecipe(null);
                setRecipeData(null);
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold"
            >
              ← Back to Browse
            </button>
            {(hasChanges || !selectedRecipe?.id) && (
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    ● Unsaved changes
                  </span>
                )}
                {!selectedRecipe?.id && (
                  <span className="text-sm text-blue-600 dark:text-blue-400">● New Recipe</span>
                )}
                <button
                  onClick={handleSaveAll}
                  disabled={saving || (!selectedRecipe?.id && !title.trim())}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {saving
                    ? 'Saving...'
                    : !selectedRecipe?.id
                      ? '💾 Create Recipe'
                      : '💾 Save All Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Recipe Preview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex gap-4">
              <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                {imageUrl ? (
                  <img
                    key={`${imageUrl}-${imageUrlTimestamp || ''}`}
                    src={`${imageUrl}${imageUrlTimestamp ? `?t=${imageUrlTimestamp}` : ''}`}
                    alt={selectedRecipe?.title || 'Recipe'}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // Silently hide failed images - no logging to prevent spam
                      if (e.target) {
                        e.target.style.display = 'none';
                        e.target.onerror = null; // Remove handler to stop retries
                      }
                    }}
                    onLoad={() =>
                      console.log('🖼️ [RECIPE EDITOR] Image loaded successfully', {
                        imageUrl: imageUrl?.substring(0, 50) + '...',
                      })
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedRecipe?.title || title || 'New Recipe'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {selectedRecipe?.id ? `ID: ${selectedRecipe.id}` : 'New Recipe - Not Saved Yet'}
                </p>
                {!selectedRecipe?.id && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Fill in the title and click "Save All Changes" to create this recipe
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* JSON Import Modal */}
          {showJsonImport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowJsonImport(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Import Recipe from ChatGPT JSON
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Paste the JSON output from ChatGPT to automatically populate all recipe fields.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setImportMode('single')}
                      className={`px-3 py-1 text-sm rounded ${
                        importMode === 'single'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Single Recipe
                    </button>
                    <button
                      onClick={() => setImportMode('batch')}
                      className={`px-3 py-1 text-sm rounded ${
                        importMode === 'batch'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Batch Mode (Keep Open)
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <textarea
                    value={jsonImportText}
                    onChange={e => setJsonImportText(e.target.value)}
                    placeholder='Paste ChatGPT JSON here...\n\nExample:\n{\n  "recipe_id": "...",\n  "title": "...",\n  "description": "...",\n  ...\n}'
                    className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>💡 Tip:</strong> Copy the entire JSON object from ChatGPT and paste it
                      here. Missing fields will be skipped, existing data will be preserved.
                    </p>
                    {importMode === 'batch' && (
                      <p className="text-sm text-blue-900 dark:text-blue-200 mt-2">
                        <strong>⚡ Batch Mode:</strong> Modal stays open after import. Import → Save
                        → Paste next JSON → Repeat!
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-between items-center">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {importMode === 'batch' && (
                      <span>💡 After importing, save the recipe, then paste the next JSON</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowJsonImport(false);
                        setJsonImportText('');
                        setImportMode('single');
                      }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-semibold"
                    >
                      {importMode === 'batch' ? 'Close' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleJsonImport}
                      disabled={!jsonImportText.trim()}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>📥</span>
                      <span>Import Recipe</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex overflow-x-auto">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'steps', label: 'Instructions' },
                { id: 'nutrition', label: 'Nutrition' },
                { id: 'image', label: 'Image' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Missing Image Alert Banner */}
                {focusOnImage && !imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 border-2 border-red-300 dark:border-red-700 shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          📸 Missing Image Detected
                        </h3>
                        <p className="text-white/90 mb-4">
                          This recipe is missing an image. To fix it, scroll down to the{' '}
                          <strong>"Upload New Image File"</strong> section below and upload a JPEG
                          image (≤100KB recommended).
                        </p>
                        <div className="bg-white/20 rounded-lg p-3">
                          <p className="text-white text-sm font-semibold mb-1">Quick Steps:</p>
                          <ol className="text-white/90 text-sm list-decimal list-inside space-y-1">
                            <li>Scroll down to find the "Upload New Image File" section</li>
                            <li>Click "Choose File" and select a JPEG image</li>
                            <li>Click the "Upload" button</li>
                            <li>The image will be automatically compressed and saved</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter recipe title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter recipe description..."
                  />
                </div>

                {/* Time and Servings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Prep Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prepMinutes}
                      onChange={e => setPrepMinutes(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Cook Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cookMinutes}
                      onChange={e => setCookMinutes(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Servings *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={servings}
                      onChange={e => setServings(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="4"
                    />
                  </div>
                </div>

                {/* Difficulty and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Community"
                    />
                  </div>
                </div>

                {/* Cuisine */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cuisine (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={cuisineInput}
                    onChange={e => {
                      setCuisineInput(e.target.value);
                      const cuisines = e.target.value
                        .split(',')
                        .map(c => c.trim())
                        .filter(c => c);
                      setCuisine(cuisines);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Italian, Mediterranean"
                  />
                  {cuisine.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cuisine.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meal Types */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Meal Types
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['breakfast', 'lunch', 'dinner', 'snack', 'dessert'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mealTypes.includes(type)}
                          onChange={e => {
                            if (e.target.checked) {
                              setMealTypes([...mealTypes, type]);
                            } else {
                              setMealTypes(mealTypes.filter(t => t !== type));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Diets */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Dietary Restrictions
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      'vegetarian',
                      'vegan',
                      'gluten-free',
                      'keto',
                      'paleo',
                      'dairy-free',
                      'nut-free',
                    ].map(diet => (
                      <label key={diet} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={diets.includes(diet)}
                          onChange={e => {
                            if (e.target.checked) {
                              setDiets([...diets, diet]);
                            } else {
                              setDiets(diets.filter(d => d !== diet));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                          {diet.replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Ingredients
                  </h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Unit System Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Units:</span>
                      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        {Object.entries(UNIT_SYSTEMS).map(([key, system]) => (
                          <button
                            key={key}
                            onClick={() => handleUnitSystemChange(key)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              unitSystem === key
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                            title={system.hint}
                          >
                            {system.flag} {system.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddIngredient}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                      >
                        + Add Ingredient
                      </button>
                      {ingredients.length > 0 && (
                        <button
                          onClick={handleClearAllIngredients}
                          disabled={saving}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Clear all ingredients"
                        >
                          🗑️ Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {unitSystem !== 'metric' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Tip:</strong> Ingredients are displayed in{' '}
                    {UNIT_SYSTEMS[unitSystem].name} units. When you save, they'll be converted back
                    to their original units in the database.
                  </div>
                )}

                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={ing.ingredient_name}
                        onChange={e =>
                          handleUpdateIngredient(index, 'ingredient_name', e.target.value)
                        }
                        placeholder="Ingredient name"
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ing.quantity}
                          onChange={e => handleUpdateIngredient(index, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={e => handleUpdateIngredient(index, 'unit', e.target.value)}
                          placeholder="Unit"
                          className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={ing.preparation}
                        onChange={e => handleUpdateIngredient(index, 'preparation', e.target.value)}
                        placeholder="Preparation (optional)"
                        className="col-span-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {ingredients.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                    No ingredients yet. Click "Add Ingredient" to get started.
                  </p>
                )}
              </div>
            )}

            {/* Steps Tab */}
            {activeTab === 'steps' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Instructions
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddStep}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      + Add Step
                    </button>
                    {steps.length > 0 && steps.some(s => s.instruction.trim()) && (
                      <button
                        onClick={handleClearAllSteps}
                        disabled={saving}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear all instructions"
                      >
                        🗑️ Clear All
                      </button>
                    )}
                  </div>
                </div>

                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {index + 1}
                    </div>
                    <textarea
                      value={step.instruction}
                      onChange={e => handleUpdateStep(index, e.target.value)}
                      rows={3}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder={`Step ${index + 1} instruction...`}
                    />
                    <button
                      onClick={() => handleRemoveStep(index)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {steps.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                    No steps yet. Click "Add Step" to get started.
                  </p>
                )}
              </div>
            )}

            {/* Nutrition Tab */}
            {activeTab === 'nutrition' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Nutritional Information
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      ℹ️ Important: Enter values PER SERVING
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Enter the nutritional values for <strong>1 serving</strong> (e.g., 167 kcal
                      per muffin). The system will automatically calculate totals for all servings
                      when saving.
                      {servings && parseFloat(servings) > 0 && (
                        <span className="block mt-1">
                          Example: If you enter 167 kcal and servings is {servings}, the system will
                          store {Math.round(167 * parseFloat(servings))} kcal total.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Macros */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Macronutrients
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.calories}
                        onChange={e => setNutrition({ ...nutrition, calories: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.protein}
                        onChange={e => setNutrition({ ...nutrition, protein: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Fat (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.fat}
                        onChange={e => setNutrition({ ...nutrition, fat: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.carbs}
                        onChange={e => setNutrition({ ...nutrition, carbs: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Fats */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Fat Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Saturated Fat (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.saturated_fat}
                        onChange={e =>
                          setNutrition({ ...nutrition, saturated_fat: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Trans Fat (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.trans_fat}
                        onChange={e => setNutrition({ ...nutrition, trans_fat: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Fiber & Sugar */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Carbohydrates
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Fiber (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.fiber}
                        onChange={e => setNutrition({ ...nutrition, fiber: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Sugar (g)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.sugar}
                        onChange={e => setNutrition({ ...nutrition, sugar: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Minerals */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Minerals
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Sodium (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.sodium}
                        onChange={e => setNutrition({ ...nutrition, sodium: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Potassium (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.potassium}
                        onChange={e => setNutrition({ ...nutrition, potassium: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Calcium (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.calcium}
                        onChange={e => setNutrition({ ...nutrition, calcium: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Iron (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.iron}
                        onChange={e => setNutrition({ ...nutrition, iron: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Vitamins */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Vitamins
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Vitamin A (IU)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.vitamin_a}
                        onChange={e => setNutrition({ ...nutrition, vitamin_a: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Vitamin C (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={nutrition.vitamin_c}
                        onChange={e => setNutrition({ ...nutrition, vitamin_c: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Vitamin D (IU)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.vitamin_d}
                        onChange={e => setNutrition({ ...nutrition, vitamin_d: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Cholesterol */}
                <div>
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Other
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Cholesterol (mg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={nutrition.cholesterol}
                        onChange={e => setNutrition({ ...nutrition, cholesterol: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Current Image
                  </label>
                  <div className="w-full max-w-md h-64 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {imageUrl ? (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={selectedRecipe?.title || 'Recipe'}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Silently hide failed images - no logging to prevent spam
                          if (e.target) {
                            e.target.style.display = 'none';
                            e.target.onerror = null; // Remove handler to stop retries
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Update Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Upload New Image File
                  </label>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                      ⚠️ Image Requirements (CRITICAL for PWA Performance):
                    </p>
                    <ul className="text-sm text-amber-800 dark:text-amber-300 list-disc list-inside space-y-1">
                      <li>
                        <strong>Format:</strong> JPEG preferred (PNG will be auto-converted to JPEG)
                      </li>
                      <li>
                        <strong>Size:</strong> ≤100KB (will be auto-compressed if larger)
                      </li>
                      <li>
                        <strong>Resolution:</strong> 1024×1024 pixels (will be auto-resized)
                      </li>
                      <li>
                        <strong>Style:</strong> Pinterest-style soft natural lighting
                      </li>
                    </ul>
                    <p className="text-sm text-amber-800 dark:text-amber-300 mt-2 font-semibold">
                      💡 System automatically converts PNG → JPEG and compresses to ≤100KB on
                      upload.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      PNG files over 1MB will be compressed to ~100KB JPEG (95%+ size reduction).
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={e => setNewImageFile(e.target.files[0])}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={handleUploadImage}
                      disabled={saving || !newImageFile}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Converting & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                  {newImageFile && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Selected: {newImageFile.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            newImageFile.size > 100 * 1024 || newImageFile.type.includes('png')
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          Size: {(newImageFile.size / 1024).toFixed(1)}KB
                          {newImageFile.size > 1024 * 1024 &&
                            ` (${(newImageFile.size / (1024 * 1024)).toFixed(2)}MB)`}
                        </span>
                        {(newImageFile.type.includes('png') || newImageFile.size > 100 * 1024) && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                            ⚠️ Will be converted/compressed on upload
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
