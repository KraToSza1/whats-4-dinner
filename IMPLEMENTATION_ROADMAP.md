# 🚀 Premium Features Implementation Roadmap

## Quick Start: Top 5 Most Addictive Features (Implement First)

### 1. 🔥 Cooking Streaks (HIGHEST PRIORITY)
**Impact**: Creates daily habit, loss aversion
**Effort**: 2-3 days
**Files to Create**:
- `src/utils/streaks.js` - Streak tracking logic
- `src/components/StreakCounter.jsx` - Visual streak display
- `src/components/StreakModal.jsx` - Streak celebration modal

**Features**:
- Track consecutive days of recipe views/cooks
- Visual fire animation
- Streak freeze (premium)
- Streak recovery (premium)
- "Don't break your streak!" notifications

---

### 2. 🏆 Achievement Badges System
**Impact**: Visual rewards, progress tracking
**Effort**: 1-2 days
**Files to Create**:
- `src/utils/badges.js` - Badge definitions and logic
- `src/components/BadgeDisplay.jsx` - Badge showcase
- `src/components/BadgeUnlockModal.jsx` - Celebration animation

**Badge Categories**:
- Cooking milestones (10, 50, 100 recipes)
- Streak badges (3, 7, 30, 100 days)
- Cuisine explorer (tried 10 cuisines)
- Speed demon (10 recipes under 30 min)
- Meal prep master (50 prepped meals)

---

### 3. 🎯 Daily Challenges
**Impact**: Daily engagement, habit formation
**Effort**: 2-3 days
**Files to Create**:
- `src/utils/challenges.js` - Challenge definitions
- `src/components/DailyChallenge.jsx` - Challenge card
- `src/components/ChallengeModal.jsx` - Challenge details

**Challenge Types**:
- Cook a recipe under 30 minutes
- Try a new cuisine
- Use 5 ingredients or less
- Make a vegetarian meal
- Meal prep 3+ meals

---

### 4. 📈 XP & Leveling System
**Impact**: Progress tracking, gamification
**Effort**: 1-2 days
**Files to Create**:
- `src/utils/xpSystem.js` - XP calculation and leveling
- `src/components/XPBar.jsx` - Progress bar
- `src/components/LevelUpModal.jsx` - Level up celebration

**XP Sources**:
- View recipe: +5 XP
- Cook recipe: +25 XP
- Rate recipe: +10 XP
- Complete challenge: +50 XP
- Share recipe: +15 XP
- 7-day streak: +100 XP bonus

---

### 5. 📸 Social Sharing & Feed
**Impact**: Viral growth, social proof
**Effort**: 2-3 days
**Files to Create**:
- `src/components/SocialFeed.jsx` - Activity feed
- `src/components/ShareRecipe.jsx` - Enhanced sharing
- `src/utils/social.js` - Social features logic

**Features**:
- Share cooking photos
- Follow other users
- See friends' cooking activity
- "Cooked by" badges on recipes

---

## Phase 2: AI & Personalization (Week 2-3)

### 6. 🤖 AI Recipe Recommendations
**Files**:
- `src/utils/aiRecommendations.js`
- `src/components/RecommendationFeed.jsx`
- `src/components/ForYouSection.jsx`

### 7. 🧠 Smart Meal Planning AI
**Files**:
- `src/utils/aiMealPlanner.js`
- `src/components/SmartMealPlanGenerator.jsx`

### 8. 🔄 Ingredient Substitution AI
**Files**:
- `src/utils/aiSubstitutions.js`
- `src/components/SmartSwaps.jsx` (enhance existing)

---

## Phase 3: Premium Content (Week 4)

### 9. 👑 Exclusive Recipe Collections
**Files**:
- `src/components/PremiumRecipes.jsx`
- `src/utils/premiumContent.js`

### 10. 🎥 Video Tutorials
**Files**:
- `src/components/VideoTutorial.jsx`
- `src/components/RecipeVideoPlayer.jsx`

---

## Code Structure Example

### Streak System Implementation

```javascript
// src/utils/streaks.js
export const STREAK_STORAGE_KEY = 'cooking:streaks:v1';

export function getCurrentStreak() {
  const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
  const lastDate = data.lastDate ? new Date(data.lastDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!lastDate) return 0;
  
  const lastDateOnly = new Date(lastDate);
  lastDateOnly.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return data.streak; // Already counted today
  if (diffDays === 1) return data.streak + 1; // Consecutive day
  return 0; // Streak broken
}

export function updateStreak() {
  const currentStreak = getCurrentStreak();
  const today = new Date();
  
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({
    streak: currentStreak + 1,
    lastDate: today.toISOString(),
    longestStreak: Math.max(currentStreak + 1, getLongestStreak())
  }));
  
  return currentStreak + 1;
}

export function getLongestStreak() {
  const data = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || '{}');
  return data.longestStreak || 0;
}
```

### Badge System Implementation

```javascript
// src/utils/badges.js
export const BADGES = {
  FIRST_RECIPE: {
    id: 'first_recipe',
    name: 'First Timer',
    emoji: '🥇',
    description: 'Cooked your first recipe',
    check: (stats) => stats.recipesCooked >= 1,
    rarity: 'common'
  },
  STREAK_7: {
    id: 'streak_7',
    name: 'On Fire',
    emoji: '🔥',
    description: '7-day cooking streak',
    check: (stats) => stats.currentStreak >= 7,
    rarity: 'rare'
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    emoji: '⚡',
    description: '30-day cooking streak',
    check: (stats) => stats.currentStreak >= 30,
    rarity: 'epic'
  },
  RECIPES_100: {
    id: 'recipes_100',
    name: 'Master Chef',
    emoji: '👨‍🍳',
    description: 'Cooked 100 recipes',
    check: (stats) => stats.recipesCooked >= 100,
    rarity: 'legendary'
  },
  // ... more badges
};

export function checkBadges(stats) {
  const unlocked = JSON.parse(localStorage.getItem('badges:unlocked:v1') || '[]');
  const newBadges = [];
  
  Object.values(BADGES).forEach(badge => {
    if (!unlocked.includes(badge.id) && badge.check(stats)) {
      unlocked.push(badge.id);
      newBadges.push(badge);
    }
  });
  
  if (newBadges.length > 0) {
    localStorage.setItem('badges:unlocked:v1', JSON.stringify(unlocked));
  }
  
  return newBadges;
}
```

### XP System Implementation

```javascript
// src/utils/xpSystem.js
export const XP_VALUES = {
  VIEW_RECIPE: 5,
  COOK_RECIPE: 25,
  RATE_RECIPE: 10,
  COMPLETE_CHALLENGE: 50,
  SHARE_RECIPE: 15,
  STREAK_BONUS_7: 100,
};

export function calculateLevel(xp) {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

export function addXP(amount, reason) {
  const current = getCurrentXP();
  const newXP = current + amount;
  const oldLevel = calculateLevel(current);
  const newLevel = calculateLevel(newXP);
  
  localStorage.setItem('user:xp:v1', newXP.toString());
  
  return {
    newXP,
    levelUp: newLevel > oldLevel,
    newLevel
  };
}
```

---

## UI Components Examples

### Streak Counter Component

```jsx
// src/components/StreakCounter.jsx
import { Flame } from 'lucide-react';
import { getCurrentStreak } from '../utils/streaks';

export default function StreakCounter() {
  const streak = getCurrentStreak();
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white">
      <Flame className="w-4 h-4 animate-pulse" />
      <span className="font-bold">{streak}</span>
      <span className="text-xs opacity-90">day streak</span>
    </div>
  );
}
```

### Badge Display Component

```jsx
// src/components/BadgeDisplay.jsx
import { motion } from 'framer-motion';
import { BADGES } from '../utils/badges';

export default function BadgeDisplay({ badgeId }) {
  const badge = BADGES[badgeId];
  if (!badge) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl"
    >
      <div className="text-4xl">{badge.emoji}</div>
      <div className="font-bold text-white">{badge.name}</div>
      <div className="text-sm text-white/80">{badge.description}</div>
    </motion.div>
  );
}
```

---

## Database Schema (if using backend)

```sql
-- User Stats Table
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY,
  recipes_cooked INT DEFAULT 0,
  recipes_viewed INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  level INT DEFAULT 1,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Streaks Table
CREATE TABLE streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  streak_date DATE NOT NULL,
  streak_count INT NOT NULL,
  UNIQUE(user_id, streak_date)
);

-- Badges Table
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Challenges Table
CREATE TABLE challenges (
  id UUID PRIMARY KEY,
  challenge_type VARCHAR(50) NOT NULL,
  challenge_date DATE NOT NULL,
  description TEXT,
  xp_reward INT DEFAULT 50,
  badge_reward VARCHAR(50),
  UNIQUE(challenge_type, challenge_date)
);

-- User Challenges Table
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  challenge_id UUID REFERENCES challenges(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, challenge_id)
);
```

---

## Integration Points

### 1. Recipe View Page
- Add XP gain on view
- Check for badge unlocks
- Update streak
- Show daily challenge progress

### 2. Recipe Cook Completion
- Add XP gain
- Check for cooking badges
- Update stats
- Show celebration if level up

### 3. Dashboard/Home Page
- Display streak counter
- Show daily challenge
- Display recent badges
- Show XP progress bar

### 4. Profile Page
- Badge showcase
- Stats overview
- Level display
- Achievement progress

---

## Premium Feature Gates

```javascript
// src/utils/premiumGates.js
import { hasFeature } from './subscription';

export function canUseFeature(feature) {
  const premiumFeatures = {
    streak_freeze: 'supporter',
    unlimited_challenges: 'supporter',
    ai_recommendations: 'unlimited',
    exclusive_recipes: 'supporter',
    video_tutorials: 'unlimited',
    advanced_analytics: 'unlimited',
    social_feed: 'supporter',
    custom_recipes: 'unlimited',
  };
  
  const requiredPlan = premiumFeatures[feature];
  if (!requiredPlan) return true; // Free feature
  
  return hasFeature(feature);
}
```

---

## Analytics Events to Track

```javascript
// Track these events for insights
- streak_started
- streak_broken
- badge_unlocked
- level_up
- challenge_completed
- recipe_cooked
- xp_gained
- premium_feature_used
- premium_upgrade_prompt_shown
- premium_upgrade_completed
```

---

## Next Steps

1. **Start with Streaks** - Highest impact, creates daily habit
2. **Add Badges** - Visual rewards, quick to implement
3. **Implement Challenges** - Daily engagement driver
4. **Add XP System** - Progress tracking
5. **Build Social Features** - Viral growth

**Estimated Timeline**: 2-3 weeks for Phase 1 (Top 5 features)

