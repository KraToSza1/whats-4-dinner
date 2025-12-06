/**
 * Medical Conditions & Dietary Needs Utility
 * Manages user's medical conditions, required nutrients, and dietary restrictions
 */

const STORAGE_KEY = 'medical:conditions:v1';

// Comprehensive medical conditions with accurate dietary implications
// Based on medical guidelines from ADA, AHA, NKF, and other health organizations
export const MEDICAL_CONDITIONS = [
  // Diabetes (Type 1 & 2)
  {
    id: 'diabetes_type1',
    name: 'Type 1 Diabetes',
    icon: '🩺',
    description: 'Requires careful carbohydrate counting and monitoring',
    restrictions: {
      maxSugar: 10, // grams per serving (strict)
      maxCarbs: 30, // grams per serving
      avoidIngredients: [
        'sugar',
        'honey',
        'syrup',
        'molasses',
        'corn syrup',
        'high fructose corn syrup',
      ],
    },
  },
  {
    id: 'diabetes_type2',
    name: 'Type 2 Diabetes',
    icon: '🩺',
    description: 'Requires monitoring of carbohydrates and sugar intake',
    restrictions: {
      maxSugar: 15, // grams per serving
      maxCarbs: 45, // grams per serving
      avoidIngredients: ['sugar', 'honey', 'syrup', 'molasses', 'corn syrup'],
    },
  },
  {
    id: 'prediabetes',
    name: 'Prediabetes',
    icon: '🩺',
    description: 'Prevent progression with controlled carb intake',
    restrictions: {
      maxSugar: 20, // grams per serving
      maxCarbs: 50, // grams per serving
    },
  },
  // Cardiovascular Conditions
  {
    id: 'heart_disease',
    name: 'Heart Disease',
    icon: '❤️',
    description: 'Requires low sodium and saturated fat (AHA guidelines)',
    restrictions: {
      maxSodium: 500, // mg per serving (AHA: <1500mg/day = ~500mg/meal)
      maxSaturatedFat: 4, // grams per serving (AHA: <13g/day = ~4g/meal)
      maxCholesterol: 20, // mg per serving
      maxTransFat: 0, // grams per serving (should be zero)
      avoidIngredients: ['salt', 'butter', 'lard', 'margarine', 'processed meats'],
    },
  },
  {
    id: 'high_blood_pressure',
    name: 'High Blood Pressure (Hypertension)',
    icon: '🩸',
    description: 'Requires low sodium intake (DASH diet principles)',
    restrictions: {
      maxSodium: 500, // mg per serving (DASH: <2300mg/day = ~500mg/meal)
      avoidIngredients: ['salt', 'sodium', 'soy sauce', 'pickled foods'],
    },
  },
  {
    id: 'high_cholesterol',
    name: 'High Cholesterol',
    icon: '💊',
    description: 'Requires low saturated fat and cholesterol',
    restrictions: {
      maxSaturatedFat: 5, // grams per serving
      maxCholesterol: 20, // mg per serving
      maxTransFat: 0, // grams per serving
      avoidIngredients: ['butter', 'lard', 'red meat', 'full-fat dairy', 'fried foods'],
    },
  },
  {
    id: 'stroke_risk',
    name: 'Stroke Risk / History',
    icon: '🧠',
    description: 'Requires heart-healthy diet with low sodium',
    restrictions: {
      maxSodium: 400, // mg per serving (stricter)
      maxSaturatedFat: 4, // grams per serving
      maxCholesterol: 20, // mg per serving
      avoidIngredients: ['salt', 'processed meats', 'fried foods'],
    },
  },
  // Kidney Conditions
  {
    id: 'kidney_disease',
    name: 'Chronic Kidney Disease',
    icon: '🫘',
    description: 'Requires low sodium, potassium, and protein (CKD stages 3-5)',
    restrictions: {
      maxSodium: 300, // mg per serving (NKF: <2000mg/day = ~300mg/meal)
      maxPotassium: 200, // mg per serving (restricted diet)
      maxPhosphorus: 100, // mg per serving
      maxProtein: 15, // grams per serving (reduced protein)
      avoidIngredients: ['salt', 'bananas', 'potatoes', 'tomatoes', 'dairy', 'nuts', 'beans'],
    },
  },
  {
    id: 'kidney_stones',
    name: 'Kidney Stones',
    icon: '💎',
    description: 'Requires low oxalate and adequate hydration',
    restrictions: {
      maxSodium: 500, // mg per serving
      avoidIngredients: ['spinach', 'rhubarb', 'almonds', 'beets', 'chocolate', 'tea'],
    },
  },
  // Digestive Conditions
  {
    id: 'celiac',
    name: 'Celiac Disease',
    icon: '🌾',
    description: 'Must avoid gluten completely (autoimmune condition)',
    restrictions: {
      avoidIngredients: [
        'wheat',
        'gluten',
        'barley',
        'rye',
        'malt',
        "brewer's yeast",
        'semolina',
        'durum',
        'spelt',
        'triticale',
      ],
    },
  },
  {
    id: 'gluten_sensitivity',
    name: 'Non-Celiac Gluten Sensitivity',
    icon: '🌾',
    description: 'Avoid gluten to prevent symptoms',
    restrictions: {
      avoidIngredients: ['wheat', 'gluten', 'barley', 'rye'],
    },
  },
  {
    id: 'ibs',
    name: 'Irritable Bowel Syndrome (IBS)',
    icon: '🫄',
    description: 'May require low FODMAP diet',
    restrictions: {
      avoidIngredients: [
        'onion',
        'garlic',
        'beans',
        'lentils',
        'wheat',
        'dairy',
        'apples',
        'pears',
        'artificial sweeteners',
      ],
    },
  },
  {
    id: 'crohns',
    name: "Crohn's Disease",
    icon: '🫄',
    description: 'May require low-fiber diet during flares',
    restrictions: {
      maxFiber: 3, // grams per serving (during flares)
      avoidIngredients: ['nuts', 'seeds', 'raw vegetables', 'whole grains'],
    },
  },
  {
    id: 'ulcerative_colitis',
    name: 'Ulcerative Colitis',
    icon: '🫄',
    description: 'May require low-fiber diet during flares',
    restrictions: {
      maxFiber: 3, // grams per serving (during flares)
      avoidIngredients: ['nuts', 'seeds', 'raw vegetables', 'spicy foods'],
    },
  },
  {
    id: 'acid_reflux',
    name: 'GERD / Acid Reflux',
    icon: '🔥',
    description: 'Avoid trigger foods that increase acid',
    restrictions: {
      avoidIngredients: [
        'tomatoes',
        'citrus',
        'chocolate',
        'caffeine',
        'alcohol',
        'spicy foods',
        'fried foods',
        'onions',
        'garlic',
      ],
    },
  },
  // Nutritional Deficiencies
  {
    id: 'anemia',
    name: 'Iron Deficiency Anemia',
    icon: '🩸',
    description: 'Needs iron-rich foods and vitamin C for absorption',
    requirements: {
      minIron: 2.5, // mg per serving (RDA: 8-18mg/day)
      recommendedIngredients: ['spinach', 'red meat', 'beans', 'lentils', 'fortified cereals'],
    },
  },
  {
    id: 'osteoporosis',
    name: 'Osteoporosis',
    icon: '🦴',
    description: 'Needs calcium and vitamin D for bone health',
    requirements: {
      minCalcium: 250, // mg per serving (RDA: 1000-1200mg/day)
      minVitaminD: 100, // IU per serving (RDA: 600-800IU/day)
      recommendedIngredients: ['dairy', 'leafy greens', 'fortified foods', 'salmon'],
    },
  },
  {
    id: 'vitamin_d_deficiency',
    name: 'Vitamin D Deficiency',
    icon: '☀️',
    description: 'Needs vitamin D and calcium for absorption',
    requirements: {
      minVitaminD: 150, // IU per serving
      minCalcium: 200, // mg per serving
      recommendedIngredients: ['fatty fish', 'fortified dairy', 'egg yolks'],
    },
  },
  {
    id: 'b12_deficiency',
    name: 'Vitamin B12 Deficiency',
    icon: '💊',
    description: 'Needs B12 from animal products or fortified foods',
    requirements: {
      minB12: 1, // mcg per serving (RDA: 2.4mcg/day)
      recommendedIngredients: ['meat', 'fish', 'eggs', 'dairy', 'fortified cereals'],
    },
  },
  // Metabolic Conditions
  {
    id: 'gout',
    name: 'Gout',
    icon: '🦶',
    description: 'Should avoid high-purine foods to prevent attacks',
    restrictions: {
      avoidIngredients: [
        'red meat',
        'organ meats',
        'seafood',
        'anchovies',
        'sardines',
        'alcohol',
        'sweetened beverages',
      ],
      maxSugar: 10, // grams per serving (fructose increases uric acid)
    },
  },
  {
    id: 'pcos',
    name: 'PCOS (Polycystic Ovary Syndrome)',
    icon: '🦋',
    description: 'Benefits from low-glycemic, anti-inflammatory diet',
    restrictions: {
      maxSugar: 12, // grams per serving
      maxCarbs: 40, // grams per serving
      avoidIngredients: ['refined sugar', 'white bread', 'processed foods'],
    },
  },
  // Autoimmune Conditions
  {
    id: 'hashimotos',
    name: "Hashimoto's Thyroiditis",
    icon: '🦋',
    description: 'May benefit from avoiding goitrogens and gluten',
    restrictions: {
      avoidIngredients: ['soy', 'cruciferous vegetables (raw)', 'gluten'],
    },
  },
  {
    id: 'rheumatoid_arthritis',
    name: 'Rheumatoid Arthritis',
    icon: '🦴',
    description: 'Anti-inflammatory diet may help reduce symptoms',
    restrictions: {
      avoidIngredients: ['processed foods', 'fried foods', 'sugar', 'red meat'],
    },
  },
  // Liver Conditions
  {
    id: 'fatty_liver',
    name: 'Non-Alcoholic Fatty Liver Disease',
    icon: '🫀',
    description: 'Requires low sugar and processed foods',
    restrictions: {
      maxSugar: 10, // grams per serving
      maxSaturatedFat: 5, // grams per serving
      avoidIngredients: ['sugar', 'high fructose corn syrup', 'processed foods', 'alcohol'],
    },
  },
  // Pregnancy & Special Diets
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    icon: '🤰',
    description: 'Avoid certain foods and ensure adequate nutrients',
    restrictions: {
      avoidIngredients: [
        'raw fish',
        'raw eggs',
        'unpasteurized dairy',
        'deli meats',
        'high-mercury fish',
        'alcohol',
        'caffeine (excess)',
      ],
    },
    requirements: {
      minFolate: 50, // mcg per serving (RDA: 600mcg/day)
      minIron: 3, // mg per serving (RDA: 27mg/day)
      minCalcium: 300, // mg per serving (RDA: 1000mg/day)
    },
  },
  {
    id: 'gestational_diabetes',
    name: 'Gestational Diabetes',
    icon: '🤰',
    description: 'Requires strict carbohydrate control during pregnancy',
    restrictions: {
      maxSugar: 8, // grams per serving (very strict)
      maxCarbs: 30, // grams per serving
      avoidIngredients: ['sugar', 'refined carbs', 'sweetened beverages'],
    },
  },
  // Food Allergies (Severe)
  {
    id: 'peanut_allergy',
    name: 'Peanut Allergy (Severe)',
    icon: '🥜',
    description: 'Life-threatening - must avoid all peanut products',
    restrictions: {
      avoidIngredients: [
        'peanuts',
        'peanut butter',
        'peanut oil',
        'groundnuts',
        'may contain peanuts',
      ],
    },
  },
  {
    id: 'tree_nut_allergy',
    name: 'Tree Nut Allergy (Severe)',
    icon: '🌰',
    description: 'Life-threatening - must avoid all tree nuts',
    restrictions: {
      avoidIngredients: [
        'almonds',
        'walnuts',
        'cashews',
        'pistachios',
        'hazelnuts',
        'brazil nuts',
        'pecans',
        'macadamia',
      ],
    },
  },
  {
    id: 'shellfish_allergy',
    name: 'Shellfish Allergy (Severe)',
    icon: '🦐',
    description: 'Life-threatening - must avoid all shellfish',
    restrictions: {
      avoidIngredients: [
        'shrimp',
        'crab',
        'lobster',
        'mussels',
        'clams',
        'oysters',
        'scallops',
        'squid',
        'octopus',
      ],
    },
  },
  // Weight Management
  {
    id: 'obesity',
    name: 'Obesity / Weight Management',
    icon: '⚖️',
    description: 'Focus on nutrient-dense, lower-calorie foods',
    restrictions: {
      maxCalories: 400, // calories per serving
      maxSaturatedFat: 5, // grams per serving
      maxSugar: 10, // grams per serving
      avoidIngredients: ['processed foods', 'sugary drinks', 'fried foods'],
    },
  },
  // Cancer & Recovery
  {
    id: 'cancer_treatment',
    name: 'During Cancer Treatment',
    icon: '🎗️',
    description: 'May need high-protein, easy-to-digest foods',
    requirements: {
      minProtein: 20, // grams per serving (increased needs)
      minCalories: 300, // calories per serving (maintain weight)
    },
    restrictions: {
      avoidIngredients: ['raw foods', 'unpasteurized', 'undercooked'],
    },
  },
];

// Required nutrients that users can track
export const REQUIRED_NUTRIENTS = [
  { id: 'iron', name: 'Iron', unit: 'mg', icon: '🩸' },
  { id: 'calcium', name: 'Calcium', unit: 'mg', icon: '🦴' },
  { id: 'vitamin_d', name: 'Vitamin D', unit: 'IU', icon: '☀️' },
  { id: 'vitamin_c', name: 'Vitamin C', unit: 'mg', icon: '🍊' },
  { id: 'vitamin_a', name: 'Vitamin A', unit: 'IU', icon: '🥕' },
  { id: 'vitamin_b12', name: 'Vitamin B12', unit: 'mcg', icon: '💊' },
  { id: 'folate', name: 'Folate', unit: 'mcg', icon: '🌿' },
  { id: 'protein', name: 'Protein', unit: 'g', icon: '💪' },
  { id: 'fiber', name: 'Fiber', unit: 'g', icon: '🌾' },
  { id: 'potassium', name: 'Potassium', unit: 'mg', icon: '🍌' },
  { id: 'magnesium', name: 'Magnesium', unit: 'mg', icon: '⚡' },
  { id: 'zinc', name: 'Zinc', unit: 'mg', icon: '🔋' },
];

/**
 * Get user's medical conditions from storage
 */
export function getMedicalConditions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save user's medical conditions to storage
 */
export function saveMedicalConditions(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save medical conditions:', error);
    return false;
  }
}

/**
 * Initialize medical conditions data structure
 */
export function initializeMedicalConditions() {
  return {
    conditions: [], // Array of condition IDs
    customConditions: [], // Array of { id, name, description, restrictions, requirements }
    requiredNutrients: [], // Array of { nutrientId, minAmount, unit }
    foodsToAvoid: [], // Array of ingredient names
    foodsRecommended: [], // Array of ingredient names
    doctorNotes: '', // Free text notes from doctor
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get active medical conditions data (including family members)
 */
export function getActiveMedicalConditions() {
  const data = getMedicalConditions();
  const baseData = data || initializeMedicalConditions();

  const activeConditions = [];

  // Add user's conditions
  if (baseData.conditions && Array.isArray(baseData.conditions)) {
    baseData.conditions.forEach(conditionId => {
      const condition = MEDICAL_CONDITIONS.find(c => c.id === conditionId);
      if (condition) {
        activeConditions.push(condition);
      }
    });
  }

  // Add custom conditions
  if (baseData.customConditions && Array.isArray(baseData.customConditions)) {
    baseData.customConditions.forEach(custom => {
      activeConditions.push({
        id: custom.id,
        name: custom.name,
        description: custom.description || '',
        restrictions: custom.restrictions || {},
        requirements: custom.requirements || {},
      });
    });
  }

  // Add family member medical conditions
  try {
    const familyData = JSON.parse(localStorage.getItem('family:members') || '[]');
    if (Array.isArray(familyData) && familyData.length > 0) {
      const familyConditionIds = new Set();
      familyData.forEach(member => {
        if (member?.medicalConditions && Array.isArray(member.medicalConditions)) {
          member.medicalConditions.forEach(conditionId => {
            familyConditionIds.add(conditionId);
          });
        }
      });

      // Add family conditions that aren't already in user's conditions
      familyConditionIds.forEach(conditionId => {
        // Check if condition already added
        if (!activeConditions.find(c => c.id === conditionId)) {
          const condition = MEDICAL_CONDITIONS.find(c => c.id === conditionId);
          if (condition) {
            activeConditions.push(condition);
          }
        }
      });
    }
  } catch (_error) {
    // Ignore family data errors - fail gracefully
  }

  return {
    ...baseData,
    activeConditions,
  };
}

/**
 * Check if a recipe is safe for user's medical conditions
 * Returns { safe: boolean, warnings: [], conflicts: [] }
 */
export function checkRecipeForMedicalConditions(recipe, servings = null) {
  const medicalData = getActiveMedicalConditions();
  if (!medicalData || !medicalData.activeConditions || medicalData.activeConditions.length === 0) {
    return { safe: true, warnings: [], conflicts: [] };
  }

  const warnings = [];
  const conflicts = [];
  let isSafe = true;

  // Get recipe nutrition (per serving or total)
  const recipeServings = servings || recipe.servings || 1;
  const nutrition = recipe.nutrition?.nutrients || [];
  const ingredients = recipe.extendedIngredients || [];

  // Helper to get nutrient value - handles multiple name variations
  const getNutrient = name => {
    const nameLower = name.toLowerCase();
    // Try exact match first
    let nutrient = nutrition.find(n => n.name.toLowerCase() === nameLower);

    // Try partial match
    if (!nutrient) {
      nutrient = nutrition.find(n => n.name.toLowerCase().includes(nameLower));
    }

    // Try common variations
    if (!nutrient) {
      const variations = {
        carbohydrates: ['carbs', 'carbohydrate', 'total carbohydrates'],
        'saturated fat': ['saturated fat', 'saturated fatty acids', 'sat fat'],
        'trans fat': ['trans fat', 'trans fatty acids', 'trans'],
        'vitamin d': ['vitamin d', 'vitamin d3', 'cholecalciferol'],
        'vitamin c': ['vitamin c', 'ascorbic acid'],
        'vitamin a': ['vitamin a', 'retinol'],
        'vitamin b12': ['vitamin b12', 'b12', 'cobalamin'],
        folate: ['folate', 'folic acid', 'vitamin b9'],
        iron: ['iron', 'fe'],
        calcium: ['calcium', 'ca'],
        potassium: ['potassium', 'k'],
        phosphorus: ['phosphorus', 'p'],
        sodium: ['sodium', 'na', 'salt'],
        sugar: ['sugar', 'sugars', 'total sugars'],
        fiber: ['fiber', 'fibre', 'dietary fiber', 'dietary fibre'],
        protein: ['protein'],
        cholesterol: ['cholesterol'],
      };

      const searchTerms = variations[nameLower] || [nameLower];
      for (const term of searchTerms) {
        nutrient = nutrition.find(
          n => n.name.toLowerCase().includes(term) || term.includes(n.name.toLowerCase())
        );
        if (nutrient) break;
      }
    }

    if (!nutrient) return null;
    const perServing = nutrient.amount / recipeServings;
    return { total: nutrient.amount, perServing, unit: nutrient.unit };
  };

  // Helper to check if ingredient is in avoid list
  const hasAvoidedIngredient = ingredientName => {
    const nameLower = ingredientName.toLowerCase();
    const avoided = [
      ...(medicalData.foodsToAvoid || []),
      ...medicalData.activeConditions.flatMap(c =>
        (c.restrictions?.avoidIngredients || []).map(i => i.toLowerCase())
      ),
    ];
    return avoided.some(avoid => nameLower.includes(avoid) || avoid.includes(nameLower));
  };

  // Check each active condition
  medicalData.activeConditions.forEach(condition => {
    const conditionWarnings = [];
    const conditionConflicts = [];

    // Check restrictions
    if (condition.restrictions) {
      // Check max sugar
      if (condition.restrictions.maxSugar) {
        const sugar = getNutrient('sugar');
        if (sugar && sugar.perServing > condition.restrictions.maxSugar) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Sugar content (${sugar.perServing.toFixed(1)}g) exceeds limit (${condition.restrictions.maxSugar}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max carbs
      if (condition.restrictions.maxCarbs) {
        const carbs = getNutrient('carbohydrates') || getNutrient('carbs');
        if (carbs && carbs.perServing > condition.restrictions.maxCarbs) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Carbohydrate content (${carbs.perServing.toFixed(1)}g) exceeds limit (${condition.restrictions.maxCarbs}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max sodium
      if (condition.restrictions.maxSodium) {
        const sodium = getNutrient('sodium');
        if (sodium && sodium.perServing > condition.restrictions.maxSodium) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Sodium content (${sodium.perServing.toFixed(0)}mg) exceeds limit (${condition.restrictions.maxSodium}mg per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max saturated fat
      if (condition.restrictions.maxSaturatedFat) {
        const satFat = getNutrient('saturated fat');
        if (satFat && satFat.perServing > condition.restrictions.maxSaturatedFat) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Saturated fat (${satFat.perServing.toFixed(1)}g) exceeds limit (${condition.restrictions.maxSaturatedFat}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max cholesterol
      if (condition.restrictions.maxCholesterol) {
        const cholesterol = getNutrient('cholesterol');
        if (cholesterol && cholesterol.perServing > condition.restrictions.maxCholesterol) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Cholesterol (${cholesterol.perServing.toFixed(0)}mg) exceeds limit (${condition.restrictions.maxCholesterol}mg per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max protein
      if (condition.restrictions.maxProtein) {
        const protein = getNutrient('protein');
        if (protein && protein.perServing > condition.restrictions.maxProtein) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Protein content (${protein.perServing.toFixed(1)}g) exceeds limit (${condition.restrictions.maxProtein}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max potassium
      if (condition.restrictions.maxPotassium) {
        const potassium = getNutrient('potassium');
        if (potassium && potassium.perServing > condition.restrictions.maxPotassium) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Potassium content (${potassium.perServing.toFixed(0)}mg) exceeds limit (${condition.restrictions.maxPotassium}mg per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max phosphorus
      if (condition.restrictions.maxPhosphorus) {
        const phosphorus = getNutrient('phosphorus');
        if (phosphorus && phosphorus.perServing > condition.restrictions.maxPhosphorus) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Phosphorus content (${phosphorus.perServing.toFixed(0)}mg) exceeds limit (${condition.restrictions.maxPhosphorus}mg per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max trans fat
      if (condition.restrictions.maxTransFat !== undefined) {
        const transFat = getNutrient('trans fat');
        if (transFat && transFat.perServing > condition.restrictions.maxTransFat) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Trans fat content (${transFat.perServing.toFixed(2)}g) exceeds limit (${condition.restrictions.maxTransFat}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max calories
      if (condition.restrictions.maxCalories) {
        const calories = getNutrient('calories');
        if (calories && calories.perServing > condition.restrictions.maxCalories) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Calorie content (${calories.perServing.toFixed(0)}cal) exceeds limit (${condition.restrictions.maxCalories}cal per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check max fiber (for digestive conditions during flares)
      if (condition.restrictions.maxFiber) {
        const fiber = getNutrient('fiber');
        if (fiber && fiber.perServing > condition.restrictions.maxFiber) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Fiber content (${fiber.perServing.toFixed(1)}g) exceeds limit (${condition.restrictions.maxFiber}g per serving)`,
            severity: 'high',
          });
          isSafe = false;
        }
      }

      // Check avoided ingredients
      if (condition.restrictions.avoidIngredients) {
        const foundAvoided = ingredients.filter(ing => {
          const ingName = (ing.name || ing.originalName || '').toLowerCase();
          return condition.restrictions.avoidIngredients.some(
            avoid => ingName.includes(avoid.toLowerCase()) || avoid.toLowerCase().includes(ingName)
          );
        });

        if (foundAvoided.length > 0) {
          conditionConflicts.push({
            condition: condition.name,
            issue: `Contains ingredients to avoid: ${foundAvoided.map(i => i.name || i.originalName).join(', ')}`,
            severity: 'high',
          });
          isSafe = false;
        }
      }
    }

    // Check requirements (nutrients that should be present)
    if (condition.requirements) {
      // Check min iron
      if (condition.requirements.minIron) {
        const iron = getNutrient('iron');
        if (!iron || iron.perServing < condition.requirements.minIron) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low iron content (${iron ? iron.perServing.toFixed(1) : 0}mg). Recommended: ${condition.requirements.minIron}mg per serving`,
            severity: 'low',
          });
        }
      }

      // Check min calcium
      if (condition.requirements.minCalcium) {
        const calcium = getNutrient('calcium');
        if (!calcium || calcium.perServing < condition.requirements.minCalcium) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low calcium content (${calcium ? calcium.perServing.toFixed(0) : 0}mg). Recommended: ${condition.requirements.minCalcium}mg per serving`,
            severity: 'low',
          });
        }
      }

      // Check min vitamin D
      if (condition.requirements.minVitaminD) {
        const vitaminD = getNutrient('vitamin d');
        if (!vitaminD || vitaminD.perServing < condition.requirements.minVitaminD) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low vitamin D content (${vitaminD ? vitaminD.perServing.toFixed(0) : 0}IU). Recommended: ${condition.requirements.minVitaminD}IU per serving`,
            severity: 'low',
          });
        }
      }

      // Check min B12
      if (condition.requirements.minB12) {
        const b12 = getNutrient('vitamin b12');
        if (!b12 || b12.perServing < condition.requirements.minB12) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low vitamin B12 content (${b12 ? b12.perServing.toFixed(1) : 0}mcg). Recommended: ${condition.requirements.minB12}mcg per serving`,
            severity: 'low',
          });
        }
      }

      // Check min folate
      if (condition.requirements.minFolate) {
        const folate = getNutrient('folate');
        if (!folate || folate.perServing < condition.requirements.minFolate) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low folate content (${folate ? folate.perServing.toFixed(0) : 0}mcg). Recommended: ${condition.requirements.minFolate}mcg per serving`,
            severity: 'low',
          });
        }
      }

      // Check min protein (for increased needs)
      if (condition.requirements.minProtein) {
        const protein = getNutrient('protein');
        if (!protein || protein.perServing < condition.requirements.minProtein) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low protein content (${protein ? protein.perServing.toFixed(1) : 0}g). Recommended: ${condition.requirements.minProtein}g per serving`,
            severity: 'low',
          });
        }
      }

      // Check min calories (for weight maintenance during treatment)
      if (condition.requirements.minCalories) {
        const calories = getNutrient('calories');
        if (!calories || calories.perServing < condition.requirements.minCalories) {
          conditionWarnings.push({
            condition: condition.name,
            issue: `Low calorie content (${calories ? calories.perServing.toFixed(0) : 0}cal). Recommended: ${condition.requirements.minCalories}cal per serving`,
            severity: 'low',
          });
        }
      }
    }

    warnings.push(...conditionWarnings);
    conflicts.push(...conditionConflicts);
  });

  // Check general foods to avoid
  const foundAvoided = ingredients.filter(ing => {
    const ingName = (ing.name || ing.originalName || '').toLowerCase();
    return hasAvoidedIngredient(ingName);
  });

  if (foundAvoided.length > 0) {
    conflicts.push({
      condition: 'Custom Restrictions',
      issue: `Contains foods to avoid: ${foundAvoided.map(i => i.name || i.originalName).join(', ')}`,
      severity: 'high',
    });
    isSafe = false;
  }

  // Check required nutrients (user-defined)
  if (medicalData.requiredNutrients && medicalData.requiredNutrients.length > 0) {
    medicalData.requiredNutrients.forEach(req => {
      // Map nutrient IDs to search terms
      const nutrientMap = {
        iron: 'iron',
        calcium: 'calcium',
        vitamin_d: 'vitamin d',
        vitamin_c: 'vitamin c',
        vitamin_a: 'vitamin a',
        vitamin_b12: 'vitamin b12',
        folate: 'folate',
        protein: 'protein',
        fiber: 'fiber',
        potassium: 'potassium',
        magnesium: 'magnesium',
        zinc: 'zinc',
      };

      const searchTerm = nutrientMap[req.nutrientId] || req.nutrientId;
      const nutrient = getNutrient(searchTerm);

      if (!nutrient || nutrient.perServing < req.minAmount) {
        const nutrientName =
          REQUIRED_NUTRIENTS.find(n => n.id === req.nutrientId)?.name || req.nutrientId;
        warnings.push({
          condition: 'Nutritional Requirements',
          issue: `Low ${nutrientName} (${nutrient ? nutrient.perServing.toFixed(1) : 0}${req.unit || ''}). Recommended: ${req.minAmount}${req.unit || ''} per serving`,
          severity: 'low',
        });
      }
    });
  }

  return {
    safe: isSafe,
    warnings: warnings.filter(w => w.severity === 'low'),
    conflicts: conflicts.filter(c => c.severity === 'high'),
  };
}

/**
 * Filter recipes based on medical conditions
 */
export function filterRecipesByMedicalConditions(recipes) {
  const medicalData = getActiveMedicalConditions();
  if (!medicalData || !medicalData.activeConditions || medicalData.activeConditions.length === 0) {
    return recipes;
  }

  return recipes.filter(recipe => {
    const check = checkRecipeForMedicalConditions(recipe);
    return check.safe;
  });
}

/**
 * Get medical condition badge info for a recipe
 */
export function getRecipeMedicalBadge(recipe) {
  const check = checkRecipeForMedicalConditions(recipe);

  if (check.conflicts.length > 0) {
    return {
      type: 'warning',
      icon: '⚠️',
      color: 'red',
      message: `${check.conflicts.length} medical conflict${check.conflicts.length > 1 ? 's' : ''}`,
      conflicts: check.conflicts,
    };
  }

  if (check.warnings.length > 0) {
    return {
      type: 'info',
      icon: 'ℹ️',
      color: 'yellow',
      message: `${check.warnings.length} nutritional note${check.warnings.length > 1 ? 's' : ''}`,
      warnings: check.warnings,
    };
  }

  return null;
}
