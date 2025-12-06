# Quick Integration Check

Use this quick reference to verify your app is properly integrated.

## 🚀 Quick Start

Run the automated validation:
```bash
npm run validate:integration
```

## ✅ 5-Minute Manual Check

### 1. Context Providers (30 seconds)
Open `src/main.jsx` and verify these providers are present:
- ✅ `AuthProvider`
- ✅ `FilterProvider`
- ✅ `GroceryListProvider`
- ✅ `ToastProvider`
- ✅ `LanguageProvider`

### 2. Filter Integration (1 minute)
1. Open app → Apply filters (diet, time, calories)
2. Refresh page → Filters should persist
3. Open two tabs → Change filters in tab 1 → Tab 2 should update

### 3. Medical Conditions (1 minute)
1. Go to Profile → Add a medical condition (e.g., Diabetes)
2. Search recipes → Unsafe recipes should be filtered out
3. Apply Smart Filters + Medical → Both should work together

### 4. Search & Results (1 minute)
1. Search with filters → Results should match filters
2. Click recipe → Details should load
3. Add to favorites → Should save
4. Add to grocery list → Should add ingredients

### 5. Cross-Feature Integration (1.5 minutes)
1. Favorite a recipe → Go to Favorites page → Should appear
2. Add recipe to meal plan → Go to Meal Planner → Should appear
3. Generate grocery list from meal plan → Should include all ingredients
4. Sign in/out → Subscription plan should update

## 🔍 Common Issues

### Filters Not Persisting
**Check**: `src/context/FilterContext.jsx` - localStorage keys should match
**Fix**: Ensure filters use FilterContext, not direct localStorage

### Medical Conditions Not Filtering
**Check**: `src/App.jsx` - `filterRecipesByMedicalConditions` called after search
**Fix**: Ensure medical filtering happens AFTER Smart Filters

### Grocery List Not Syncing
**Check**: `src/context/GroceryListContext.jsx` - storage event listener present
**Fix**: Ensure cross-tab sync is enabled

### Subscription Not Updating
**Check**: `src/context/AuthContext.jsx` - `subscriptionPlanChanged` event dispatched
**Fix**: Ensure plan syncs on auth state change

## 📋 Integration Checklist

Before deploying, verify:

- [ ] All context providers in main.jsx
- [ ] Filters persist after refresh
- [ ] Medical conditions filter recipes
- [ ] Grocery list syncs across tabs
- [ ] Subscription plan updates on auth change
- [ ] Favorites work across pages
- [ ] Meal planner integrates with recipes
- [ ] No console errors
- [ ] No breaking changes

## 🆘 Need Help?

1. Run `npm run validate:integration` for automated checks
2. See `INTEGRATION_TESTING_GUIDE.md` for detailed testing
3. See `FEATURE_DEPENDENCY_MAP.md` for architecture details

## 🎯 Success Criteria

Your app is properly integrated when:
- ✅ All features work together seamlessly
- ✅ Data persists and syncs correctly
- ✅ No conflicts or breaking changes
- ✅ Error handling works gracefully
- ✅ Performance is acceptable

