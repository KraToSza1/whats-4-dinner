# ✅ Final Workflow - Confirmed and Locked

## Message to Cursor AI - Final Recipe Import Workflow

This is the **confirmed and correct workflow** for importing complete recipes into the What's 4 Dinner platform. This description is authoritative and should be used for all future automation, tooling, and modal behavior.

---

## ✅ 1. How Recipes Are Provided to ChatGPT

The user sends **ONLY**:
- Recipe Name: [Title]
- Recipe ID: [UUID]

**Example:**
```
Recipe Name: Linguine with Three Colors Vegetables and Pesto Sauce
Recipe ID: bd738302-f043-43e6-ac5b-c49df2fcedde
```

**OR** the user exports a **complete correct recipe** as reference:
- Click "📤 Export Complete Recipe" button
- Copy the JSON (includes all correct ingredients, nutrition, steps)
- Send to ChatGPT: "Use this as reference, generate Recipe 1..."

---

## ✅ 2. What ChatGPT Must Generate

For each recipe, ChatGPT returns **FULL structured content** according to `RECIPE_TEMPLATE.json`.

**ChatGPT provides:**
- ✔ Title
- ✔ Description
- ✔ Prep minutes
- ✔ Cook minutes
- ✔ Servings
- ✔ Difficulty
- ✔ Cuisine (array)
- ✔ Diets (array)
- ✔ Meal types (array)
- ✔ Ingredients (fully structured: name, quantity, unit, preparation)
- ✔ Steps (position + instruction + timer_seconds)
- ✔ Nutrition **per serving** (system converts to totals internally)
- ✔ Image prompt (Style #5 — Pinterest soft-light aesthetic)

**ChatGPT outputs a pure JSON object** matching the required schema.

---

## ✅ 3. How the User Imports Recipes (Batch Mode)

**Step-by-step:**

1. Open the **"Import JSON from ChatGPT"** modal
2. Turn on **"Batch Mode (Keep Open)"**
3. Paste the JSON for Recipe 1
4. Click **"Import Recipe"**
5. Modal stays open ✅
6. Click **"💾 Save All Changes"**
7. Ask ChatGPT: **"Generate image for this recipe"**
8. Download the JPEG image (1024×1024, ≤100KB)
9. Upload the image into the UI (Image tab)
10. Save the recipe
11. Return to modal (still open) and paste JSON for Recipe 2
12. Repeat

**This is the fastest workflow under OpenAI tool-call restrictions.**

---

## ✅ 4. Image Requirements (CRITICAL)

**ChatGPT MUST generate images with these EXACT specifications:**

- ✔ **Be JPEG, not PNG**
  - PNG is too large and kills PWA performance
  - ChatGPT generates JPEG directly (NOT PNG)
  
- ✔ **Be ≤100KB**
  - Critical for PWA performance
  - ChatGPT compresses to ≤100KB during generation
  
- ✔ **Be 1024×1024 resolution**
  - Required for uniform grid display
  - ChatGPT generates at exactly 1024×1024
  
- ✔ **Use Pinterest-Style Soft Natural Lighting**
  - Style #5 — consistent look across all recipes
  
- ✔ **Contain only food**
  - NO overlays
  - NO text
  - NO titles
  - NO props that misrepresent ingredients
  
- ✔ **Background:**
  - Light rustic / natural / soft gradient backgrounds allowed

**ChatGPT generates the image prompt in JSON.**
**ChatGPT generates the actual JPEG image (1024×1024, ≤100KB) in a separate message using the image_gen tool.**
**User uploads the JPEG file ChatGPT provides.**

---

## ✅ 5. Why Images Are Generated Separately

**OpenAI tool rules require:**
- A tool-call message can contain **only** the image generation call
- It **cannot** include JSON or additional text

**Therefore:**
- JSON first
- Then separate request for JPEG
- Then manual upload
- Then saving the recipe

**This is intentional and required.**

---

## ✅ 6. Accuracy Requirements for ChatGPT

**ChatGPT must always:**

- ✔ **Use real-world quantities**
  - No nonsense values
  - No placeholders like "1 unit"
  - Units: metric (g, ml, tsp, tbsp, cups when appropriate)

- ✔ **Keep fractions as decimals**
  - Example: Instead of ¼ cup → 0.25 cup

- ✔ **Estimate realistic nutrition per serving**
  - Calories, protein, fat, carbs
  - Micronutrients
  - System converts to totals automatically

- ✔ **Ensure steps are short and sequenced**
  - One action per step
  - No combined steps
  - Timer values in seconds when applicable

- ✔ **Generate perfect, valid JSON object**
  - No trailing commas
  - No unescaped quotes
  - Matches exact schema

**Cursor validates JSON before importing.**

---

## ✅ 7. System Features

### Export Complete Recipe
- **Button:** "📤 Export Complete Recipe" (indigo)
- **Location:** Browse mode toolbar + Edit mode header
- **Function:** Exports complete recipe with all correct data as JSON
- **Use:** Send to ChatGPT as reference for correct format/values

### Import JSON
- **Button:** "📥 Import JSON from ChatGPT" (purple)
- **Location:** Browse mode toolbar + Edit mode header
- **Function:** Opens modal to paste ChatGPT's JSON
- **Batch Mode:** Keeps modal open for rapid imports

### Image Upload
- **Automatic Compression:** Converts PNG → JPEG, compresses to ≤100KB
- **Automatic Resize:** Resizes to 1024×1024
- **Validation:** Warns if file is too large
- **Format:** Accepts JPEG/PNG, outputs JPEG only

---

## ✅ 8. Summary for Cursor AI

**ChatGPT handles:**
- Full recipe generation
- Nutrition (per-serving)
- Ingredients (structured)
- Instructions (step-by-step)
- Title/description
- Image prompt
- Correct JSON schema
- Separate JPEG generation (1024×1024, ≤100KB)

**The system handles:**
- Importing JSON
- Mapping JSON → database
- Multiplying nutrition to totals
- Uploading JPEG files (ChatGPT provides JPEG ≤100KB)
- Saving hero_image_url
- Displaying recipes
- Serving assets in PWA

**User handles:**
- Copying JSON
- Importing (with batch mode)
- Saving
- Requesting image from ChatGPT
- Uploading JPEG
- Saving again

---

## 🎯 Final Note

**This workflow is:**
- ✅ Stable
- ✅ Predictable
- ✅ Scalable
- ✅ Optimized for speed
- ✅ Optimized for accuracy
- ✅ Optimized for schema cleanliness
- ✅ Optimized for mobile/PWA performance

**Cursor should assume this is the permanent workflow** unless replaced by a future direct OpenAI API integration.

---

## ✅ Everything is Ready

- ✅ Export Complete Recipe button (for reference)
- ✅ Import JSON button (with batch mode)
- ✅ Image upload (accepts JPEG from ChatGPT)
- ✅ JSON validation
- ✅ All fields populate automatically
- ✅ Batch mode keeps modal open

**ChatGPT generates JPEG ≤100KB directly - no compression needed!**

**Ready to start!** 🚀

