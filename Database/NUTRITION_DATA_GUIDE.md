# Nutrition Data Entry Guide for ChatGPT

## ⚠️ CRITICAL: How Nutrition Data Works in This System

### The Problem
When entering nutrition data for recipes, it's easy to get confused about whether values should be **per-serving** or **total for the recipe**. This guide explains exactly how the system works and how to enter data correctly.

---

## 📊 How Nutrition Data is Stored

**Nutrition values in the database are stored as TOTAL for the entire recipe**, NOT per-serving.

### Example: Gluten Free Pumpkin Pie Muffins
- **Recipe:** Makes 12 muffins
- **Nutrition per muffin:** 167 kcal, 4g protein, 10g carbs, 12g fat
- **Nutrition TOTAL (what to store):** 2004 kcal, 48g protein, 120g carbs, 144g fat

---

## 🔄 How the UI Displays Nutrition

The recipe page automatically scales nutrition based on serving size:

1. **Stored value:** TOTAL for recipe (e.g., 2004 kcal for 12 muffins)
2. **When viewing 1 serving:** UI divides by original servings → 2004 ÷ 12 = 167 kcal ✅
3. **When viewing 12 servings:** UI multiplies by ratio → 2004 × (12/12) = 2004 kcal ✅
4. **When viewing 6 servings:** UI multiplies by ratio → 2004 × (6/12) = 1002 kcal ✅

### Formula Used:
```
Displayed Nutrition = (Stored Total Nutrition) × (Target Servings / Original Servings)
```

---

## ✅ Correct Way to Enter Nutrition Data

### Option 1: Enter Per-Serving Values (Recommended)
If you have per-serving nutrition values, **multiply by servings** before saving:

```
Per-serving values:
- Calories: 167 kcal per muffin
- Protein: 4g per muffin
- Carbs: 10g per muffin
- Fat: 12g per muffin

Recipe makes: 12 muffins

Enter in Recipe Editor:
- Calories: 167 × 12 = 2004 kcal
- Protein: 4 × 12 = 48g
- Carbs: 10 × 12 = 120g
- Fat: 12 × 12 = 144g
```

### Option 2: Enter Total Values Directly
If you have total nutrition for the recipe, enter it directly:

```
Total recipe values:
- Calories: 2004 kcal (for all 12 muffins)
- Protein: 48g (for all 12 muffins)
- Carbs: 120g (for all 12 muffins)
- Fat: 144g (for all 12 muffins)

Enter in Recipe Editor:
- Calories: 2004 kcal
- Protein: 48g
- Carbs: 120g
- Fat: 144g
```

---

## 🎯 Quick Reference Table

| Recipe Makes | Per-Serving Value | What to Store (Total) |
|--------------|-------------------|----------------------|
| 12 muffins   | 167 kcal          | 2004 kcal            |
| 12 muffins   | 4g protein        | 48g protein          |
| 12 muffins   | 10g carbs         | 120g carbs           |
| 12 muffins   | 12g fat           | 144g fat             |

---

## ⚠️ Common Mistakes to Avoid

### ❌ WRONG: Storing Per-Serving Values
```
Recipe: 12 muffins
Stored: 167 kcal (per-serving)
Result: When viewing 12 servings, shows 167 × 12 = 2004 kcal ✅
        But when viewing 1 serving, shows 167 × (1/12) = 14 kcal ❌
```

### ✅ CORRECT: Storing Total Values
```
Recipe: 12 muffins
Stored: 2004 kcal (total)
Result: When viewing 12 servings, shows 2004 × (12/12) = 2004 kcal ✅
        When viewing 1 serving, shows 2004 × (1/12) = 167 kcal ✅
```

---

## 🔧 How the Recipe Editor Works

The Recipe Editor **automatically multiplies by servings** when you save nutrition data:

1. You enter per-serving values (e.g., 167 kcal per muffin)
2. Recipe Editor multiplies by servings (167 × 12 = 2004)
3. Database stores total (2004 kcal)
4. UI displays correctly for any serving size

**So you can enter per-serving values in the editor, and it will automatically convert to total!**

---

## 📝 Step-by-Step Instructions for ChatGPT

When helping the user enter nutrition data:

1. **Identify the serving size:**
   - Check the recipe's `servings` field (e.g., "12 muffins")

2. **Get nutrition values:**
   - If you have per-serving values, note them
   - If you have total values, note them

3. **Calculate totals (if needed):**
   - Per-serving × Servings = Total
   - Example: 167 kcal/muffin × 12 muffins = 2004 kcal total

4. **Enter in Recipe Editor:**
   - The editor will automatically handle the conversion
   - But it's safer to enter TOTAL values directly

5. **Verify:**
   - After saving, check the recipe page
   - View 1 serving → should show per-serving values
   - View original servings → should show total values

---

## 🎓 Example Workflow

### Recipe: Gluten Free Pumpkin Pie Muffins
- **Servings:** 12 muffins
- **Per-muffin nutrition:** 167 kcal, 4g protein, 10g carbs, 12g fat

### What to Enter:
```
Calories: 2004 (167 × 12)
Protein: 48 (4 × 12)
Carbs: 120 (10 × 12)
Fat: 144 (12 × 12)
```

### What Users Will See:
- **1 serving:** 167 kcal, 4g protein, 10g carbs, 12g fat ✅
- **12 servings:** 2004 kcal, 48g protein, 120g carbs, 144g fat ✅
- **6 servings:** 1002 kcal, 24g protein, 60g carbs, 72g fat ✅

---

## 🔍 Troubleshooting

### Problem: Nutrition shows incorrectly when viewing different serving sizes

**Check:**
1. Is nutrition stored as TOTAL (not per-serving)?
2. Is the `servings` field correct in the recipe?
3. Are nutrition values multiplied by servings?

**Fix:**
- Re-enter nutrition values as TOTAL for the recipe
- Ensure `servings` field matches the recipe yield

---

## 📚 Summary

- ✅ **Store nutrition as TOTAL for the recipe**
- ✅ **UI automatically scales based on serving size**
- ✅ **Recipe Editor multiplies per-serving values by servings automatically**
- ❌ **Don't store per-serving values directly**
- ❌ **Don't manually divide/multiply in the UI**

---

**Last Updated:** 2024
**System Version:** What's 4 Dinner v1.0

