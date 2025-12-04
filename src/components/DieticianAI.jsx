import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Send, Loader } from 'lucide-react';
import { useToast } from './Toast.jsx';

const STORAGE_KEY = 'dietician:ai:history:v1';

export default function DieticianAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const hasShownWarning = useRef(false);

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
  }, []);

  useEffect(() => {
    saveHistory();
  }, [saveHistory]);

  const loadHistory = () => {
    try {
      // Check if localStorage is available and secure
      if (typeof Storage === 'undefined' || !window.localStorage) {
        throw new Error('localStorage not available');
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (saved.length === 0) {
        // Initial greeting
        setMessages([
          {
            role: 'assistant',
            content:
              "👋 Hello! I'm your AI Dietician assistant. I can help you with:\n\n• Meal planning and nutrition advice\n• Dietary recommendations based on your goals\n• Recipe suggestions for specific dietary needs\n• Understanding nutritional information\n• Creating balanced meal plans\n\nWhat would you like help with today?",
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
    setInput('');
    setLoading(true);

    // Simulate AI response (in production, this would call an actual AI API)
    setTimeout(() => {
      const response = generateAIResponse(userMessage.content);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  const generateAIResponse = userInput => {
    const lowerInput = userInput.toLowerCase();

    // Meal planning
    if (lowerInput.includes('meal plan') || lowerInput.includes('plan meals')) {
      return `Here's a balanced meal plan suggestion for you:

**Breakfast:**
• Oatmeal with berries and nuts (300-400 calories)
• Provides fiber, protein, and antioxidants

**Lunch:**
• Grilled chicken salad with mixed greens (400-500 calories)
• High protein, low carb, rich in vitamins

**Dinner:**
• Baked salmon with quinoa and steamed vegetables (500-600 calories)
• Omega-3 fatty acids, complete protein, complex carbs

**Snacks:**
• Greek yogurt with fruit (150-200 calories)
• Nuts or seeds (100-150 calories)

This provides approximately 1,450-1,850 calories. Adjust portions based on your daily caloric needs and activity level.

Would you like me to create a specific meal plan based on your dietary preferences or goals?`;
    }

    // Weight loss
    if (lowerInput.includes('lose weight') || lowerInput.includes('weight loss')) {
      return `For healthy weight loss, I recommend:

**Key Principles:**
1. **Caloric Deficit**: Aim for 500-750 calories below your maintenance level
2. **High Protein**: 0.8-1g per pound of body weight to preserve muscle
3. **Fiber-Rich Foods**: Vegetables, fruits, whole grains for satiety
4. **Regular Meals**: Don't skip meals - it can slow metabolism

**Foods to Focus On:**
• Lean proteins (chicken, fish, tofu, legumes)
• Non-starchy vegetables (broccoli, spinach, peppers)
• Whole grains in moderation (quinoa, brown rice, oats)
• Healthy fats (avocado, nuts, olive oil)

**Meal Timing:**
• Eat within 1 hour of waking
• Space meals 3-4 hours apart
• Finish eating 2-3 hours before bed

Would you like me to calculate your specific caloric needs based on your stats?`;
    }

    // Protein
    if (lowerInput.includes('protein') || lowerInput.includes('how much protein')) {
      return `Protein recommendations depend on your goals:

**General Health:** 0.8g per kg (0.36g per pound) of body weight
**Active Individuals:** 1.2-1.7g per kg (0.54-0.77g per pound)
**Muscle Building:** 1.6-2.2g per kg (0.73-1g per pound)
**Weight Loss:** 1.2-1.6g per kg (0.54-0.73g per pound)

**High Protein Foods:**
• Chicken breast: ~31g per 100g
• Salmon: ~25g per 100g
• Greek yogurt: ~10g per 100g
• Lentils: ~9g per 100g
• Eggs: ~6g per egg

**Tips:**
• Distribute protein across all meals
• Include protein in snacks
• Combine plant proteins for complete amino acids

What's your current weight and activity level? I can calculate your specific needs!`;
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
          content: "👋 Hello! I'm your AI Dietician assistant. How can I help you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success('History cleared!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            AI Dietician
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Get personalized nutrition advice and meal planning help
          </p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={clearHistory}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <Loader className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me about nutrition, meal planning, or dietary advice..."
              className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 focus:border-purple-500 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Quick Questions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Create a meal plan for weight loss',
            'How much protein do I need?',
            'Vegetarian nutrition tips',
            'Healthy snack ideas',
          ].map(suggestion => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
                setTimeout(() => sendMessage(), 100);
              }}
              className="p-3 text-left rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
