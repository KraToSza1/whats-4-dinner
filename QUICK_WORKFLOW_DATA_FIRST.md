# Quick Workflow: Data First, Images Later

## Overview
This workflow allows you to work on recipe data (ingredients, instructions, nutrition) first, then bulk upload images later.

## Step-by-Step Process

### 1. Export Incomplete Recipes
1. Go to **Admin Panel** → **Bulk Recipe Editor**
2. ✅ Check **"Only recipes needing review"** (filters recipes without images)
3. Click **"Export Incomplete (ID, Title, Image)"** button
4. CSV file downloads with:
   - **ID**: Recipe UUID (use this to name your image files)
   - **Title**: Recipe name
   - **Current Image URL**: Current image URL or "(no image)"

### 2. Work on Recipe Data
1. Use the exported CSV to identify recipes that need work
2. Copy recipe names and IDs for ChatGPT
3. Use **"Copy First 5 for ChatGPT"** button to get formatted text
4. Paste into ChatGPT and request complete recipe JSON
5. Import JSON via **"Import JSON from ChatGPT"** button in Recipe Editor
6. Repeat for all recipes

### 3. Prepare Images
1. Generate or collect images for your recipes
2. **Name each image file with the recipe ID**:
   - Example: Recipe ID `abc123-def456-ghi789` → File: `abc123-def456-ghi789.jpg`
3. Ensure images are:
   - JPEG format (`.jpg` or `.jpeg`)
   - ≤100KB file size
   - 1024×1024 resolution
   - Optimized for web

### 4. Bulk Upload Images
Choose one method:

**Option A: Supabase Dashboard** (Easiest)
- Go to Supabase Dashboard → Storage → `recipe-images` bucket
- Upload files (drag & drop or click upload)
- Files automatically use the filename you provide

**Option B: Supabase CLI** (Best for large batches)
```bash
cd path/to/recipe-images
supabase storage upload recipe-images . --recursive
```

**Option C: Script** (Most flexible)
- See `BULK_IMAGE_UPLOAD_GUIDE.md` for Python/Node.js scripts

### 5. Verify Images
- Images will automatically appear in recipes once uploaded
- The system looks for files named `{recipe-id}.jpg` in the `recipe-images` bucket
- No need to update database records manually

## File Naming Convention

**Critical**: The image filename MUST match the recipe ID exactly!

- ✅ Correct: `abc123-def456-ghi789.jpg`
- ❌ Wrong: `recipe-abc123.jpg`
- ❌ Wrong: `abc123.jpg` (if recipe ID is longer)

## Tips

1. **Work in batches**: Export 10-20 recipes at a time
2. **Use the filter**: Always check "Only recipes needing review" to focus on incomplete recipes
3. **Double-check IDs**: Make sure image filenames match recipe IDs exactly
4. **Test one first**: Upload one image and verify it appears before bulk uploading
5. **Keep backups**: Save your exported CSV files for reference

## Troubleshooting

**Images not showing?**
- Check filename matches recipe ID exactly (including extension)
- Verify file is in `recipe-images` bucket
- Check file format is JPEG
- Clear browser cache

**Export shows wrong recipes?**
- Make sure "Only recipes needing review" is checked
- Refresh the page and try again

## Related Documents

- `BULK_IMAGE_UPLOAD_GUIDE.md` - Detailed bulk upload methods
- `FULL_RECIPE_GENERATION_FOR_CHATGPT.md` - ChatGPT JSON format
- `CHATGPT_WORKFLOW.md` - Step-by-step ChatGPT workflow

