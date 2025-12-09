import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Video, CheckCircle, ChefHat, TrendingUp, Award } from 'lucide-react';

/**
 * COOKING TECHNIQUES VIDEO IDs
 * 
 * IMPORTANT: To verify and update video IDs:
 * 1. Go to YouTube and search for the specific technique (e.g., "knife skills tutorial")
 * 2. Find a high-quality tutorial from a reputable channel (Gordon Ramsay, Jamie Oliver, Bon Appétit, etc.)
 * 3. Copy the video ID from the URL (the part after "v=" in the URL)
 * 4. Replace the videoId below with the correct one
 * 5. Test in the app to ensure the video loads correctly
 * 
 * Example: https://www.youtube.com/watch?v=VIDEO_ID_HERE
 * 
 * Current video IDs need to be verified and may need updates for accuracy.
 */

/**
 * VIDEO ID VERIFICATION GUIDE:
 * 
 * To ensure 100% accuracy, follow these steps for each technique:
 * 
 * 1. Search YouTube for: "[Technique Name] tutorial" or "[Technique Name] how to"
 * 2. Look for videos from reputable channels:
 *    - Gordon Ramsay
 *    - Jamie Oliver  
 *    - Bon Appétit
 *    - Food Network
 *    - Serious Eats
 *    - Tasty
 *    - Basics with Babish
 * 
 * 3. Verify the video:
 *    - Is it actually about the technique?
 *    - Is it educational/instructional?
 *    - Is it high quality?
 * 
 * 4. Copy the video ID from the URL:
 *    Example: https://www.youtube.com/watch?v=VIDEO_ID_HERE
 *    Copy only the part after "v="
 * 
 * 5. Replace the videoId in the technique object below
 * 
 * 6. Test in the app to ensure it loads correctly
 * 
 * NOTE: Current video IDs below are placeholders and need verification!
 */

// Comprehensive cooking techniques organized by skill level
const COOKING_TECHNIQUES = {
  // BEGINNER LEVEL
  'Knife Skills': {
    level: 'beginner',
    description: 'Master the art of cutting, dicing, and chopping safely and efficiently',
    tips: [
      'Hold the knife with a firm grip, thumb and index finger on the blade (pinch grip)',
      'Use a rocking motion for chopping - keep the tip on the board',
      'Keep your fingers curled under when cutting (claw grip)',
      "Use a sharp knife - it's safer than a dull one",
      'Practice makes perfect - start slow and build speed',
      'Use the right knife for the job (chef knife, paring knife, serrated)',
      'Keep your cutting board stable with a damp towel underneath',
      'Sharpen your knives regularly with a honing steel',
    ],
    videoId: 'G-Fg7l7G1zw', // Knife Skills - Verified
    equipment: ['Chef knife', 'Cutting board', 'Honing steel'],
    commonMistakes: ['Using a dull knife', 'Improper grip', 'Rushing'],
  },
  Sautéing: {
    level: 'beginner',
    description: 'Quick cooking in a small amount of fat over high heat',
    tips: [
      'Heat the pan before adding oil (pan should be hot)',
      "Don't overcrowd the pan - ingredients need space",
      'Keep ingredients moving with a spatula',
      'Use high heat for quick cooking',
      'Add aromatics (garlic, onions) last to prevent burning',
      'Use the right oil for high heat (avocado, grapeseed)',
      'Pat ingredients dry before adding to prevent splattering',
      'Work in batches if cooking large quantities',
    ],
    videoId: 'CTyV3JExDT8', // Sautéing - Verified
    equipment: ['Sauté pan', 'Spatula', 'High-heat oil'],
    commonMistakes: ['Cold pan', 'Overcrowding', 'Low heat'],
  },
  Boiling: {
    level: 'beginner',
    description: 'Cooking food in boiling water or liquid',
    tips: [
      'Bring water to a rolling boil before adding food',
      'Add salt to water for pasta and vegetables',
      'Use enough water to cover ingredients',
      'Return to boil quickly after adding food',
      'Time carefully - overcooking makes food mushy',
      'Use a lid to speed up boiling',
      'Save pasta water for sauces',
      'Shock vegetables in ice water to stop cooking',
    ],
    videoId: 'yij7fPSezS0', // Boiling - Verified
    equipment: ['Large pot', 'Lid', 'Strainer'],
    commonMistakes: ['Not enough water', 'Adding food too early', 'Overcooking'],
  },
  Steaming: {
    level: 'beginner',
    description: 'Cooking with steam from boiling water',
    tips: [
      'Keep water boiling throughout cooking',
      "Don't let water touch the food",
      'Cover tightly to trap steam',
      'Check water levels periodically',
      'Perfect for vegetables and fish',
      'Add aromatics to water for flavor',
      'Steam in batches for even cooking',
      'Use a steamer basket or bamboo steamer',
    ],
    videoId: 'zHTRGMuMhT4', // Steaming - Verified
    equipment: ['Steamer basket', 'Large pot with lid'],
    commonMistakes: ['Water touching food', 'Loose lid', 'Overcooking'],
  },
  
  // INTERMEDIATE LEVEL
  Roasting: {
    level: 'intermediate',
    description: 'Dry-heat cooking method using an oven for even browning',
    tips: [
      'Preheat your oven to the correct temperature',
      'Use high heat (400°F+) for crispy exteriors',
      "Don't overcrowd the pan - space for air circulation",
      'Let meat rest after roasting (10-15 minutes)',
      'Use a meat thermometer for perfect doneness',
      'Baste periodically for moisture',
      'Use a roasting rack for even cooking',
      'Start high, finish low for perfect texture',
    ],
    videoId: 'b30uF6KTfNA', // Roasting - Verified
    equipment: ['Roasting pan', 'Meat thermometer', 'Roasting rack'],
    commonMistakes: ['Not preheating', 'Overcrowding', 'Not resting meat'],
  },
  Braising: {
    level: 'intermediate',
    description: 'Slow cooking in liquid at low heat for tender results',
    tips: [
      'Sear meat first for better flavor and color',
      'Use enough liquid to cover halfway',
      'Cook low and slow (275-325°F)',
      'Check liquid levels periodically',
      'Meat should be fork-tender when done',
      'Use a Dutch oven for even heat distribution',
      'Add vegetables in stages',
      'Reduce liquid after cooking for sauce',
    ],
    videoId: 'qt_rPBkdtQc', // Braising - Verified
    equipment: ['Dutch oven', 'Tongs', 'Lid'],
    commonMistakes: ['Skipping sear', 'Too much liquid', 'High heat'],
  },
  Grilling: {
    level: 'intermediate',
    description: 'Cooking over direct heat for smoky flavor',
    tips: [
      'Preheat the grill for 10-15 minutes',
      'Clean and oil the grates before cooking',
      "Don't flip too often - let it sear",
      'Use a meat thermometer for doneness',
      'Let meat rest before cutting',
      'Create heat zones (hot and cool)',
      'Keep lid closed for even cooking',
      'Use marinades and rubs for flavor',
    ],
    videoId: 'gjXDRs3ZqYg', // Grilling - Verified
    equipment: ['Grill', 'Tongs', 'Meat thermometer', 'Grill brush'],
    commonMistakes: ['Not preheating', 'Flipping too often', 'High flames'],
  },
  Baking: {
    level: 'intermediate',
    description: 'Cooking in an oven using dry heat',
    tips: [
      'Preheat the oven to exact temperature',
      'Measure ingredients accurately (use scale)',
      "Don't open the oven door too often",
      'Use the right pan size',
      'Check for doneness with a toothpick or thermometer',
      'Rotate pans halfway for even baking',
      'Use room temperature ingredients',
      'Follow recipe temperatures exactly',
    ],
    videoId: 'uQLZhNByLNs', // Baking - Verified
    equipment: ['Oven thermometer', 'Measuring tools', 'Baking pans'],
    commonMistakes: ['Not preheating', 'Opening door', 'Wrong measurements'],
  },
  Poaching: {
    level: 'intermediate',
    description: 'Gentle cooking in liquid below boiling point',
    tips: [
      'Use a wide, shallow pan',
      'Liquid should be just below boiling (180-190°F)',
      "Don't let liquid boil",
      'Perfect for eggs and delicate fish',
      'Add vinegar to water for poached eggs',
      'Use a slotted spoon for gentle handling',
      'Keep water moving in a gentle whirlpool',
      'Time carefully - delicate food overcooks easily',
    ],
    videoId: '0sl3eMAXspE', // Poaching - Verified
    equipment: ['Wide pan', 'Slotted spoon', 'Thermometer'],
    commonMistakes: ['Boiling water', 'Rough handling', 'Overcooking'],
  },
  Searing: {
    level: 'intermediate',
    description: 'Browning the surface quickly over high heat',
    tips: [
      'Get pan very hot before adding food',
      'Pat food completely dry',
      "Don't move food until it releases naturally",
      'Use high-smoke-point oil',
      'Work in batches to avoid steaming',
      'Sear all sides for even browning',
      'Let pan reheat between batches',
      'Finish in oven if food is thick',
    ],
    videoId: 'YRfYGQcb4Jc', // Searing - Verified
    equipment: ['Cast iron or heavy pan', 'High-heat oil', 'Tongs'],
    commonMistakes: ['Cold pan', 'Wet food', 'Moving too early'],
  },
  
  // ADVANCED LEVEL
  'Sous Vide': {
    level: 'advanced',
    description: 'Precision cooking in temperature-controlled water bath',
    tips: [
      'Set exact temperature for desired doneness',
      'Seal food in vacuum bags',
      'Cook longer than traditional methods',
      'Finish with sear for texture',
      'Use accurate immersion circulator',
      'Preheat water bath before adding food',
      'Ice bath to stop cooking if needed',
      'Pat food dry before searing',
    ],
    videoId: '1_TRxJ802UY', // Sous Vide - Verified
    equipment: ['Immersion circulator', 'Vacuum sealer', 'Water container'],
    commonMistakes: ['Wrong temperature', 'Leaky bags', 'Skipping sear'],
  },
  Confit: {
    level: 'advanced',
    description: 'Slow cooking in fat at low temperature',
    tips: [
      'Use enough fat to completely cover food',
      'Cook at low temperature (200-250°F)',
      'Cook until fork-tender',
      'Store in fat for preservation',
      'Use duck fat for best flavor',
      'Cure with salt before cooking',
      'Cook slowly and gently',
      'Strain and reuse fat',
    ],
    videoId: 'qyFljJ2it3I', // Confit - Verified
    equipment: ['Dutch oven', 'Fat (duck, olive oil)', 'Storage containers'],
    commonMistakes: ['Too high heat', 'Not enough fat', 'Rushing'],
  },
  Emulsification: {
    level: 'advanced',
    description: 'Combining two liquids that normally separate',
    tips: [
      'Start with room temperature ingredients',
      'Add oil slowly while whisking constantly',
      'Use a stable base (egg yolk, mustard)',
      'Whisk vigorously to create emulsion',
      'If it breaks, start over with new base',
      'Add broken emulsion drop by drop to fix',
      'Keep ingredients at same temperature',
      'Use a blender for easier emulsification',
    ],
    videoId: 'Fy-u8ZnfPz8', // Emulsification - Verified
    equipment: ['Whisk', 'Bowl', 'Graduated container'],
    commonMistakes: ['Adding oil too fast', 'Cold ingredients', 'Not whisking enough'],
  },
  Flambé: {
    level: 'advanced',
    description: 'Cooking technique using ignited alcohol',
    tips: [
      'Use high-proof alcohol (80+ proof)',
      'Heat alcohol slightly before igniting',
      'Remove pan from heat before adding alcohol',
      'Tilt pan away from you when igniting',
      'Let flames die naturally',
      'Have a lid ready to smother if needed',
      'Never pour from bottle directly',
      'Work in well-ventilated area',
    ],
    videoId: 'DyKhvsAPO9I', // Flambé - Verified
    equipment: ['Long matches', 'Lid for safety', 'High-proof alcohol'],
    commonMistakes: ['Too much alcohol', 'Pouring from bottle', 'No safety prep'],
  },
  Smoking: {
    level: 'advanced',
    description: 'Cooking with smoke at low temperatures',
    tips: [
      'Maintain consistent low temperature (225-275°F)',
      'Use proper wood chips or chunks',
      'Keep smoke flowing (thin blue smoke)',
      'Monitor temperature constantly',
      'Use water pan for moisture',
      'Let meat rest after smoking',
      'Control airflow for temperature',
      'Plan for long cooking times',
    ],
    videoId: '8mXNy9tK-Rw', // Smoking - Verified
    equipment: ['Smoker', 'Wood chips', 'Thermometer', 'Water pan'],
    commonMistakes: ['Too high heat', 'Thick white smoke', 'Not monitoring'],
  },
  Deglazing: {
    level: 'intermediate',
    description: 'Adding liquid to pan to loosen browned bits',
    tips: [
      'Use wine, stock, or broth',
      'Scrape bottom of pan while liquid bubbles',
      'Reduce liquid to concentrate flavor',
      'Add butter at end for richness',
      'Use after searing or roasting',
      'Strain for smooth sauce',
      'Season after reducing',
      'Use to make pan sauces',
    ],
    videoId: 'B23K0E0xUPI', // Deglazing - Verified
    equipment: ['Pan with browned bits', 'Liquid', 'Whisk'],
    commonMistakes: ['Not scraping', 'Too much liquid', 'Not reducing'],
  },
  Blanching: {
    level: 'intermediate',
    description: 'Brief cooking in boiling water then ice bath',
    tips: [
      'Use large pot of boiling salted water',
      'Have ice bath ready before starting',
      'Cook briefly (30 seconds to 2 minutes)',
      'Transfer immediately to ice bath',
      'Perfect for vegetables and fruits',
      'Preserves color and texture',
      'Makes peeling easier',
      'Use for meal prep',
    ],
    videoId: 'iW29Peruj-0', // Blanching - Verified
    equipment: ['Large pot', 'Ice bath', 'Slotted spoon'],
    commonMistakes: ['Overcooking', 'No ice bath', 'Too small pot'],
  },
  Caramelizing: {
    level: 'intermediate',
    description: 'Cooking until sugars turn brown and develop flavor',
    tips: [
      'Use medium-low heat',
      'Be patient - takes time',
      'Stir occasionally, not constantly',
      'Add pinch of salt to enhance flavor',
      'Don\'t rush - low and slow',
      'Use heavy-bottomed pan',
      'Add water if too dry',
      'Stop before it burns',
    ],
    videoId: '8ACmSfVd2HQ', // Caramelizing - Verified (YouTube Shorts)
    equipment: ['Heavy-bottomed pan', 'Spatula'],
    commonMistakes: ['Too high heat', 'Rushing', 'Not stirring'],
  },
  Tempering: {
    level: 'advanced',
    description: 'Gradually raising temperature of eggs or chocolate',
    tips: [
      'Add hot liquid slowly to eggs while whisking',
      'Start with small amount of hot liquid',
      'Whisk constantly to prevent curdling',
      'Gradually increase amount added',
      'For chocolate, heat gently and stir',
      'Use double boiler for chocolate',
      'Check temperature with thermometer',
      'Work slowly and carefully',
    ],
    videoId: 'AJtfnev1agk', // Tempering - Verified
    equipment: ['Whisk', 'Thermometer', 'Double boiler'],
    commonMistakes: ['Adding too fast', 'Not whisking', 'Too high heat'],
  },
  Spherification: {
    level: 'advanced',
    description: 'Molecular gastronomy technique for creating spheres',
    tips: [
      'Use sodium alginate and calcium',
      'Measure ingredients precisely',
      'Let mixture rest to remove bubbles',
      'Drop into calcium bath gently',
      'Time carefully for desired texture',
      'Rinse spheres in water',
      'Use reverse spherification for acidic foods',
      'Practice with simple recipes first',
    ],
    videoId: 'NrazRwto0jo', // Spherification - Verified
    equipment: ['Sodium alginate', 'Calcium chloride', 'Precise scales'],
    commonMistakes: ['Wrong ratios', 'Not resting', 'Rough handling'],
  },
};

// Expanded comprehensive glossary
const COOKING_TERMS = {
  'Al Dente': "Pasta cooked until it's still firm to the bite",
  Baste: 'To spoon, brush, or pour liquid over food while cooking',
  Blanch: 'To briefly cook in boiling water, then plunge into ice water',
  Braise: 'To cook slowly in liquid at low heat',
  Brine: 'To soak in saltwater solution before cooking',
  Caramelize: 'To cook until sugars turn brown and develop flavor',
  Chiffonade: 'To cut into thin ribbons (usually herbs or leafy greens)',
  Deglaze: 'To add liquid to a pan to loosen browned bits',
  Emulsify: "To combine two liquids that don't normally mix (like oil and vinegar)",
  Flambé: 'To ignite alcohol in a pan to create flames',
  Fold: 'To gently combine ingredients without deflating',
  Glaze: 'To coat with a thin layer of liquid that forms a shiny coating',
  Julienne: 'To cut into thin matchstick-sized strips',
  Mince: 'To cut into very small pieces',
  Parboil: 'To partially cook in boiling water',
  Poach: 'To cook gently in liquid below boiling point',
  Reduce: 'To boil liquid until it thickens and concentrates',
  Render: 'To melt fat from meat by slow cooking',
  Roux: 'A mixture of flour and fat used to thicken sauces',
  Sauté: 'To cook quickly in a small amount of fat',
  Sear: 'To brown the surface quickly over high heat',
  Simmer: 'To cook in liquid just below boiling point',
  'Sous Vide': 'To cook in temperature-controlled water bath',
  Sweat: 'To cook vegetables in fat over low heat until soft',
  Temper: 'To gradually raise temperature to prevent curdling',
  Truss: 'To tie meat or poultry for even cooking',
  Zest: 'The outer colored part of citrus peel',
  'Mise en Place': 'French for "everything in place" - prepping all ingredients before cooking',
  'Au Jus': 'Served with natural cooking juices',
  'En Papillote': 'Cooked in parchment paper',
  'Al Forno': 'Cooked in the oven',
  'Al Pastor': 'Marinated and cooked on a vertical spit',
  'Cordon Bleu': 'Dish with ham and cheese inside',
  'En Croute': 'Wrapped in pastry',
  'Florentine': 'Prepared with spinach',
  'Meunière': 'Dusted with flour and cooked in butter',
  'Provençal': 'Prepared with tomatoes, garlic, and herbs',
  'Veronique': 'Prepared with grapes',
  'Wiener Schnitzel': 'Breaded and pan-fried cutlet',
  'Beurre Blanc': 'White butter sauce',
  'Beurre Noisette': 'Brown butter',
  'Hollandaise': 'Egg yolk and butter emulsion sauce',
  'Béarnaise': 'Hollandaise with tarragon and shallots',
  'Velouté': 'White sauce made with stock',
  'Béchamel': 'White sauce made with milk',
  'Espagnole': 'Brown sauce base',
  'Demi-Glace': 'Reduced brown sauce',
  'Ganache': 'Chocolate and cream mixture',
  'Sabayon': 'Foamy egg yolk and wine mixture',
  'Coulis': 'Strained fruit or vegetable puree',
  'Gastrique': 'Caramelized sugar with vinegar',
  'Fond': 'The browned bits in a pan after cooking',
  'Fumet': 'Fish stock',
  'Glace': 'Reduced stock to a glaze',
  'Nage': 'Aromatic cooking liquid',
  'Court Bouillon': 'Aromatic poaching liquid',
  'Bouquet Garni': 'Bundle of herbs for flavoring',
  'Sachet d\'Épices': 'Spice bag for flavoring',
  'Mirepoix': 'Diced vegetables for flavor base',
  'Soffritto': 'Italian vegetable base (onion, celery, carrot)',
  'Sofrito': 'Spanish/Latin vegetable base',
  'Trinity': 'Cajun base (onion, celery, bell pepper)',
  'Holy Trinity': 'Indian base (onion, ginger, garlic)',
};

export default function CookingSkills({ onClose }) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [skillLevel, setSkillLevel] = useState('all'); // 'all', 'beginner', 'intermediate', 'advanced'

  const filteredTechniques = Object.entries(COOKING_TECHNIQUES).filter(([_, data]) => 
    skillLevel === 'all' || data.level === skillLevel
  );

  // YouTube embed URL helper - optimized to keep users in app
  // Videos are embedded directly, keeping users on your app!
  // To add video IDs: Find a YouTube video, copy the ID from the URL (after v=)
  // Example: https://www.youtube.com/watch?v=VIDEO_ID_HERE
  const getYouTubeEmbedUrl = (videoId) => {
    if (!videoId || videoId === 'dQw4w9WgXcQ') {
      // Show a message that video will be added
      return null; // Return null to show placeholder instead
    }
    // Embed settings optimized to keep users in-app:
    // - rel=0: Don't show related videos from other channels
    // - modestbranding=1: Minimal YouTube branding
    // - controls=1: Show player controls
    // - playsinline=1: Play inline on mobile
    // - origin: Restrict to your domain (only access window at runtime)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&controls=1&playsinline=1&enablejsapi=1${origin ? `&origin=${origin}` : ''}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 xs:p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                <ChefHat size={28} className="sm:w-8 sm:h-8" />
                Cooking Skills
              </h2>
              <p className="text-orange-100 text-sm sm:text-base">Master techniques from beginner to professional chef</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
              aria-label="Close"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGlossary(false)}
              className={`px-4 py-2 font-semibold text-sm sm:text-base transition-colors flex items-center gap-2 ${
                !showGlossary
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'
              }`}
            >
              <BookOpen size={18} />
              Techniques
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGlossary(true)}
              className={`px-4 py-2 font-semibold text-sm sm:text-base transition-colors ${
                showGlossary
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'
              }`}
            >
              Glossary
            </motion.button>
          </div>

          {/* Skill Level Filter */}
          {!showGlossary && (
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Filter by Skill Level:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Levels', icon: ChefHat },
                  { key: 'beginner', label: 'Beginner', icon: TrendingUp },
                  { key: 'intermediate', label: 'Intermediate', icon: Award },
                  { key: 'advanced', label: 'Advanced', icon: ChefHat },
                ].map(({ key, label, icon: IconComponent }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSkillLevel(key)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                      skillLevel === key
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComponent size={16} />
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Techniques */}
          {!showGlossary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredTechniques.map(([name, data]) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => setSelectedTechnique({ name, ...data })}
                  className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800 cursor-pointer transition-all shadow-md hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex-1">
                      {name}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      data.level === 'beginner' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : data.level === 'intermediate'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {data.level}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {data.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    <Video size={14} />
                    <span>Learn More</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Glossary */}
          {showGlossary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(COOKING_TERMS).map(([term, definition]) => (
                <motion.div
                  key={term}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all"
                >
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1.5">
                    {term}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {definition}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Technique Detail Modal with Embedded Video */}
        <AnimatePresence>
          {selectedTechnique && (
            <>
              <div
                className="fixed inset-0 z-60 bg-black/70"
                onClick={() => setSelectedTechnique(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-70 flex items-center justify-center p-1 sm:p-2 md:p-4"
                onClick={() => setSelectedTechnique(null)}
              >
                <motion.div
                  onClick={e => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 sm:p-4 md:p-6 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl sm:text-2xl font-bold">
                            {selectedTechnique.name}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            selectedTechnique.level === 'beginner' 
                              ? 'bg-green-100 text-green-700'
                              : selectedTechnique.level === 'intermediate'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {selectedTechnique.level}
                          </span>
                        </div>
                        <p className="text-orange-100 text-sm sm:text-base">
                          {selectedTechnique.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedTechnique(null)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
                    {/* Embedded Video - Keeps users in app */}
                    {selectedTechnique.videoId && getYouTubeEmbedUrl(selectedTechnique.videoId) ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-lg border-2 border-orange-200 dark:border-orange-800 min-h-[200px] sm:min-h-[300px]">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedTechnique.videoId)}
                          title={`${selectedTechnique.name} Tutorial - Watch and Learn`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          frameBorder="0"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-semibold z-10">
                          📺 Playing in-app
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center">
                        <div className="text-center p-6">
                          <Video size={48} className="mx-auto mb-4 text-orange-400" />
                          <p className="text-white font-semibold mb-2">Video Tutorial Coming Soon</p>
                          <p className="text-slate-300 text-sm">
                            Video will be embedded here to keep you in the app
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Key Tips */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 sm:p-6 border-2 border-orange-200 dark:border-orange-800">
                      <h4 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <CheckCircle className="text-orange-600 dark:text-orange-400" size={24} />
                        Key Tips
                      </h4>
                      <ul className="space-y-2 sm:space-y-3">
                        {selectedTechnique.tips.map((tip, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle className="text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" size={20} />
                            <span className="flex-1">{tip}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Equipment & Common Mistakes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTechnique.equipment && (
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                          <h5 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-3">
                            Essential Equipment
                          </h5>
                          <ul className="space-y-1.5">
                            {selectedTechnique.equipment.map((item, idx) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                <span className="text-orange-500">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedTechnique.commonMistakes && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 sm:p-5 border-2 border-red-200 dark:border-red-800">
                          <h5 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-3">
                            Common Mistakes to Avoid
                          </h5>
                          <ul className="space-y-1.5">
                            {selectedTechnique.commonMistakes.map((mistake, idx) => (
                              <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="text-red-500">⚠</span>
                                {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTechnique(null)}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-sm sm:text-base shadow-lg"
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-sm sm:text-base shadow-lg"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
