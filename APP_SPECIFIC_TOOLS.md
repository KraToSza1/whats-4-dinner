# App-Specific Tools for "What's 4 Dinner"

## 🎯 Recipe Management Tools

### 1. **Recipe Data Validation** (`npm run validate:recipes`)

Validates all recipes in your database and checks for:

- ✅ Missing images
- ✅ Missing nutrition data
- ✅ Missing ingredients
- ✅ Missing steps
- ✅ Invalid serving sizes
- ✅ Unrealistic nutrition values

**Usage:**

```bash
npm run validate:recipes
```

**Output:** Creates `Database/recipe_validation_report.json` with detailed findings.

---

### 2. **Database Health Check** (`npm run check:db`)

Quick overview of your recipe database:

- Total recipes count
- Recipes with images (percentage)
- Recipes with complete nutrition (percentage)
- Total ingredients and steps
- Recipes by source (csv_import, recipe_editor, etc.)
- Overall health score

**Usage:**

```bash
npm run check:db
```

**Perfect for:** Quick status checks before deployments

---

### 3. **Image Optimization** (`npm run optimize:images`)

Optimizes recipe images for web:

- Resizes to max 1200px width
- Compresses JPEGs to 85% quality
- Maintains visual quality while reducing file size
- Processes all images in `Database/downloaded_images/`
- Saves optimized versions to `Database/optimized_images/`

**Usage:**

```bash
npm run optimize:images
```

**Benefits:**

- Faster page loads
- Reduced storage costs
- Better user experience on mobile

---

## 📊 What These Tools Do

### Recipe Validation Tool

Scans your entire recipe database and identifies:

- Recipes missing critical data (images, nutrition, ingredients, steps)
- Data quality issues (invalid servings, unrealistic nutrition)
- Provides actionable reports for fixing issues

### Database Health Check

Gives you a quick snapshot of:

- How complete your recipe database is
- What percentage of recipes have images
- What percentage have nutrition data
- Overall database health score

### Image Optimization

Automatically optimizes all recipe images:

- Reduces file sizes by 30-70% typically
- Maintains visual quality
- Speeds up your app significantly
- Saves storage space and bandwidth costs

---

## 🚀 Quick Start

1. **Check your database health:**

   ```bash
   npm run check:db
   ```

2. **Validate recipe data:**

   ```bash
   npm run validate:recipes
   ```

3. **Optimize images (after downloading):**
   ```bash
   npm run optimize:images
   ```

---

## 💡 Use Cases

### Before Deploying

```bash
npm run check:db        # Quick health check
npm run validate:recipes # Detailed validation
```

### After Bulk Import

```bash
npm run validate:recipes # Find missing data
npm run optimize:images  # Optimize all images
```

### Regular Maintenance

```bash
npm run check:db        # Weekly health checks
```

---

## 📝 Integration with Existing Workflow

These tools work perfectly with your existing Python scripts:

- **After** `FETCH_RECIPE_IMAGES_PHASE1_DOWNLOAD_FIXED.py` → Run `npm run optimize:images`
- **Before** deploying → Run `npm run check:db` and `npm run validate:recipes`
- **After** bulk recipe imports → Run `npm run validate:recipes`

---

## 🔧 Technical Details

### Image Optimization

- Uses **Sharp** (fast, modern image processing)
- Max width: 1200px (responsive)
- Quality: 85% (excellent balance)
- Format: JPEG (best compression)

### Database Tools

- Uses Supabase client
- Processes in batches (100 recipes at a time)
- Non-destructive (read-only checks)
- Creates detailed JSON reports

---

## 🎉 Benefits

✅ **Faster Development** - Quick checks instead of manual database queries  
✅ **Better Quality** - Catch data issues before users see them  
✅ **Cost Savings** - Optimized images = less storage/bandwidth  
✅ **Better UX** - Faster page loads = happier users  
✅ **Maintainability** - Easy to run regular health checks

---

## 📚 Related Tools

- **Python Scripts** (`Database/` folder) - For bulk operations
- **Recipe Editor** (Admin Dashboard) - For manual editing
- **Image Upload Scripts** - For batch image processing

These Node.js tools complement your Python scripts perfectly!
