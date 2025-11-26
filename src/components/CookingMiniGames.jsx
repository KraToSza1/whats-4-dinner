import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Clock, Sparkles } from 'lucide-react';
import { TRIVIA_QUESTIONS } from './trivia-questions.js';

/**
 * Cooking Mini-Games Component
 * Free entertainment while waiting for recipes to cook!
 *
 * Games:
 * 1. 🎯 Food Memory Match - Match food emoji pairs (just icons, no text!)
 * 2. ⏱️ Timer Challenge - Guess cooking times (respects metric system)
 * 3. 🧩 Recipe Trivia - Answer cooking questions (Celsius/Fahrenheit based on unit system)
 * 4. 🍳 Cooking Tap - Tap to cook ingredients (NEW!)
 * 5. 🎨 Color Match - Match colors to ingredients (NEW!)
 */

// Get unit system from localStorage
function getUnitSystem() {
  try {
    return localStorage.getItem('unitSystem') || 'metric';
  } catch {
    return 'metric';
  }
}

// Temperature conversion functions (available if needed)
// function fahrenheitToCelsius(f) {
//   return Math.round((f - 32) * (5 / 9));
// }
// function celsiusToFahrenheit(c) {
//   return Math.round(c * (9 / 5) + 32);
// }

// Game 1: Food Memory Match - JUST EMOJIS!
const FOOD_EMOJIS = [
  { emoji: '🍅', name: 'Tomato' },
  { emoji: '🥕', name: 'Carrot' },
  { emoji: '🧅', name: 'Onion' },
  { emoji: '🥔', name: 'Potato' },
  { emoji: '🥦', name: 'Broccoli' },
  { emoji: '🌶️', name: 'Pepper' },
  { emoji: '🍄', name: 'Mushroom' },
  { emoji: '🥒', name: 'Cucumber' },
  { emoji: '🥬', name: 'Lettuce' },
  { emoji: '🌽', name: 'Corn' },
  { emoji: '🥑', name: 'Avocado' },
  { emoji: '🍆', name: 'Eggplant' },
  { emoji: '🧄', name: 'Garlic' },
  { emoji: '🌿', name: 'Basil' },
  { emoji: '🥩', name: 'Beef' },
  { emoji: '🐔', name: 'Chicken' },
  { emoji: '🐟', name: 'Fish' },
  { emoji: '🦐', name: 'Shrimp' },
  { emoji: '🥚', name: 'Egg' },
  { emoji: '🧀', name: 'Cheese' },
  { emoji: '🥛', name: 'Milk' },
  { emoji: '🧈', name: 'Butter' },
  { emoji: '🍞', name: 'Bread' },
  { emoji: '🍝', name: 'Pasta' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🍔', name: 'Burger' },
  { emoji: '🌮', name: 'Taco' },
  { emoji: '🍰', name: 'Cake' },
  { emoji: '🍪', name: 'Cookie' },
  { emoji: '🥖', name: 'Baguette' },
  { emoji: '🥨', name: 'Pretzel' },
  { emoji: '🥐', name: 'Croissant' },
  { emoji: '🥞', name: 'Pancakes' },
  { emoji: '🧇', name: 'Waffle' },
  { emoji: '🥓', name: 'Bacon' },
  { emoji: '🍖', name: 'Meat' },
  { emoji: '🦴', name: 'Bone' },
  { emoji: '🍗', name: 'Drumstick' },
  { emoji: '🥪', name: 'Sandwich' },
  { emoji: '🌭', name: 'Hot Dog' },
  { emoji: '🍟', name: 'Fries' },
  { emoji: '🍿', name: 'Popcorn' },
  { emoji: '🍩', name: 'Donut' },
  { emoji: '🍫', name: 'Chocolate' },
  { emoji: '🍬', name: 'Candy' },
  { emoji: '🍭', name: 'Lollipop' },
  { emoji: '🍯', name: 'Honey' },
  { emoji: '🥜', name: 'Nuts' },
  { emoji: '🍇', name: 'Grapes' },
  { emoji: '🍈', name: 'Melon' },
  { emoji: '🍉', name: 'Watermelon' },
  { emoji: '🍊', name: 'Orange' },
  { emoji: '🍋', name: 'Lemon' },
  { emoji: '🍌', name: 'Banana' },
  { emoji: '🍍', name: 'Pineapple' },
  { emoji: '🥭', name: 'Mango' },
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🍏', name: 'Green Apple' },
  { emoji: '🍐', name: 'Pear' },
  { emoji: '🍑', name: 'Peach' },
  { emoji: '🍒', name: 'Cherries' },
  { emoji: '🍓', name: 'Strawberry' },
  { emoji: '🥝', name: 'Kiwi' },
  { emoji: '🍅', name: 'Tomato' },
  { emoji: '🥥', name: 'Coconut' },
  { emoji: '🥑', name: 'Avocado' },
  { emoji: '🍆', name: 'Eggplant' },
  { emoji: '🥔', name: 'Potato' },
  { emoji: '🥕', name: 'Carrot' },
  { emoji: '🌽', name: 'Corn' },
  { emoji: '🌶️', name: 'Pepper' },
  { emoji: '🥒', name: 'Cucumber' },
  { emoji: '🥬', name: 'Lettuce' },
  { emoji: '🥦', name: 'Broccoli' },
  { emoji: '🧄', name: 'Garlic' },
  { emoji: '🧅', name: 'Onion' },
  { emoji: '🍄', name: 'Mushroom' },
  { emoji: '🥜', name: 'Peanuts' },
  { emoji: '🌰', name: 'Chestnut' },
  { emoji: '🍞', name: 'Bread' },
  { emoji: '🥐', name: 'Croissant' },
  { emoji: '🥖', name: 'Baguette' },
  { emoji: '🥨', name: 'Pretzel' },
  { emoji: '🥯', name: 'Bagel' },
  { emoji: '🥞', name: 'Pancakes' },
  { emoji: '🧇', name: 'Waffle' },
  { emoji: '🧀', name: 'Cheese' },
  { emoji: '🍖', name: 'Meat' },
  { emoji: '🍗', name: 'Drumstick' },
  { emoji: '🥩', name: 'Steak' },
  { emoji: '🥓', name: 'Bacon' },
  { emoji: '🍔', name: 'Burger' },
  { emoji: '🍟', name: 'Fries' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🌭', name: 'Hot Dog' },
  { emoji: '🥪', name: 'Sandwich' },
  { emoji: '🌮', name: 'Taco' },
  { emoji: '🌯', name: 'Burrito' },
  { emoji: '🥙', name: 'Stuffed Flatbread' },
  { emoji: '🥚', name: 'Egg' },
  { emoji: '🍳', name: 'Fried Egg' },
  { emoji: '🥘', name: 'Shallow Pan' },
  { emoji: '🍲', name: 'Pot of Food' },
  { emoji: '🥣', name: 'Bowl' },
  { emoji: '🥗', name: 'Salad' },
  { emoji: '🍿', name: 'Popcorn' },
  { emoji: '🧈', name: 'Butter' },
  { emoji: '🧂', name: 'Salt' },
  { emoji: '🥫', name: 'Canned Food' },
  { emoji: '🍱', name: 'Bento' },
  { emoji: '🍘', name: 'Rice Cracker' },
  { emoji: '🍙', name: 'Rice Ball' },
  { emoji: '🍚', name: 'Rice' },
  { emoji: '🍛', name: 'Curry' },
  { emoji: '🍜', name: 'Steaming Bowl' },
  { emoji: '🍝', name: 'Spaghetti' },
  { emoji: '🍠', name: 'Roasted Sweet Potato' },
  { emoji: '🍢', name: 'Oden' },
  { emoji: '🍣', name: 'Sushi' },
  { emoji: '🍤', name: 'Fried Shrimp' },
  { emoji: '🍥', name: 'Fish Cake' },
  { emoji: '🥮', name: 'Moon Cake' },
  { emoji: '🍡', name: 'Dango' },
  { emoji: '🥟', name: 'Dumpling' },
  { emoji: '🥠', name: 'Fortune Cookie' },
  { emoji: '🥡', name: 'Takeout Box' },
  { emoji: '🦀', name: 'Crab' },
  { emoji: '🦞', name: 'Lobster' },
  { emoji: '🦐', name: 'Shrimp' },
  { emoji: '🦑', name: 'Squid' },
  { emoji: '🦪', name: 'Oyster' },
  { emoji: '🍦', name: 'Ice Cream' },
  { emoji: '🍧', name: 'Shaved Ice' },
  { emoji: '🍨', name: 'Ice Cream' },
  { emoji: '🍩', name: 'Donut' },
  { emoji: '🍪', name: 'Cookie' },
  { emoji: '🎂', name: 'Birthday Cake' },
  { emoji: '🍰', name: 'Cake' },
  { emoji: '🧁', name: 'Cupcake' },
  { emoji: '🥧', name: 'Pie' },
  { emoji: '🍫', name: 'Chocolate Bar' },
  { emoji: '🍬', name: 'Candy' },
  { emoji: '🍭', name: 'Lollipop' },
  { emoji: '🍮', name: 'Custard' },
  { emoji: '🍯', name: 'Honey' },
  { emoji: '🍼', name: 'Baby Bottle' },
  { emoji: '🥛', name: 'Milk' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🍵', name: 'Tea' },
  { emoji: '🍶', name: 'Sake' },
  { emoji: '🍷', name: 'Wine' },
  { emoji: '🍸', name: 'Cocktail' },
  { emoji: '🍹', name: 'Tropical Drink' },
  { emoji: '🍺', name: 'Beer' },
  { emoji: '🍻', name: 'Beers' },
  { emoji: '🥂', name: 'Cheers' },
  { emoji: '🥃', name: 'Tumbler' },
  { emoji: '🥤', name: 'Cup' },
  { emoji: '🧃', name: 'Beverage Box' },
  { emoji: '🧉', name: 'Mate' },
  { emoji: '🧊', name: 'Ice' },
  { emoji: '🥢', name: 'Chopsticks' },
  { emoji: '🍽️', name: 'Fork and Knife' },
  { emoji: '🍴', name: 'Fork and Knife' },
  { emoji: '🥄', name: 'Spoon' },
  { emoji: '🔪', name: 'Knife' },
  { emoji: '🏺', name: 'Amphora' },
];

// Cooking utensils and tools
const COOKING_ITEMS = [
  { emoji: '🍳', name: 'Pan' },
  { emoji: '🥘', name: 'Shallow Pan' },
  { emoji: '🍲', name: 'Pot' },
  { emoji: '🥣', name: 'Bowl' },
  { emoji: '🔪', name: 'Knife' },
  { emoji: '🥄', name: 'Spoon' },
  { emoji: '🍴', name: 'Fork' },
  { emoji: '🥢', name: 'Chopsticks' },
  { emoji: '🧊', name: 'Ice' },
  { emoji: '🧂', name: 'Salt' },
  { emoji: '🧈', name: 'Butter' },
  { emoji: '🍯', name: 'Honey' },
  { emoji: '🥛', name: 'Milk' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🍵', name: 'Tea' },
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function MemoryMatchGame({ onScoreUpdate }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Mix food emojis and cooking items
    const allItems = [...FOOD_EMOJIS, ...COOKING_ITEMS];
    const selected = shuffleArray(allItems).slice(0, 8);
    const pairs = [...selected, ...selected];
    const shuffled = shuffleArray(pairs);
    setCards(shuffled.map((item, idx) => ({ id: idx, ...item, flipped: false })));
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setMoves(0);
    setGameWon(false);
    setIsChecking(false);
  };

  const handleCardClick = cardId => {
    if (isChecking || flipped.length === 2 || matched.includes(cardId) || flipped.includes(cardId))
      return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [first, second] = newFlipped;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);

      setTimeout(() => {
        if (firstCard.emoji === secondCard.emoji) {
          const newMatched = [...matched, first, second];
          setMatched(newMatched);
          const newScore = score + 10;
          setScore(newScore);
          if (newMatched.length === cards.length) {
            setGameWon(true);
            onScoreUpdate?.(newScore);
          }
        }
        setFlipped([]);
        setIsChecking(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold">🎯 Food Memory Match</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Match the food emojis and cooking items!
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-xs text-slate-500">Moves: {moves}</div>
        </div>
      </div>

      {gameWon ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl"
        >
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-500" />
          <h4 className="text-lg sm:text-xl font-bold mb-2">Perfect Match! 🎊</h4>
          <p className="mb-3 sm:mb-4 text-sm sm:text-base">
            Score: {score} | Moves: {moves}
          </p>
          <button
            onClick={startNewGame}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 text-sm sm:text-base touch-manipulation"
          >
            Play Again
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {cards.map(card => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
            return (
              <motion.button
                key={card.id}
                whileHover={{ scale: isFlipped ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(card.id)}
                disabled={isFlipped || isChecking || flipped.length === 2}
                className={`aspect-square rounded-lg sm:rounded-xl font-semibold text-xl sm:text-2xl md:text-3xl transition-all flex items-center justify-center touch-manipulation ${
                  isFlipped
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                    : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-600 dark:hover:to-slate-500 shadow-md active:scale-95'
                }`}
              >
                {isFlipped ? card.emoji : '?'}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Game 2: Timer Challenge - Fixed and respects metric system
const COOKING_TIMES = [
  { item: 'Hard-boiled egg', time: 10, unit: 'minutes' },
  { item: 'Pasta', time: 12, unit: 'minutes' },
  { item: 'Rice', time: 20, unit: 'minutes' },
  { item: 'Baked potato', time: 45, unit: 'minutes' },
  { item: 'Grilled chicken breast', time: 8, unit: 'minutes' },
  { item: 'Steamed broccoli', time: 5, unit: 'minutes' },
  { item: 'Roasted vegetables', time: 25, unit: 'minutes' },
  { item: 'Scrambled eggs', time: 3, unit: 'minutes' },
  { item: 'Boiled pasta', time: 10, unit: 'minutes' },
  { item: 'Fried egg', time: 3, unit: 'minutes' },
  { item: 'Grilled steak', time: 6, unit: 'minutes' },
  { item: 'Baked salmon', time: 15, unit: 'minutes' },
];

function TimerChallengeGame({ onScoreUpdate }) {
  const [currentItem, setCurrentItem] = useState(null);
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    const random = COOKING_TIMES[Math.floor(Math.random() * COOKING_TIMES.length)];
    setCurrentItem(random);
    setUserGuess('');
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!userGuess || !currentItem) {
      return;
    }

    const guess = parseInt(userGuess);
    if (isNaN(guess) || guess <= 0) {
      return;
    }

    const correct = currentItem.time;
    const difference = Math.abs(guess - correct);
    const percentage = (difference / correct) * 100;

    let points = 0;
    let message = '';

    if (difference === 0) {
      points = 20;
      message = '🎯 Perfect! Exactly right!';
    } else if (percentage <= 10) {
      points = 15;
      message = '🔥 Very close!';
    } else if (percentage <= 25) {
      points = 10;
      message = '👍 Good guess!';
    } else if (percentage <= 50) {
      points = 5;
      message = 'Not bad!';
    } else {
      points = 0;
      message = 'Try again!';
    }

    const newScore = score + points;
    setScore(newScore);
    setFeedback({ correct, userGuess: guess, message, points });
    onScoreUpdate?.(newScore);

    setTimeout(() => {
      setRound(round + 1);
      startNewRound();
    }, 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold">⏱️ Timer Challenge</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Guess the cooking time!
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-xs text-slate-500">Round: {round + 1}</div>
        </div>
      </div>

      {currentItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl text-center border-2 border-blue-200 dark:border-blue-800">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-blue-500" />
            <h4 className="text-lg sm:text-xl font-bold mb-2 break-words">{currentItem.item}</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
              How long does it take to cook this?
            </p>

            {!feedback ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={userGuess}
                    onChange={e => setUserGuess(e.target.value)}
                    placeholder="Enter minutes"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-base sm:text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 touch-manipulation placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        checkAnswer();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={checkAnswer}
                  className="w-full px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md text-sm sm:text-base touch-manipulation"
                >
                  Check Answer
                </button>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-2">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{feedback.message}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Your guess: {feedback.userGuess} min | Correct: {feedback.correct} min
                </div>
                <div className="text-base sm:text-lg font-semibold text-emerald-600">
                  +{feedback.points} points
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Game 3: Recipe Trivia - Now with 200+ questions and no repeats!

function RecipeTriviaGame({ onScoreUpdate }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [unitSystem, setUnitSystem] = useState(getUnitSystem());
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  const loadQuestion = useCallback(() => {
    setUsedQuestions(prev => {
      // If all questions have been used, reset the used set
      if (prev.size >= TRIVIA_QUESTIONS.length) {
        const randomIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
        const random = TRIVIA_QUESTIONS[randomIndex];
        setCurrentQuestion(random);
        setSelectedAnswer(null);
        setShowResult(false);
        return new Set([randomIndex]);
      }

      // Get available questions (not yet used)
      const availableQuestions = TRIVIA_QUESTIONS.filter((_, index) => !prev.has(index));

      // If somehow no questions available, reset
      if (availableQuestions.length === 0) {
        const randomIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
        const random = TRIVIA_QUESTIONS[randomIndex];
        setCurrentQuestion(random);
        setSelectedAnswer(null);
        setShowResult(false);
        return new Set([randomIndex]);
      }

      // Pick a random question from available ones
      const randomAvailable =
        availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

      // Find the original index of this question
      const originalIndex = TRIVIA_QUESTIONS.findIndex(
        q => q.question === randomAvailable.question
      );

      // Mark it as used and set the question
      setCurrentQuestion(randomAvailable);
      setSelectedAnswer(null);
      setShowResult(false);

      return new Set([...prev, originalIndex]);
    });
  }, []);

  // Load initial question only once
  useEffect(() => {
    setUnitSystem(getUnitSystem());
    if (!currentQuestion) {
      loadQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for unit system changes
  useEffect(() => {
    const handleUnitChange = () => {
      setUnitSystem(getUnitSystem());
    };
    window.addEventListener('unitSystemChanged', handleUnitChange);
    return () => window.removeEventListener('unitSystemChanged', handleUnitChange);
  }, []);

  const handleAnswer = useCallback(
    index => {
      if (showResult) return;
      setSelectedAnswer(index);
      setShowResult(true);

      const isCorrect = index === currentQuestion?.correct;
      if (isCorrect) {
        setScore(prevScore => {
          const newScore = prevScore + 15;
          onScoreUpdate?.(newScore);
          return newScore;
        });
      }

      // Wait longer before loading next question - give user time to see result
      setTimeout(() => {
        setRound(prevRound => prevRound + 1);
        loadQuestion();
      }, 3000); // Increased from 2000ms to 3000ms
    },
    [showResult, currentQuestion, onScoreUpdate, loadQuestion]
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold">🧩 Recipe Trivia</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Test your cooking knowledge!
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-xs text-slate-500">Round: {round + 1}</div>
        </div>
      </div>

      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
            <h4 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-center text-slate-900 dark:text-white break-words">
              {currentQuestion.question}
            </h4>
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQuestion.correct;
                let bgColor = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white';

                if (showResult) {
                  if (isCorrect) bgColor = 'bg-emerald-500 text-white';
                  else if (isSelected) bgColor = 'bg-red-500 text-white';
                } else if (isSelected) bgColor = 'bg-blue-500 text-white';

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: showResult ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(idx)}
                    disabled={showResult}
                    className={`w-full p-3 sm:p-4 rounded-lg font-semibold text-left transition-all text-sm sm:text-base touch-manipulation ${bgColor} ${
                      !showResult
                        ? 'hover:bg-blue-100 dark:hover:bg-slate-700 shadow-md active:scale-95'
                        : ''
                    }`}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Game 4: Color Match - NEW FUN GAME!
const COLOR_INGREDIENTS = [
  { color: '🔴', ingredient: '🍅', name: 'Tomato' },
  { color: '🟠', ingredient: '🥕', name: 'Carrot' },
  { color: '🟡', ingredient: '🍌', name: 'Banana' },
  { color: '🟢', ingredient: '🥬', name: 'Lettuce' },
  { color: '🔵', ingredient: '🫐', name: 'Blueberry' },
  { color: '🟣', ingredient: '🍇', name: 'Grape' },
  { color: '⚪', ingredient: '🥛', name: 'Milk' },
  { color: '⚫', ingredient: '🫘', name: 'Bean' },
  { color: '🟤', ingredient: '🥜', name: 'Nuts' },
  { color: '🟥', ingredient: '🍎', name: 'Apple' },
  { color: '🟧', ingredient: '🍊', name: 'Orange' },
  { color: '🟨', ingredient: '🍋', name: 'Lemon' },
  { color: '🟩', ingredient: '🥑', name: 'Avocado' },
  { color: '🟦', ingredient: '🫐', name: 'Blueberry' },
  { color: '🟪', ingredient: '🍆', name: 'Eggplant' },
];

function ColorMatchGame({ onScoreUpdate }) {
  const [currentColor, setCurrentColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadRound();
  }, []);

  const loadRound = () => {
    const random = COLOR_INGREDIENTS[Math.floor(Math.random() * COLOR_INGREDIENTS.length)];
    const wrongOptions = shuffleArray(
      COLOR_INGREDIENTS.filter(c => c.color !== random.color)
    ).slice(0, 3);
    const allOptions = shuffleArray([random, ...wrongOptions]);
    setCurrentColor(random);
    setOptions(allOptions);
    setShowResult(false);
  };

  const handleSelect = selected => {
    if (showResult) return;
    setShowResult(true);

    const isCorrect = selected.color === currentColor.color;
    if (isCorrect) {
      const newScore = score + 20;
      setScore(newScore);
      onScoreUpdate?.(newScore);
    }

    setTimeout(() => {
      setRound(round + 1);
      loadRound();
    }, 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold">🎨 Color Match</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Match the color to the ingredient!
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-xs text-slate-500">Round: {round + 1}</div>
        </div>
      </div>

      {currentColor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800 text-center">
            <div className="text-5xl sm:text-6xl md:text-8xl mb-3 sm:mb-4">
              {currentColor.color}
            </div>
            <h4 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4">
              Which ingredient matches this color?
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {options.map((option, idx) => {
                const isSelected = showResult && option.color === currentColor.color;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: showResult ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(option)}
                    disabled={showResult}
                    className={`p-3 sm:p-4 rounded-lg font-semibold transition-all touch-manipulation ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-pink-100 dark:hover:bg-slate-700 shadow-md active:scale-95'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                      {option.ingredient}
                    </div>
                    <div className="text-xs sm:text-sm">{option.name}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Game 6: Tap the Food - Simple and cute tap game! 🍓
const CUTE_FOODS = [
  '🍓',
  '🍒',
  '🍑',
  '🍊',
  '🍋',
  '🍌',
  '🍉',
  '🍇',
  '🍎',
  '🍏',
  '🥝',
  '🥑',
  '🍅',
  '🥕',
  '🌽',
  '🥒',
  '🥬',
  '🥦',
  '🍄',
  '🥔',
  '🧀',
  '🥚',
  '🥓',
  '🥞',
  '🧇',
  '🥯',
  '🥐',
  '🍞',
  '🥨',
  '🥖',
  '🍕',
  '🌮',
  '🌯',
  '🥙',
  '🍔',
  '🍟',
  '🍗',
  '🥩',
  '🍖',
  '🌭',
  '🍝',
  '🍜',
  '🍲',
  '🍛',
  '🍣',
  '🍱',
  '🍘',
  '🍙',
  '🍚',
  '🍠',
  '🥟',
  '🥠',
  '🥡',
  '🍢',
  '🍡',
  '🍧',
  '🍨',
  '🍦',
  '🥧',
  '🍰',
  '🎂',
  '🍮',
  '🍭',
  '🍬',
  '🍫',
  '🍿',
  '🍩',
  '🍪',
  '🥛',
  '🍼',
];

function TapTheFoodGame({ onScoreUpdate }) {
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'gameover'
  const [foods, setFoods] = useState([]); // Array of {id, emoji, x, y, size}
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('tapFoodHighScore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const startGame = useCallback(() => {
    setGameState('playing');
    setFoods([]);
    setScore(0);
    setTimeLeft(30);
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameover');
    if (score > highScore) {
      const newHighScore = score;
      setHighScore(newHighScore);
      try {
        localStorage.setItem('tapFoodHighScore', newHighScore.toString());
      } catch {
        // Ignore localStorage errors
      }
    }
    onScoreUpdate?.(score);
  }, [score, highScore, onScoreUpdate]);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, endGame]);

  // Spawn food items
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(
      () => {
        setFoods(prev => {
          // Remove old foods (older than 3 seconds)
          const now = Date.now();
          const filtered = prev.filter(food => now - food.spawnTime < 3000);

          // Add new food
          const newFood = {
            id: Date.now() + Math.random(),
            emoji: CUTE_FOODS[Math.floor(Math.random() * CUTE_FOODS.length)],
            x: 10 + Math.random() * 80, // Random X position (10% to 90%)
            y: 10 + Math.random() * 80, // Random Y position (10% to 90%)
            size: 40 + Math.random() * 20, // Random size (40px to 60px)
            spawnTime: now,
          };

          return [...filtered, newFood];
        });
      },
      800 - Math.min(score * 10, 500)
    ); // Spawn faster as score increases

    return () => clearInterval(spawnInterval);
  }, [gameState, score]);

  // Remove foods that are too old
  useEffect(() => {
    if (gameState !== 'playing') return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setFoods(prev => prev.filter(food => now - food.spawnTime < 3000));
    }, 100);

    return () => clearInterval(cleanup);
  }, [gameState]);

  const handleFoodClick = useCallback(
    foodId => {
      if (gameState !== 'playing') return;

      setFoods(prev => {
        const clickedFood = prev.find(f => f.id === foodId);
        if (clickedFood) {
          setScore(currentScore => {
            const newScore = currentScore + 1;
            onScoreUpdate?.(newScore);
            return newScore;
          });
          return prev.filter(f => f.id !== foodId);
        }
        return prev;
      });
    },
    [gameState, onScoreUpdate]
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold">🍓 Tap the Food</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Tap food items before they disappear! Simple and fun! 🎮
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">{score}</div>
          <div className="text-xs text-slate-500">High: {highScore}</div>
          {gameState === 'playing' && (
            <div className="text-xs text-orange-500 font-semibold">Time: {timeLeft}s</div>
          )}
        </div>
      </div>

      <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30 rounded-xl border-2 border-pink-300 dark:border-pink-700 overflow-hidden touch-none">
        {/* Game Overlay */}
        {gameState === 'ready' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"
          >
            <div className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl mx-2 sm:mx-0">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🍓</div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Tap the Food!</h4>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Tap food items as they appear! You have 30 seconds!
              </p>
              <button
                onClick={startGame}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 shadow-lg transition-colors text-sm sm:text-base touch-manipulation"
              >
                Start Game! 🚀
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
          >
            <div className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl mx-2 sm:mx-0">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-500" />
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Time's Up! ⏰</h4>
              <p className="mb-2 text-base sm:text-lg md:text-xl">Final Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="mb-3 sm:mb-4 text-emerald-600 font-bold text-sm sm:text-base">
                  🎉 New High Score!
                </p>
              )}
              <button
                onClick={startGame}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 shadow-lg transition-colors text-sm sm:text-base touch-manipulation"
              >
                Play Again! 🔄
              </button>
            </div>
          </motion.div>
        )}

        {/* Food Items */}
        {gameState === 'playing' && (
          <AnimatePresence>
            {foods.map(food => (
              <motion.button
                key={food.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleFoodClick(food.id)}
                className="absolute cursor-pointer z-20 transition-all hover:drop-shadow-lg touch-manipulation"
                style={{
                  left: `${food.x}%`,
                  top: `${food.y}%`,
                  fontSize: `clamp(24px, ${food.size}px, 60px)`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {food.emoji}
              </motion.button>
            ))}
          </AnimatePresence>
        )}

        {/* Instructions */}
        {gameState === 'playing' && (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md">
            <div className="font-semibold">Score: {score}</div>
            <div className="text-orange-600 dark:text-orange-400">⏱️ {timeLeft}s</div>
          </div>
        )}
      </div>

      <div className="text-[10px] sm:text-xs text-center text-slate-500 px-2">
        💡 Tip: Tap the food items quickly before they disappear! The more you tap, the higher your
        score!
      </div>
    </div>
  );
}

// Main Component
export default function CookingMiniGames({ isOpen, onClose }) {
  const [activeGame, setActiveGame] = useState('memory');
  const [totalScore, setTotalScore] = useState(0);

  const games = [
    { id: 'memory', name: 'Memory Match', icon: '🎯', component: MemoryMatchGame },
    { id: 'timer', name: 'Timer Challenge', icon: '⏱️', component: TimerChallengeGame },
    { id: 'trivia', name: 'Recipe Trivia', icon: '🧩', component: RecipeTriviaGame },
    { id: 'color', name: 'Color Match', icon: '🎨', component: ColorMatchGame },
    { id: 'tapfood', name: 'Tap the Food', icon: '🍓', component: TapTheFoodGame },
  ];

  const handleScoreUpdate = useCallback(newScore => {
    setTotalScore(newScore);
  }, []);

  const ActiveGameComponent = games.find(g => g.id === activeGame)?.component;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                      Cooking Mini-Games
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                      Free entertainment while you cook! 🎮
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500">Total Score</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-600">
                      {totalScore}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Game Tabs - Responsive Grid on Mobile, Flex on Desktop */}
              <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto sm:overflow-x-visible">
                {games.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-semibold whitespace-nowrap transition-all flex-shrink-0 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 ${
                      activeGame === game.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={game.name}
                  >
                    <span className="text-base sm:text-lg">{game.icon}</span>
                    <span className="hidden xs:inline sm:hidden text-[10px]">
                      {game.name.split(' ')[0]}
                    </span>
                    <span className="hidden sm:inline">{game.name}</span>
                  </button>
                ))}
              </div>

              {/* Game Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {ActiveGameComponent && <ActiveGameComponent onScoreUpdate={handleScoreUpdate} />}
              </div>

              {/* Footer */}
              <div className="p-2 sm:p-3 md:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-[10px] sm:text-xs text-center text-slate-500">
                  💡 Tip: Play while waiting for your recipe to cook! All games are completely free.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
