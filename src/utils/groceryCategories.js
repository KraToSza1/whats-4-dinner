/**
 * Smart grocery categorization utility
 * Categorizes ingredients into store sections for better shopping organization
 */

// Store section categories with keywords
export const GROCERY_CATEGORIES = {
  Produce: {
    keywords: [
      'apple',
      'banana',
      'orange',
      'lemon',
      'lime',
      'grape',
      'berry',
      'strawberry',
      'blueberry',
      'tomato',
      'onion',
      'garlic',
      'potato',
      'carrot',
      'celery',
      'lettuce',
      'spinach',
      'kale',
      'broccoli',
      'cauliflower',
      'cabbage',
      'pepper',
      'bell pepper',
      'cucumber',
      'zucchini',
      'mushroom',
      'avocado',
      'corn',
      'peas',
      'bean',
      'green bean',
      'asparagus',
      'artichoke',
      'eggplant',
      'squash',
      'pumpkin',
      'radish',
      'turnip',
      'beet',
      'herb',
      'basil',
      'parsley',
      'cilantro',
      'rosemary',
      'thyme',
      'oregano',
      'mint',
      'ginger',
      'scallion',
      'shallot',
      'leek',
    ],
    icon: '🥬',
    color: 'emerald',
  },
  'Meat & Seafood': {
    keywords: [
      'chicken',
      'beef',
      'pork',
      'lamb',
      'turkey',
      'duck',
      'bacon',
      'sausage',
      'ham',
      'fish',
      'salmon',
      'tuna',
      'cod',
      'shrimp',
      'crab',
      'lobster',
      'mussel',
      'clam',
      'oyster',
      'scallop',
      'ground beef',
      'ground turkey',
      'ground pork',
      'steak',
      'ribs',
    ],
    icon: '🥩',
    color: 'red',
  },
  'Dairy & Eggs': {
    keywords: [
      'milk',
      'cheese',
      'butter',
      'cream',
      'yogurt',
      'sour cream',
      'cottage cheese',
      'cream cheese',
      'mozzarella',
      'cheddar',
      'parmesan',
      'feta',
      'ricotta',
      'egg',
      'eggs',
      'heavy cream',
      'half and half',
      'buttermilk',
      'greek yogurt',
    ],
    icon: '🥛',
    color: 'blue',
  },
  Pantry: {
    keywords: [
      'flour',
      'sugar',
      'salt',
      'pepper',
      'oil',
      'olive oil',
      'vegetable oil',
      'canola oil',
      'vinegar',
      'balsamic',
      'soy sauce',
      'worcestershire',
      'ketchup',
      'mustard',
      'mayonnaise',
      'honey',
      'maple syrup',
      'molasses',
      'vanilla',
      'cinnamon',
      'nutmeg',
      'paprika',
      'cumin',
      'coriander',
      'turmeric',
      'curry',
      'chili powder',
      'cayenne',
      'oregano',
      'thyme',
      'rosemary',
      'bay leaf',
      'clove',
      'allspice',
      'cardamom',
      'saffron',
    ],
    icon: '🥫',
    color: 'amber',
  },
  'Grains & Pasta': {
    keywords: [
      'rice',
      'pasta',
      'spaghetti',
      'penne',
      'macaroni',
      'noodle',
      'bread',
      'flour',
      'quinoa',
      'barley',
      'oats',
      'oatmeal',
      'couscous',
      'bulgur',
      'farro',
      'millet',
      'breadcrumbs',
      'panko',
      'cracker',
      'tortilla',
      'wrap',
      'pita',
    ],
    icon: '🌾',
    color: 'yellow',
  },
  Frozen: {
    keywords: [
      'frozen',
      'ice cream',
      'frozen vegetable',
      'frozen fruit',
      'frozen berry',
      'frozen peas',
      'frozen corn',
      'frozen spinach',
    ],
    icon: '🧊',
    color: 'cyan',
  },
  Beverages: {
    keywords: [
      'juice',
      'soda',
      'water',
      'coffee',
      'tea',
      'beer',
      'wine',
      'broth',
      'stock',
      'chicken broth',
      'beef broth',
      'vegetable broth',
    ],
    icon: '🥤',
    color: 'purple',
  },
  Bakery: {
    keywords: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'loaf'],
    icon: '🍞',
    color: 'orange',
  },
  Snacks: {
    keywords: [
      'chip',
      'cracker',
      'cookie',
      'pretzel',
      'nut',
      'almond',
      'walnut',
      'peanut',
      'cashew',
      'pistachio',
      'trail mix',
      'granola',
      'popcorn',
    ],
    icon: '🍿',
    color: 'pink',
  },
  Other: {
    keywords: [],
    icon: '📦',
    color: 'slate',
  },
};

/**
 * Categorize an ingredient into a store section
 */
export function categorizeIngredient(ingredient) {
  if (!ingredient) return 'Other';

  const lower = String(ingredient).toLowerCase();

  // Check each category
  for (const [category, data] of Object.entries(GROCERY_CATEGORIES)) {
    if (category === 'Other') continue;

    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Group items by category
 */
export function groupByCategory(items) {
  const grouped = {};

  for (const item of items) {
    const category = categorizeIngredient(item);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  }

  // Sort categories by predefined order
  const categoryOrder = Object.keys(GROCERY_CATEGORIES);
  const sorted = {};
  for (const cat of categoryOrder) {
    if (grouped[cat]) {
      sorted[cat] = grouped[cat];
    }
  }

  return sorted;
}

/**
 * Get category icon and color
 */
export function getCategoryInfo(category) {
  return GROCERY_CATEGORIES[category] || GROCERY_CATEGORIES['Other'];
}
