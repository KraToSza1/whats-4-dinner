import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Video, CheckCircle } from 'lucide-react';

const COOKING_TECHNIQUES = {
  'Knife Skills': {
    description: 'Master the art of cutting, dicing, and chopping',
    tips: [
      'Hold the knife with a firm grip, thumb and index finger on the blade',
      'Use a rocking motion for chopping',
      'Keep your fingers curled under when cutting',
      "Use a sharp knife - it's safer than a dull one",
      'Practice makes perfect - start slow and build speed',
    ],
    video: 'https://www.youtube.com/results?search_query=knife+skills+basics',
  },
  Sautéing: {
    description: 'Quick cooking in a small amount of fat over high heat',
    tips: [
      'Heat the pan before adding oil',
      "Don't overcrowd the pan",
      'Keep ingredients moving',
      'Use high heat for quick cooking',
      'Add aromatics (garlic, onions) last to prevent burning',
    ],
    video: 'https://www.youtube.com/results?search_query=how+to+saute',
  },
  Roasting: {
    description: 'Dry-heat cooking method using an oven',
    tips: [
      'Preheat your oven',
      'Use high heat (400°F+) for crispy exteriors',
      "Don't overcrowd the pan",
      'Let meat rest after roasting',
      'Use a meat thermometer for perfect doneness',
    ],
    video: 'https://www.youtube.com/results?search_query=roasting+techniques',
  },
  Braising: {
    description: 'Slow cooking in liquid at low heat',
    tips: [
      'Sear meat first for better flavor',
      'Use enough liquid to cover halfway',
      'Cook low and slow',
      'Check liquid levels periodically',
      'Meat should be fork-tender when done',
    ],
    video: 'https://www.youtube.com/results?search_query=braising+technique',
  },
  Grilling: {
    description: 'Cooking over direct heat',
    tips: [
      'Preheat the grill for 10-15 minutes',
      'Clean and oil the grates',
      "Don't flip too often",
      'Use a meat thermometer',
      'Let meat rest before cutting',
    ],
    video: 'https://www.youtube.com/results?search_query=grilling+basics',
  },
  Baking: {
    description: 'Cooking in an oven using dry heat',
    tips: [
      'Preheat the oven',
      'Measure ingredients accurately',
      "Don't open the oven door too often",
      'Use the right pan size',
      'Check for doneness with a toothpick or thermometer',
    ],
    video: 'https://www.youtube.com/results?search_query=baking+basics',
  },
  Steaming: {
    description: 'Cooking with steam from boiling water',
    tips: [
      'Keep water boiling throughout',
      "Don't let water touch the food",
      'Cover tightly to trap steam',
      'Check water levels',
      'Perfect for vegetables and fish',
    ],
    video: 'https://www.youtube.com/results?search_query=steaming+technique',
  },
  Poaching: {
    description: 'Gentle cooking in liquid below boiling point',
    tips: [
      'Use a wide, shallow pan',
      'Liquid should be just below boiling',
      "Don't let liquid boil",
      'Perfect for eggs and delicate fish',
      'Add vinegar to water for poached eggs',
    ],
    video: 'https://www.youtube.com/results?search_query=poaching+technique',
  },
};

const COOKING_TERMS = {
  'Al Dente': "Pasta cooked until it's still firm to the bite",
  Baste: 'To spoon, brush, or pour liquid over food while cooking',
  Blanch: 'To briefly cook in boiling water, then plunge into ice water',
  Caramelize: 'To cook until sugars turn brown and develop flavor',
  Deglaze: 'To add liquid to a pan to loosen browned bits',
  Emulsify: "To combine two liquids that don't normally mix (like oil and vinegar)",
  Julienne: 'To cut into thin matchstick-sized strips',
  Mince: 'To cut into very small pieces',
  Sauté: 'To cook quickly in a small amount of fat',
  Sear: 'To brown the surface quickly over high heat',
  Simmer: 'To cook in liquid just below boiling point',
  Zest: 'The outer colored part of citrus peel',
};

export default function CookingSkills({ onClose }) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">👨‍🍳 Cooking Skills</h2>
              <p className="text-orange-100 text-sm">Learn essential cooking techniques</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGlossary(false)}
              className={`px-4 py-2 font-semibold transition-colors ${
                !showGlossary
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="inline mr-2" size={16} />
              Techniques
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGlossary(true)}
              className={`px-4 py-2 font-semibold transition-colors ${
                showGlossary
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Glossary
            </motion.button>
          </div>

          {/* Techniques */}
          {!showGlossary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(COOKING_TECHNIQUES).map(([name, data]) => (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTechnique({ name, ...data })}
                  className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800 cursor-pointer transition-all"
                >
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {data.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Video size={14} />
                    <span>Click to learn more</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Glossary */}
          {showGlossary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(COOKING_TERMS).map(([term, definition]) => (
                <motion.div
                  key={term}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{term}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{definition}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Technique Detail Modal */}
        <AnimatePresence>
          {selectedTechnique && (
            <>
              <div
                className="fixed inset-0 z-60 bg-black/50"
                onClick={() => setSelectedTechnique(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-70 flex items-center justify-center p-4"
                onClick={() => setSelectedTechnique(null)}
              >
                <motion.div
                  onClick={e => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedTechnique.name}
                    </h3>
                    <button
                      onClick={() => setSelectedTechnique(null)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {selectedTechnique.description}
                  </p>
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Key Tips:</h4>
                    {selectedTechnique.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                  <a
                    href={selectedTechnique.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold"
                  >
                    <Video size={18} />
                    Watch Video Tutorial
                  </a>
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
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
