# Feature Dependency Map

This document maps how all features connect and depend on each other. Use this to understand integration points and potential breaking changes.

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Context Layer                          │
├─────────────────────────────────────────────────────────────┤
│  AuthContext  │  FilterContext  │  GroceryListContext       │
│  ToastProvider │  LanguageProvider │  AdminContext           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Features                          │
├─────────────────────────────────────────────────────────────┤
│  Recipe Search  │  Filters  │  Medical Conditions          │
│  Favorites     │  Collections │  Meal Planner              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  localStorage  │  Supabase  │  Payment Providers           │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Feature Dependencies

### 1. Recipe Search System

**Dependencies:**
- `FilterContext` - Provides filter state
- `AuthContext` - Provides user for subscription checks
- `medicalConditions.js` - Filters recipes by medical conditions
- `supabaseRecipes.js` - Fetches recipes from database

**Dependent Features:**
- Recipe Cards
- Recipe Page
- Favorites
- Collections
- Meal Planner
- Grocery List

**Integration Points:**
```javascript
// App.jsx
const filters = useFilters(); // ← FilterContext
const recipes = searchSupabaseRecipes(filters); // ← API
const filtered = filterRecipesByMedicalConditions(recipes); // ← Medical
```

**Breaking Changes:**
- Changing FilterContext structure breaks search
- Changing medicalConditions API breaks filtering
- Changing supabaseRecipes API breaks search

---

### 2. Filter System

**Dependencies:**
- `FilterContext` - Centralized filter state
- `localStorage` - Persists filter preferences

**Dependent Features:**
- Recipe Search
- Medical Conditions (applied after filters)
- Recipe Cards (display filtered results)

**Integration Points:**
```javascript
// FilterContext.jsx
localStorage.setItem('filters:diet', diet); // ← Persistence
// App.jsx
const filters = useFilters(); // ← Usage
```

**Breaking Changes:**
- Changing localStorage keys breaks persistence
- Changing filter structure breaks search
- Removing FilterContext breaks all filters

---

### 3. Medical Conditions System

**Dependencies:**
- `Profile` page - User sets conditions
- `FamilyPlan` page - Family member conditions
- `medicalConditions.js` - Condition definitions
- `FilterContext` - Works with Smart Filters

**Dependent Features:**
- Recipe Search (filters unsafe recipes)
- Recipe Cards (shows warnings)
- Meal Planner (considers conditions)

**Integration Points:**
```javascript
// App.jsx
const medicalData = getActiveMedicalConditions(); // ← Gets user + family
const filtered = filterRecipesByMedicalConditions(recipes); // ← Filters
```

**Breaking Changes:**
- Changing condition structure breaks filtering
- Removing family member support breaks Family Plan
- Changing filter order breaks integration

---

### 4. Subscription System

**Dependencies:**
- `AuthContext` - User authentication
- `Supabase` - Stores subscription data
- `subscription.js` - Plan management
- Payment providers (Paddle, Stripe, Paystack)

**Dependent Features:**
- All premium features
- Ad display
- Feature limits
- Plan upgrades

**Integration Points:**
```javascript
// AuthContext.jsx
window.dispatchEvent('subscriptionPlanChanged'); // ← Plan sync
// subscription.js
const plan = await getCurrentPlan(); // ← Get from Supabase
// App.jsx
canPerformAction('favorite', count); // ← Check limits
```

**Breaking Changes:**
- Changing plan structure breaks limits
- Removing auth sync breaks plan updates
- Changing payment flow breaks upgrades

---

### 5. Grocery List System

**Dependencies:**
- `GroceryListContext` - Centralized state
- `localStorage` - Persists list
- `RecipePage` - Adds ingredients
- `MealPlanner` - Adds from meal plan

**Dependent Features:**
- Recipe Page (add ingredients)
- Meal Planner (generate list)
- Grocery Drawer (display list)

**Integration Points:**
```javascript
// GroceryListContext.jsx
localStorage.setItem('grocery:list:v2', JSON.stringify(items)); // ← Persist
// RecipePage.jsx
const { addMany } = useGroceryList(); // ← Add ingredients
```

**Breaking Changes:**
- Changing localStorage key breaks persistence
- Changing context API breaks integration
- Removing cross-tab sync breaks multi-tab usage

---

### 6. Meal Planner System

**Dependencies:**
- `MealPlanner.jsx` - Main component
- `localStorage` - Stores meal plan
- `RecipePage` - Adds recipes
- `FamilyPlan` - Considers family members
- `GroceryListContext` - Generates grocery list

**Dependent Features:**
- Recipe Page (add to plan)
- Grocery List (generate from plan)
- Family Plan (family size calculations)

**Integration Points:**
```javascript
// MealPlanner.jsx
export function setMealPlanDay(day, meal, recipe); // ← Public API
// RecipePage.jsx
setMealPlanDay(dayIndex, mealType, recipe); // ← Usage
```

**Breaking Changes:**
- Changing meal plan structure breaks data
- Removing setMealPlanDay breaks RecipePage
- Changing localStorage key breaks persistence

---

### 7. Favorites System

**Dependencies:**
- `App.jsx` - Manages favorites state
- `localStorage` - Persists favorites
- `subscription.js` - Checks limits
- `RecipeCard` - Toggle favorite

**Dependent Features:**
- Recipe Cards (favorite button)
- Favorites Page (display favorites)
- Analytics (track favorites)

**Integration Points:**
```javascript
// App.jsx
const [favorites, setFavorites] = useState(...); // ← State
localStorage.setItem('favorites', JSON.stringify(favorites)); // ← Persist
canPerformAction('favorite', favorites.length); // ← Check limits
```

**Breaking Changes:**
- Changing favorites structure breaks data
- Removing limit checks breaks subscription
- Changing localStorage key breaks persistence

---

### 8. Family Plan System

**Dependencies:**
- `FamilyPlan.jsx` - Main component
- `localStorage` - Stores family data
- `medicalConditions.js` - Family member conditions
- `familyCalculations.js` - Family size calculations

**Dependent Features:**
- Recipe Search (filters by family conditions)
- Meal Planner (considers family size)
- Grocery List (calculates for family)

**Integration Points:**
```javascript
// FamilyPlan.jsx
localStorage.setItem('family:members:v1', JSON.stringify(members));
// medicalConditions.js
getActiveMedicalConditions(); // ← Includes family members
```

**Breaking Changes:**
- Changing family structure breaks data
- Removing family support breaks integrations
- Changing localStorage key breaks persistence

---

## 🔄 Data Flow Diagrams

### Search Flow
```
User Input
    │
    ▼
SearchForm
    │
    ▼
App.jsx (fetchRecipes)
    │
    ├─→ FilterContext (get filters)
    ├─→ supabaseRecipes.js (search database)
    └─→ medicalConditions.js (filter unsafe)
    │
    ▼
Recipe Cards (display results)
```

### Filter Flow
```
User Changes Filter
    │
    ▼
Filters Component
    │
    ▼
FilterContext (update state)
    │
    ├─→ localStorage (persist)
    └─→ App.jsx (trigger search)
    │
    ▼
Search Results Update
```

### Medical Conditions Flow
```
User Sets Condition (Profile/FamilyPlan)
    │
    ▼
localStorage (save condition)
    │
    ▼
Search Triggered
    │
    ▼
getActiveMedicalConditions() (get user + family)
    │
    ▼
filterRecipesByMedicalConditions() (filter recipes)
    │
    ▼
Filtered Results Displayed
```

### Subscription Flow
```
User Upgrades
    │
    ▼
Payment Provider (Paddle/Stripe/Paystack)
    │
    ▼
Webhook Updates Supabase
    │
    ▼
AuthContext (detects change)
    │
    ▼
subscriptionPlanChanged Event
    │
    ▼
All Components Update (limits, features)
```

## ⚠️ Critical Integration Points

### 1. FilterContext → Search
**Risk**: High  
**Impact**: Search breaks if FilterContext changes  
**Mitigation**: Keep FilterContext API stable

### 2. Medical Conditions → Search
**Risk**: High  
**Impact**: Unsafe recipes shown if integration breaks  
**Mitigation**: Always apply medical filtering after Smart Filters

### 3. Subscription → All Features
**Risk**: High  
**Impact**: Limits not enforced, features break  
**Mitigation**: Centralize subscription checks in subscription.js

### 4. LocalStorage Keys
**Risk**: Medium  
**Impact**: Data loss if keys change  
**Mitigation**: Version keys (e.g., `v1`, `v2`) and migrate old data

### 5. Context Providers Order
**Risk**: Medium  
**Impact**: Contexts not available if order wrong  
**Mitigation**: Document provider order in main.jsx

## 🔧 Maintenance Guidelines

### When Adding a New Feature:
1. ✅ Identify dependencies
2. ✅ Check integration points
3. ✅ Update this map
4. ✅ Test integration
5. ✅ Document breaking changes

### When Modifying Existing Feature:
1. ✅ Check dependent features
2. ✅ Update integration points
3. ✅ Test all integrations
4. ✅ Update this map
5. ✅ Consider migration if breaking

### When Removing a Feature:
1. ✅ Identify all dependencies
2. ✅ Remove integration points
3. ✅ Clean up unused code
4. ✅ Update this map
5. ✅ Test everything still works

## 📊 Integration Health Check

Run this checklist regularly:

- [ ] All context providers in main.jsx
- [ ] FilterContext used consistently (no direct localStorage)
- [ ] Medical conditions applied after Smart Filters
- [ ] Subscription plan syncs on auth change
- [ ] LocalStorage keys are versioned
- [ ] Cross-tab sync works for shared data
- [ ] Error handling in place for all integrations
- [ ] No circular dependencies
- [ ] All public APIs documented
- [ ] Breaking changes documented

## 🚨 Red Flags

Watch out for these integration issues:

1. **Direct localStorage access** - Should use contexts
2. **Duplicate state** - Same data in multiple places
3. **Missing error handling** - Integration failures crash app
4. **Circular dependencies** - Features depend on each other
5. **Unversioned localStorage** - Data loss on changes
6. **Missing event listeners** - Cross-tab sync breaks
7. **Hardcoded values** - Should use constants/config
8. **Tight coupling** - Features too dependent on each other

## ✅ Best Practices

1. **Use Contexts** - Centralize state management
2. **Version Data** - Use versioned localStorage keys
3. **Event-Driven** - Use events for cross-feature communication
4. **Error Boundaries** - Handle integration failures gracefully
5. **Documentation** - Keep this map updated
6. **Testing** - Test integrations regularly
7. **Migration** - Provide migration paths for breaking changes
8. **Type Safety** - Use TypeScript or PropTypes for APIs

