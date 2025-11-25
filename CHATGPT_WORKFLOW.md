# ChatGPT Recipe Generation Workflow

## Quick Start

1. **Export recipe list** from Bulk Editor (recipes without images)
2. **Send to ChatGPT**: Recipe name + ID (one at a time, or batch of 5)
3. **ChatGPT generates**: Complete JSON + 1024×1024 image
4. **You import**: JSON into Recipe Editor
5. **Done**: Recipe is complete!

---

## Step-by-Step Process

### Step 1: Get Recipes That Need Work

1. Go to `/admin` → Recipe Editor → Bulk Editor
2. Make sure "Only recipes needing review" is checked ✅
3. You'll see recipes without images (these need full generation)

### Step 2: Send to ChatGPT

**Format:**
```
Recipe Name: [Recipe Title]
Recipe ID: [UUID]

Please generate the complete recipe with all ingredients, instructions, nutrition (per serving), tags, image prompt, and 1024×1024 image.
```

**Example:**
```
Recipe Name: Low Fat Chicken and Avocado Quesadillas
Recipe ID: de0aba1e-6bb6-4162-9bfd-c9f9351194a6

Please generate the complete recipe with all ingredients, instructions, nutrition (per serving), tags, image prompt, and 1024×1024 image.
```

**Batch Processing (5 at a time):**
```
Recipe 1:
Name: [Title]
ID: [UUID]

Recipe 2:
Name: [Title]
ID: [UUID]

... (up to 5 recipes)

Please generate complete recipes for all 5 with JSON + images.
```

### Step 3: Receive from ChatGPT

ChatGPT will return:
- **JSON object** with complete recipe data
- **1024×1024 image** file

### Step 4: Import into Recipe Editor

1. Copy the JSON from ChatGPT
2. Go to `/admin` → Recipe Editor
3. Find the recipe by ID (or create new if needed)
4. Paste JSON data into appropriate fields:
   - Title, Description, Times, Servings, Difficulty
   - Ingredients (paste as JSON array)
   - Instructions (paste as JSON array)
   - Nutrition (paste as JSON object)
   - Tags (cuisine, meal types, diets)
   - Image prompt
5. Upload the 1024×1024 image
6. Click "Save All Changes"
7. ✅ Done!

---

## What ChatGPT Needs

Send ChatGPT this document: **`FULL_RECIPE_GENERATION_FOR_CHATGPT.md`**

This document contains:
- ✅ Complete database schema
- ✅ Exact JSON format required
- ✅ Field-by-field requirements
- ✅ Examples and templates
- ✅ Quality standards
- ✅ Common mistakes to avoid

---

## Tips for Faster Processing

1. **Batch Processing**: Send 5 recipes at once (ChatGPT can handle it)
2. **Clear Format**: Use the exact format shown above
3. **Reference Document**: Always reference `FULL_RECIPE_GENERATION_FOR_CHATGPT.md`
4. **Verify Before Import**: Check JSON structure before pasting
5. **Image Quality**: Ensure images are exactly 1024×1024

---

## Troubleshooting

**Problem**: ChatGPT returns incomplete data
- **Solution**: Reference the full guide document, ask for missing fields

**Problem**: Nutrition values seem wrong
- **Solution**: Remind ChatGPT that nutrition must be PER SERVING (system scales automatically)

**Problem**: Image doesn't match recipe
- **Solution**: Ask ChatGPT to regenerate image matching the prompt exactly

**Problem**: Ingredients/instructions missing
- **Solution**: Ask ChatGPT to include ALL ingredients and steps, no shortcuts

---

## Success Checklist

Before importing, verify ChatGPT provided:
- ✅ Complete JSON object
- ✅ All ingredients with quantities/units
- ✅ All steps numbered sequentially
- ✅ Nutrition per serving (not totals)
- ✅ Tags (cuisine, meal types, diets)
- ✅ Image prompt
- ✅ 1024×1024 image file

---

**Ready to start?** Export your first batch and send to ChatGPT! 🚀

