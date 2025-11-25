# Bulk Image Upload Guide for Supabase Storage

## Overview
This guide explains how to bulk upload images to Supabase Storage for your recipes. This allows you to work on recipe data first, then upload all images at once.

## Current Image Storage Structure

- **Storage Bucket**: `recipe-images`
- **File Naming**: Images are stored with the recipe ID as the filename
  - Format: `{recipe-id}.jpg` or `{recipe-id}.jpeg`
  - Example: `abc123-def456-ghi789.jpg`
- **File Requirements**:
  - Format: JPEG (`.jpg` or `.jpeg`)
  - Size: ≤100KB (for PWA performance)
  - Resolution: 1024×1024 pixels
  - Style: Pinterest-style, soft natural lighting, food-only content

## Workflow: Data First, Images Later

### Step 1: Export Incomplete Recipes
1. Go to **Bulk Recipe Editor** in your admin panel
2. Check **"Only recipes needing review"** to filter recipes without images
3. Click **"Export Incomplete (ID, Title, Image)"** button
4. This downloads a CSV with:
   - `ID`: Recipe UUID
   - `Title`: Recipe name
   - `Current Image URL`: Current image URL (or "(no image)")

### Step 2: Work on Recipe Data
- Use the exported CSV to work with ChatGPT on generating complete recipe data
- Import JSON data for ingredients, instructions, nutrition, etc.
- Images can be added later in bulk

### Step 3: Prepare Images for Bulk Upload
1. **Organize your images**:
   - Name each image file with the recipe ID: `{recipe-id}.jpg`
   - Example: If recipe ID is `abc123-def456-ghi789`, name the file `abc123-def456-ghi789.jpg`
   - Ensure all images are:
     - JPEG format (`.jpg` or `.jpeg`)
     - ≤100KB file size
     - 1024×1024 resolution
     - Optimized for web

2. **Create a folder structure** (optional but recommended):
   ```
   recipe-images/
   ├── abc123-def456-ghi789.jpg
   ├── def456-ghi789-jkl012.jpg
   ├── ghi789-jkl012-mno345.jpg
   └── ...
   ```

## Bulk Upload Methods

### Method 1: Supabase Dashboard (Easiest for Small Batches)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **recipe-images** bucket
3. Click **"Upload file"** or drag and drop
4. Upload multiple files at once (browser will handle multiple files)
5. Files will automatically use the filename you provide (recipe ID)

**Pros**: Easy, visual, no coding required  
**Cons**: Limited to browser upload limits, slower for many files

### Method 2: Supabase CLI (Best for Large Batches)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Upload images in bulk**:
   ```bash
   # Navigate to folder with your images
   cd path/to/recipe-images
   
   # Upload all images to the bucket
   supabase storage upload recipe-images . --recursive
   ```
   
   Or upload individual files:
   ```bash
   supabase storage upload recipe-images abc123-def456-ghi789.jpg
   ```

**Pros**: Fast, handles large batches, scriptable  
**Cons**: Requires CLI setup

### Method 3: Python Script (Most Flexible)

Create a script to upload images programmatically:

```python
import os
from supabase import create_client, Client

# Initialize Supabase client
url = "YOUR_SUPABASE_URL"
key = "YOUR_SUPABASE_ANON_KEY"  # Use service_role key for admin operations
supabase: Client = create_client(url, key)

# Folder containing your images
images_folder = "./recipe-images"

# Upload all images
for filename in os.listdir(images_folder):
    if filename.endswith(('.jpg', '.jpeg')):
        file_path = os.path.join(images_folder, filename)
        recipe_id = os.path.splitext(filename)[0]  # Get recipe ID from filename
        
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload to Supabase Storage
        try:
            supabase.storage.from('recipe-images').upload(
                filename,  # Use recipe ID as filename
                file_data,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            print(f"✅ Uploaded: {filename}")
        except Exception as e:
            print(f"❌ Error uploading {filename}: {e}")
```

**Pros**: Most control, can add validation, error handling  
**Cons**: Requires Python and Supabase Python client

### Method 4: Node.js Script (JavaScript/TypeScript)

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Use service_role for admin
const supabase = createClient(supabaseUrl, supabaseKey);

const imagesFolder = './recipe-images';

// Read all image files
const files = fs.readdirSync(imagesFolder).filter(f => 
  f.endsWith('.jpg') || f.endsWith('.jpeg')
);

// Upload each image
for (const filename of files) {
  const filePath = path.join(imagesFolder, filename);
  const fileBuffer = fs.readFileSync(filePath);
  
  try {
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true, // Override existing files
      });
    
    if (error) {
      console.error(`❌ Error uploading ${filename}:`, error);
    } else {
      console.log(`✅ Uploaded: ${filename}`);
    }
  } catch (err) {
    console.error(`❌ Exception uploading ${filename}:`, err);
  }
}
```

## After Uploading Images

### Update Recipe Records (Optional)
If you've uploaded images but the recipe records don't have the `hero_image_url` set, you can update them:

**Via SQL in Supabase Dashboard**:
```sql
-- Update all recipes with their image URLs
UPDATE recipes
SET hero_image_url = CONCAT(
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/recipe-images/',
  id,
  '.jpg'
)
WHERE hero_image_url IS NULL OR hero_image_url = '';
```

**Or via the Recipe Editor**:
- The system will automatically detect images in storage when you view/edit recipes
- Images are automatically linked when you upload via the UI

## Important Notes

1. **File Naming**: The filename MUST match the recipe ID exactly (including the file extension)
2. **File Format**: Only JPEG files (`.jpg` or `.jpeg`) are supported
3. **File Size**: Keep images ≤100KB for optimal PWA performance
4. **Overwriting**: Using `upsert: true` will overwrite existing images with the same name
5. **Permissions**: Make sure your storage bucket has public read access for images to display

## Troubleshooting

### Images not showing after upload
1. Check that the filename matches the recipe ID exactly
2. Verify the file is in the `recipe-images` bucket
3. Check bucket permissions (should be public read)
4. Clear browser cache or add cache-busting parameter

### Upload errors
1. Check file size (must be ≤100KB)
2. Verify file format (must be JPEG)
3. Check Supabase storage quota
4. Verify API keys have proper permissions

## Quick Reference

- **Bucket Name**: `recipe-images`
- **File Naming**: `{recipe-id}.jpg`
- **Max File Size**: 100KB
- **Format**: JPEG only
- **Resolution**: 1024×1024 recommended
- **Public URL Format**: `https://{project}.supabase.co/storage/v1/object/public/recipe-images/{recipe-id}.jpg`

