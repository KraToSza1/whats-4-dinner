# Integration Testing Guide

## Overview

This guide helps you systematically test that all features in the app work together correctly. Follow this checklist to ensure everything synchronizes properly without breaking.

## 🎯 Testing Strategy

### Phase 1: Core Integration Points

#### 1. Context Providers Integration
- [ ] **FilterContext**: Verify filters persist across page navigation
- [ ] **AuthContext**: Verify auth state syncs with subscription plan
- [ ] **GroceryListContext**: Verify grocery list persists and syncs across tabs
- [ ] **ToastProvider**: Verify toasts work from all contexts
- [ ] **LanguageProvider**: Verify language changes persist

**How to Test:**
1. Open app in two browser tabs
2. Change filters in tab 1 → verify tab 2 updates
3. Add items to grocery list in tab 1 → verify tab 2 updates
4. Sign in/out → verify subscription plan updates

#### 2. Filter System Integration
- [ ] **Smart Filters + Medical Conditions**: Verify they work together
- [ ] **Filter Persistence**: Verify filters persist after page refresh
- [ ] **Filter Reset**: Verify reset clears all filters correctly
- [ ] **Filter Count**: Verify active filter count is accurate

**How to Test:**
1. Apply multiple filters (diet, time, calories, etc.)
2. Add medical condition in Profile
3. Search → verify results respect both Smart Filters AND medical conditions
4. Refresh page → verify filters persist
5. Reset filters → verify all cleared

#### 3. Search & Recipe Integration
- [ ] **Search with Filters**: Verify filters apply to search results
- [ ] **Medical Filtering**: Verify unsafe recipes are filtered out
- [ ] **Pagination**: Verify pagination works with filtered results
- [ ] **Recipe Details**: Verify recipe page loads correctly

**How to Test:**
1. Apply filters → search → verify results match filters
2. Add medical condition → search → verify unsafe recipes removed
3. Navigate through pages → verify pagination works
4. Click recipe → verify details load correctly

### Phase 2: Feature Cross-Integration

#### 4. Recipe Features Integration
- [ ] **Favorites**: Verify favorites sync across pages
- [ ] **Grocery List**: Verify "Add to Grocery List" works from recipe page
- [ ] **Meal Planner**: Verify "Add to Meal Plan" works from recipe page
- [ ] **Collections**: Verify recipes can be added to collections
- [ ] **Notes**: Verify recipe notes persist

**How to Test:**
1. Favorite a recipe → go to Favorites page → verify it's there
2. Open recipe → click "Add to Grocery List" → verify items added
3. Open recipe → click "Add to Meal Plan" → verify meal planner updated
4. Add recipe to collection → verify it appears in Collections

#### 5. Subscription & Limits Integration
- [ ] **Free Plan Limits**: Verify limits enforced correctly
- [ ] **Premium Features**: Verify premium features unlock with upgrade
- [ ] **Plan Changes**: Verify plan changes reflect immediately
- [ ] **Trial**: Verify trial activates on signup

**How to Test:**
1. Sign in as free user → verify limits enforced
2. Upgrade to premium → verify features unlock
3. Change plan → verify changes reflect immediately
4. Sign up new user → verify trial activates

#### 6. Family Plan Integration
- [ ] **Family Members**: Verify family members sync with medical conditions
- [ ] **Meal Planning**: Verify meal planner considers family members
- [ ] **Medical Conditions**: Verify family member conditions filter recipes
- [ ] **Grocery List**: Verify grocery list calculates for family size

**How to Test:**
1. Add family member with medical condition
2. Search recipes → verify family member conditions applied
3. Add recipe to meal plan → verify family size considered
4. Generate grocery list → verify quantities match family size

### Phase 3: Data Synchronization

#### 7. LocalStorage Synchronization
- [ ] **Cross-Tab Sync**: Verify changes sync across tabs
- [ ] **Data Persistence**: Verify data persists after refresh
- [ ] **Version Migration**: Verify old data migrates correctly

**How to Test:**
1. Open app in two tabs
2. Make changes in tab 1 → verify tab 2 updates
3. Refresh page → verify data persists
4. Clear localStorage → verify app handles gracefully

#### 8. Supabase Synchronization
- [ ] **Auth State**: Verify auth state syncs with Supabase
- [ ] **Subscription Plan**: Verify plan syncs with Supabase
- [ ] **User Data**: Verify user data syncs correctly

**How to Test:**
1. Sign in → verify user data loads from Supabase
2. Update subscription → verify Supabase updated
3. Sign out → verify data cleared

### Phase 4: Edge Cases & Error Handling

#### 9. Error Scenarios
- [ ] **Network Errors**: Verify graceful handling of network failures
- [ ] **Invalid Data**: Verify app handles invalid data gracefully
- [ ] **Missing Data**: Verify app handles missing data gracefully
- [ ] **Concurrent Updates**: Verify concurrent updates don't conflict

**How to Test:**
1. Disable network → verify error messages shown
2. Manually corrupt localStorage → verify app recovers
3. Delete data from Supabase → verify app handles gracefully
4. Make rapid changes → verify no conflicts

#### 10. Performance & Optimization
- [ ] **Filter Debouncing**: Verify filters don't trigger excessive searches
- [ ] **Lazy Loading**: Verify components load efficiently
- [ ] **Cache Management**: Verify cache works correctly

**How to Test:**
1. Rapidly change filters → verify debouncing works
2. Navigate pages → verify lazy loading works
3. Check network tab → verify caching works

## 🔧 Automated Testing

Run the integration validation script:

```bash
node scripts/validate-integration.js
```

This script checks:
- Context providers are properly connected
- Data flows correctly between features
- localStorage keys are consistent
- Medical conditions integrate with filters
- Subscription system integrates properly
- All required imports are present

## 📋 Manual Testing Checklist

### Quick Smoke Test (5 minutes)
1. [ ] Open app → verify loads without errors
2. [ ] Search recipes → verify results appear
3. [ ] Apply filters → verify results update
4. [ ] Click recipe → verify details load
5. [ ] Add to favorites → verify saved
6. [ ] Add to grocery list → verify added
7. [ ] Sign in/out → verify auth works

### Full Integration Test (30 minutes)
Follow all Phase 1-4 tests above systematically.

### Regression Test (15 minutes)
After making changes, test:
1. [ ] All existing features still work
2. [ ] No new errors in console
3. [ ] Performance hasn't degraded
4. [ ] Data persists correctly

## 🚨 Common Issues & Solutions

### Issue: Filters not persisting
**Solution**: Check FilterContext is properly provided in main.jsx

### Issue: Medical conditions not filtering
**Solution**: Verify `filterRecipesByMedicalConditions` is called after Smart Filters

### Issue: Grocery list not syncing
**Solution**: Check GroceryListContext has cross-tab sync enabled

### Issue: Subscription plan not updating
**Solution**: Verify `subscriptionPlanChanged` event is dispatched

### Issue: Data conflicts between tabs
**Solution**: Check localStorage event listeners are properly set up

## 📊 Testing Results Template

```
Date: ___________
Tester: ___________

Phase 1: Core Integration
- Context Providers: [ ] Pass [ ] Fail
- Filter System: [ ] Pass [ ] Fail
- Search & Recipe: [ ] Pass [ ] Fail

Phase 2: Feature Cross-Integration
- Recipe Features: [ ] Pass [ ] Fail
- Subscription & Limits: [ ] Pass [ ] Fail
- Family Plan: [ ] Pass [ ] Fail

Phase 3: Data Synchronization
- LocalStorage: [ ] Pass [ ] Fail
- Supabase: [ ] Pass [ ] Fail

Phase 4: Edge Cases
- Error Handling: [ ] Pass [ ] Fail
- Performance: [ ] Pass [ ] Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

## ✅ Success Criteria

All features are considered integrated correctly when:
1. ✅ All context providers work together
2. ✅ Data flows correctly between features
3. ✅ Filters, medical conditions, and search work together
4. ✅ Data persists and syncs correctly
5. ✅ No breaking changes or conflicts
6. ✅ Error handling works gracefully
7. ✅ Performance is acceptable

## 🔄 Continuous Integration

Run validation before:
- Committing code
- Creating pull requests
- Deploying to production

Add to your workflow:
```bash
npm run validate:integration  # (if you add this script)
```

