# Recipe Editing Guide

This guide explains how to edit recipes in your "What's 4 Dinner" app - including images, titles, descriptions, and instructions.

## 🎯 Overview

You have **3 main ways** to edit recipes:

1. **Web Interface (Recommended)** - Use the Recipe Editor in Admin Dashboard
2. **Python Script** - Replace images by recipe ID
3. **Direct Database** - For advanced users

---

## 🌐 Method 1: Web Interface (Easiest)

### Access the Recipe Editor

1. Go to your app: `http://localhost:5173/admin` (or your admin URL)
2. Scroll down to the **"Recipe Editor"** section
3. Search for recipes by title
4. Click on a recipe to edit it

### Edit Recipe Title

1. Select a recipe
2. Go to **"Basic Info"** tab
3. Change the title in the text field
4. Click **"Save Title"**

### Edit Recipe Description

1. Select a recipe
2. Go to **"Basic Info"** tab
3. Edit the description in the textarea
4. Click **"Save Description"**

### Edit Recipe Instructions

1. Select a recipe
2. Go to **"Instructions"** tab
3. Edit each step's instruction text
4. Add new steps with **"+ Add Step"**
5. Remove steps with **"Remove"** button
6. Click **"Save All Steps"** when done

### Replace Recipe Image

**Option A: Update Image URL**
1. Select a recipe
2. Go to **"Image"** tab
3. Paste the new image URL
4. Click **"Save URL"**

**Option B: Upload Image File**
1. Select a recipe
2. Go to **"Image"** tab
3. Click **"Choose File"** and select an image
4. Click **"Upload"**

---

## 🐍 Method 2: Python Script (For Bulk Operations)

### Replace Image by Recipe ID

```bash
# Replace with URL
python Database/REPLACE_RECIPE_IMAGE.py <recipe_id> <image_url>

# Replace with local file
python Database/REPLACE_RECIPE_IMAGE.py <recipe_id> Database/downloaded_images/abc123.jpg
```

**Example:**
```bash
python Database/REPLACE_RECIPE_IMAGE.py 004969c0-9f5f-4ec4-a019-31796fe34668 https://example.com/new-image.jpg
```

**What it does:**
- If you provide a URL → Updates recipe with that URL
- If you provide a file path → Uploads file to Supabase storage, then updates recipe
- Shows current recipe title and image before updating
- Confirms success/failure

---

## 🔍 Finding Recipes to Edit

### Search by Title in Web Interface

1. Use the search box in Recipe Editor
2. Type part of the recipe title
3. Click "Search"
4. Browse results and click to edit

### Find Recipe ID from Database

If you need the recipe ID for the Python script:

```sql
-- Search by title
SELECT id, title, hero_image_url 
FROM recipes 
WHERE title ILIKE '%muffin%' 
LIMIT 10;

-- Get recipe by exact title
SELECT id, title 
FROM recipes 
WHERE title = 'Pumpkin Pie Muffins';
```

---

## 📝 Workflow Recommendations

### For Editing Images:

1. **Find incorrect images:**
   - Browse recipes in your app
   - Note recipe IDs with wrong images
   - Or use the Recipe Editor search

2. **Get correct images:**
   - Download from Pexels/Unsplash
   - Or use images you already have
   - Save with recipe ID as filename (e.g., `abc123.jpg`)

3. **Replace images:**
   - **Single recipe:** Use Recipe Editor → Image tab
   - **Multiple recipes:** Use Python script in a loop
   - **Bulk:** Create a CSV with recipe_id, image_url and process

### For Editing Titles:

1. Use Recipe Editor web interface
2. Search for recipe
3. Edit title in "Basic Info" tab
4. Save

### For Editing Instructions:

1. Use Recipe Editor web interface
2. Select recipe
3. Go to "Instructions" tab
4. Edit each step
5. Add/remove steps as needed
6. Save all at once

---

## 🚀 Bulk Editing Tips

### Bulk Image Replacement Script

Create a CSV file `image_replacements.csv`:
```csv
recipe_id,image_url
abc123,https://example.com/image1.jpg
def456,https://example.com/image2.jpg
```

Then create a script:
```python
import csv
from REPLACE_RECIPE_IMAGE import replace_recipe_image

with open('image_replacements.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        replace_recipe_image(row['recipe_id'], row['image_url'])
```

### Bulk Title Updates

For bulk title updates, you'd need to write a custom script or use SQL directly:

```sql
UPDATE recipes 
SET title = 'New Title', updated_at = NOW()
WHERE id = 'recipe-id-here';
```

---

## ⚠️ Important Notes

1. **Always backup** before bulk changes
2. **Test on one recipe** first before bulk operations
3. **Image URLs** should be publicly accessible
4. **File uploads** go to Supabase storage bucket `recipe-images`
5. **Changes are permanent** - be careful!

---

## 🆘 Troubleshooting

### "Recipe not found"
- Check recipe ID is correct (UUID format)
- Verify recipe exists in database

### "Image upload failed"
- Check file exists and is readable
- Verify Supabase credentials in `.env.local`
- Check file size (Supabase has limits)

### "Save failed"
- Check browser console for errors
- Verify you're logged in as admin
- Check network connection

---

## 📚 Related Files

- `src/components/RecipeEditor.jsx` - Web editor component
- `src/api/recipeEditor.js` - API functions
- `Database/REPLACE_RECIPE_IMAGE.py` - Python image replacement script
- `src/pages/AdminDashboard.jsx` - Admin dashboard with Recipe Editor

---

## 💡 Pro Tips

1. **Use Recipe Editor for single edits** - It's visual and easy
2. **Use Python script for bulk image replacements** - Faster for many recipes
3. **Keep a log** of changes you make (recipe ID, what changed, when)
4. **Test changes** in your app after editing to verify they look good
5. **Use search** to find recipes with similar issues (e.g., search "muffin" to find all muffin recipes)

---

## 🎯 Quick Reference

| Task | Method | Location |
|------|--------|----------|
| Edit title | Web Interface | Admin Dashboard → Recipe Editor → Basic Info |
| Edit description | Web Interface | Admin Dashboard → Recipe Editor → Basic Info |
| Edit instructions | Web Interface | Admin Dashboard → Recipe Editor → Instructions |
| Replace image (URL) | Web Interface | Admin Dashboard → Recipe Editor → Image |
| Replace image (file) | Web Interface | Admin Dashboard → Recipe Editor → Image |
| Bulk image replace | Python Script | `Database/REPLACE_RECIPE_IMAGE.py` |
| Find recipe ID | SQL Query | `SELECT id, title FROM recipes WHERE...` |

---

Happy editing! 🎉

