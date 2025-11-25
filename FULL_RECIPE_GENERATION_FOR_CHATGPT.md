# Complete Recipe Generation Guide for ChatGPT

## Overview

You will generate **complete, production-ready recipes** with all data needed for a recipe application. Each recipe must include:

1. ✅ **Basic Info** (title, description, times, servings, difficulty)
2. ✅ **Ingredients** (structured with quantities, units, preparation)
3. ✅ **Instructions** (step-by-step, numbered)
4. ✅ **Nutrition** (per-serving values - system will scale to totals)
5. ✅ **Tags** (cuisine, meal types, dietary restrictions)
6. ✅ **Image Prompt** (for 1024×1024 AI image generation, Style #5)
7. ✅ **Image** (1024×1024 image matching the prompt)

---

## Database Schema

### Table: `recipes`
- `id` (UUID) - Recipe unique identifier
- `title` (text) - Recipe name
- `description` (text) - Recipe description/summary
- `prep_minutes` (integer) - Preparation time in minutes
- `cook_minutes` (integer) - Cooking time in minutes
- `servings` (decimal) - Number of servings
- `difficulty` (text) - One of: `easy`, `medium`, `hard`
- `author` (text) - Recipe author (default: "Community")
- `cuisine` (text array) - Array of cuisine types (e.g., `["Italian", "Mediterranean"]`)
- `meal_types` (text array) - Array of meal types (e.g., `["breakfast", "lunch", "dinner"]`)
- `diets` (text array) - Array of dietary restrictions (e.g., `["vegetarian", "gluten-free"]`)
- `hero_image_url` (text) - URL to the recipe image
- `calories` (decimal) - Total calories (calculated from nutrition)
- `source` (text) - Should be `"recipe_editor"` for manually created recipes

### Table: `recipe_ingredients`
- `recipe_id` (UUID) - Links to recipe
- `ingredient_id` (UUID) - Links to ingredients table
- `quantity` (decimal) - Amount (e.g., 2.5)
- `unit` (text) - Unit of measurement (e.g., "cups", "tbsp", "oz", "g")
- `preparation` (text) - Preparation note (e.g., "chopped", "diced", "minced")

### Table: `ingredients`
- `id` (UUID) - Ingredient unique identifier
- `name` (text) - Ingredient name (e.g., "all-purpose flour")

### Table: `recipe_steps`
- `recipe_id` (UUID) - Links to recipe
- `position` (integer) - Step number (1, 2, 3, ...)
- `instruction` (text) - Step instruction text
- `timer_seconds` (integer, optional) - Timer for this step (if applicable)

### Table: `recipe_nutrition`
- `recipe_id` (UUID) - Links to recipe
- `calories` (decimal) - **PER SERVING** (system will multiply by servings)
- `protein` (decimal) - **PER SERVING** (grams)
- `fat` (decimal) - **PER SERVING** (grams)
- `carbs` (decimal) - **PER SERVING** (grams)
- `fiber` (decimal) - **PER SERVING** (grams)
- `sugar` (decimal) - **PER SERVING** (grams)
- `sodium` (decimal) - **PER SERVING** (milligrams)
- `cholesterol` (decimal) - **PER SERVING** (milligrams)
- `saturated_fat` (decimal) - **PER SERVING** (grams, optional)
- `trans_fat` (decimal) - **PER SERVING** (grams, optional)
- `vitamin_a` (decimal) - **PER SERVING** (IU, optional)
- `vitamin_c` (decimal) - **PER SERVING** (mg, optional)
- `vitamin_d` (decimal) - **PER SERVING** (IU, optional)
- `potassium` (decimal) - **PER SERVING** (mg, optional)
- `calcium` (decimal) - **PER SERVING** (mg, optional)
- `iron` (decimal) - **PER SERVING** (mg, optional)

**⚠️ CRITICAL: All nutrition values must be PER SERVING. The system automatically multiplies by servings to get totals.**

---

## Input Format (What You'll Receive)

When I send you a recipe to generate, you'll receive:

```
Recipe Name: [Recipe Title]
Recipe ID: [UUID]
```

Example:
```
Recipe Name: Low Fat Chicken and Avocado Quesadillas
Recipe ID: de0aba1e-6bb6-4162-9bfd-c9f9351194a6
```

---

## Output Format (What You Must Generate)

You must return a **JSON object** in this exact format:

```json
{
  "recipe_id": "de0aba1e-6bb6-4162-9bfd-c9f9351194a6",
  "title": "Low Fat Chicken and Avocado Quesadillas",
  "description": "A healthy twist on classic quesadillas featuring lean chicken, creamy avocado, and reduced-fat cheese. Perfect for a quick lunch or light dinner.",
  "prep_minutes": 15,
  "cook_minutes": 10,
  "servings": 4,
  "difficulty": "easy",
  "author": "Community",
  "cuisine": ["Mexican", "American"],
  "meal_types": ["lunch", "dinner"],
  "diets": ["low-fat", "high-protein"],
  "ingredients": [
    {
      "ingredient_name": "boneless skinless chicken breast",
      "quantity": 1,
      "unit": "lb",
      "preparation": "cooked and shredded"
    },
    {
      "ingredient_name": "avocado",
      "quantity": 2,
      "unit": "",
      "preparation": "diced"
    },
    {
      "ingredient_name": "reduced-fat cheddar cheese",
      "quantity": 1,
      "unit": "cup",
      "preparation": "shredded"
    },
    {
      "ingredient_name": "whole wheat tortillas",
      "quantity": 4,
      "unit": "",
      "preparation": ""
    },
    {
      "ingredient_name": "red bell pepper",
      "quantity": 1,
      "unit": "",
      "preparation": "diced"
    },
    {
      "ingredient_name": "lime",
      "quantity": 1,
      "unit": "",
      "preparation": "juiced"
    },
    {
      "ingredient_name": "cilantro",
      "quantity": 0.25,
      "unit": "cup",
      "preparation": "chopped"
    },
    {
      "ingredient_name": "salt",
      "quantity": 0.5,
      "unit": "tsp",
      "preparation": ""
    },
    {
      "ingredient_name": "black pepper",
      "quantity": 0.25,
      "unit": "tsp",
      "preparation": ""
    }
  ],
  "steps": [
    {
      "position": 1,
      "instruction": "Cook chicken breast in a skillet over medium heat until fully cooked, about 6-8 minutes per side. Let cool slightly, then shred with two forks.",
      "timer_seconds": null
    },
    {
      "position": 2,
      "instruction": "In a medium bowl, combine shredded chicken, diced avocado, diced red bell pepper, lime juice, cilantro, salt, and black pepper. Mix gently to combine.",
      "timer_seconds": null
    },
    {
      "position": 3,
      "instruction": "Heat a large non-stick skillet or griddle over medium heat. Place one tortilla in the skillet.",
      "timer_seconds": null
    },
    {
      "position": 4,
      "instruction": "Sprinkle half of the shredded cheese over one half of the tortilla. Top with a quarter of the chicken-avocado mixture, then fold the other half over.",
      "timer_seconds": null
    },
    {
      "position": 5,
      "instruction": "Cook for 2-3 minutes until the bottom is golden brown, then carefully flip and cook for another 2-3 minutes until the other side is golden and cheese is melted.",
      "timer_seconds": 180
    },
    {
      "position": 6,
      "instruction": "Repeat with remaining tortillas and filling. Cut each quesadilla into wedges and serve immediately.",
      "timer_seconds": null
    }
  ],
  "nutrition": {
    "calories": 320,
    "protein": 28,
    "fat": 12,
    "carbs": 28,
    "fiber": 8,
    "sugar": 3,
    "sodium": 580,
    "cholesterol": 65,
    "saturated_fat": 4,
    "vitamin_a": 450,
    "vitamin_c": 35,
    "potassium": 680,
    "calcium": 200,
    "iron": 2.5
  },
  "image_prompt": "A delicious low-fat chicken and avocado quesadilla, cut into wedges on a white plate, showing the melted cheese, diced avocado, and shredded chicken inside. Bright, natural lighting, food photography style, appetizing presentation, 1024x1024",
  "image": "[1024×1024 image file - you will generate this]"
}
```

---

## Detailed Field Requirements

### Title
- **Format**: Proper capitalization (e.g., "Low Fat Chicken and Avocado Quesadillas")
- **Length**: Clear and descriptive
- **No**: Extra punctuation, all caps, or abbreviations

### Description
- **Length**: 1-3 sentences
- **Content**: Describe the dish, key ingredients, and appeal
- **Tone**: Friendly, appetizing, clear

### Prep/Cook Minutes
- **Type**: Integer (whole numbers)
- **Range**: 0-999 minutes
- **Accuracy**: Realistic times based on actual recipe complexity

### Servings
- **Type**: Decimal (can be 0.5, 1, 2.5, 4, etc.)
- **Range**: 0.5 - 20
- **Accuracy**: Match actual recipe yield

### Difficulty
- **Options**: `"easy"`, `"medium"`, `"hard"`
- **Criteria**:
  - `easy`: Simple recipes, few steps, common ingredients
  - `medium`: Moderate complexity, some technique required
  - `hard`: Complex techniques, multiple components, advanced skills

### Cuisine
- **Type**: Array of strings
- **Examples**: `["Italian"]`, `["Mexican", "American"]`, `["Asian", "Fusion"]`
- **Common values**: Italian, Mexican, American, Asian, Mediterranean, French, Indian, Thai, Japanese, Chinese, etc.
- **Can be**: Empty array `[]` if no specific cuisine

### Meal Types
- **Type**: Array of strings
- **Options**: `"breakfast"`, `"lunch"`, `"dinner"`, `"snack"`, `"dessert"`, `"appetizer"`
- **Can have**: Multiple (e.g., `["lunch", "dinner"]`)

### Diets
- **Type**: Array of strings
- **Options**: `"vegetarian"`, `"vegan"`, `"gluten-free"`, `"dairy-free"`, `"nut-free"`, `"low-fat"`, `"low-carb"`, `"keto"`, `"paleo"`, `"high-protein"`, `"low-sodium"`, etc.
- **Can be**: Empty array `[]` if no dietary restrictions
- **Important**: Only include if the recipe genuinely fits the diet

### Ingredients

Each ingredient object must have:

- **`ingredient_name`** (required): The ingredient name
  - Examples: "all-purpose flour", "boneless skinless chicken breast", "extra virgin olive oil"
  - Be specific: "chicken breast" not "chicken"
  - Use common names: "butter" not "unsalted butter" (unless recipe specifically requires it)

- **`quantity`** (required): Numeric amount
  - Can be decimal: 0.5, 1.5, 2.25
  - Can be whole number: 1, 2, 3
  - Use `null` if ingredient is "to taste" or doesn't have a quantity

- **`unit`** (required): Unit of measurement
  - Common units: `"cup"`, `"cups"`, `"tbsp"`, `"tsp"`, `"oz"`, `"lb"`, `"g"`, `"kg"`, `"ml"`, `"l"`
  - Use empty string `""` for whole items (e.g., "2 eggs" → `quantity: 2, unit: ""`)
  - Use empty string `""` for "to taste" items

- **`preparation`** (optional): How the ingredient is prepared
  - Examples: `"chopped"`, `"diced"`, `"minced"`, `"grated"`, `"shredded"`, `"sliced"`, `"cooked"`, `"melted"`
  - Use empty string `""` if no preparation needed
  - Can be `null` if not applicable

**Ingredient Examples:**
```json
{
  "ingredient_name": "onion",
  "quantity": 1,
  "unit": "",
  "preparation": "diced"
}
```

```json
{
  "ingredient_name": "olive oil",
  "quantity": 2,
  "unit": "tbsp",
  "preparation": ""
}
```

```json
{
  "ingredient_name": "salt",
  "quantity": null,
  "unit": "",
  "preparation": ""
}
```

### Steps

Each step object must have:

- **`position`** (required): Step number starting from 1
  - Must be sequential: 1, 2, 3, 4, ...
  - No gaps or duplicates

- **`instruction`** (required): Clear, actionable instruction
  - Start with action verb: "Heat", "Combine", "Add", "Cook", "Bake"
  - Be specific: Include temperatures, times, techniques
  - One action per step (don't combine multiple actions)
  - Length: 1-3 sentences max

- **`timer_seconds`** (optional): Timer duration in seconds
  - Use `null` if no timer needed
  - Only include if step has a specific cooking/baking time
  - Examples: `180` (3 minutes), `600` (10 minutes), `null` (no timer)

**Step Examples:**
```json
{
  "position": 1,
  "instruction": "Preheat oven to 375°F (190°C).",
  "timer_seconds": null
}
```

```json
{
  "position": 2,
  "instruction": "In a large mixing bowl, combine flour, sugar, and baking powder. Whisk until well combined.",
  "timer_seconds": null
}
```

```json
{
  "position": 3,
  "instruction": "Bake for 25-30 minutes until golden brown and a toothpick inserted comes out clean.",
  "timer_seconds": 1800
}
```

### Nutrition (PER SERVING)

**⚠️ CRITICAL: All values are PER SERVING. The system multiplies by servings automatically.**

Required fields:
- **`calories`**: Total calories per serving (decimal)
- **`protein`**: Protein in grams per serving (decimal)
- **`fat`**: Total fat in grams per serving (decimal)
- **`carbs`**: Carbohydrates in grams per serving (decimal)
- **`fiber`**: Fiber in grams per serving (decimal)
- **`sugar`**: Sugar in grams per serving (decimal)
- **`sodium`**: Sodium in milligrams per serving (decimal)
- **`cholesterol`**: Cholesterol in milligrams per serving (decimal)

Optional fields (include if available):
- **`saturated_fat`**: Saturated fat in grams per serving (decimal)
- **`trans_fat`**: Trans fat in grams per serving (decimal)
- **`vitamin_a`**: Vitamin A in IU per serving (decimal)
- **`vitamin_c`**: Vitamin C in milligrams per serving (decimal)
- **`vitamin_d`**: Vitamin D in IU per serving (decimal)
- **`potassium`**: Potassium in milligrams per serving (decimal)
- **`calcium`**: Calcium in milligrams per serving (decimal)
- **`iron`**: Iron in milligrams per serving (decimal)

**Nutrition Accuracy:**
- Calculate based on actual ingredients and quantities
- Use standard nutrition databases
- Ensure values are realistic (calories per serving typically 100-800)
- Validate: `calories ≈ (protein × 4) + (carbs × 4) + (fat × 9)` (±10% tolerance)

**Example:**
```json
{
  "calories": 320,
  "protein": 28,
  "fat": 12,
  "carbs": 28,
  "fiber": 8,
  "sugar": 3,
  "sodium": 580,
  "cholesterol": 65,
  "saturated_fat": 4,
  "vitamin_a": 450,
  "vitamin_c": 35,
  "potassium": 680,
  "calcium": 200,
  "iron": 2.5
}
```

### Image Prompt

- **Format**: Descriptive text prompt for AI image generation
- **Style**: Food photography, appetizing, professional
- **Size**: Must specify "1024x1024"
- **Content**: Describe the finished dish, plating, lighting
- **Tone**: Appetizing, clear, visual

**Example:**
```
"A delicious low-fat chicken and avocado quesadilla, cut into wedges on a white plate, showing the melted cheese, diced avocado, and shredded chicken inside. Bright, natural lighting, food photography style, appetizing presentation, 1024x1024"
```

### Image

- **Size**: 1024×1024 pixels (exactly)
- **Format**: JPEG STRONGLY PREFERRED (PNG files are 10× larger and kill PWA performance)
- **File Size**: ≤100KB (CRITICAL - you must generate JPEG ≤100KB)
- **Style**: Style #5 (Pinterest-style soft natural lighting, consistent with app's visual style)
- **Content**: Must match the image prompt exactly
- **Quality**: Professional food photography, compressed to ≤100KB
- **Delivery**: You will generate and provide the JPEG file (1024×1024, ≤100KB) in a separate message

**⚠️ CRITICAL: Images MUST be JPEG ≤100KB.**
- PNG files are 1-2MB+ and will make the PWA unusably slow
- The system will auto-convert PNG → JPEG, but it's much better if you generate JPEG directly
- If you MUST send PNG, the system will compress it, but JPEG is preferred

**⚠️ Performance Impact:**
- 1.2MB PNG = 10+ seconds to load on mobile = terrible UX
- 100KB JPEG = <1 second to load = fast PWA
- Always generate JPEG ≤100KB when possible

---

## Workflow

1. **I send you**: Recipe name + Recipe ID
2. **You generate**: Complete JSON with all fields above
3. **You provide**: JSON + 1024×1024 image
4. **I import**: Into Recipe Editor
5. **Done**: Recipe is complete with all data

---

## Quality Standards

### Accuracy
- ✅ Ingredients must match the actual recipe
- ✅ Instructions must be accurate and testable
- ✅ Nutrition must be calculated from actual ingredients
- ✅ Times must be realistic
- ✅ Servings must match actual yield

### Completeness
- ✅ All required fields filled
- ✅ No missing ingredients
- ✅ No missing steps
- ✅ Nutrition includes all required fields
- ✅ Image prompt is detailed and accurate

### Consistency
- ✅ Formatting is consistent
- ✅ Units are standardized
- ✅ Instructions follow same style
- ✅ Image matches prompt

---

## Common Mistakes to Avoid

❌ **Don't**: Use nutrition values as totals (they must be per-serving)
❌ **Don't**: Skip ingredients or steps
❌ **Don't**: Use vague instructions ("cook until done" → specify time/temp)
❌ **Don't**: Include dietary tags that don't apply
❌ **Don't**: Use inconsistent units (mix cups and grams randomly)
❌ **Don't**: Generate PNG images (MUST be JPEG ≤100KB)
❌ **Don't**: Generate images >100KB (will break PWA performance)
❌ **Don't**: Generate images that don't match the recipe
❌ **Don't**: Use placeholder text or "TBD" values

✅ **Do**: Calculate accurate per-serving nutrition
✅ **Do**: Include all ingredients with proper quantities
✅ **Do**: Write clear, actionable instructions
✅ **Do**: Generate images that match the prompt exactly
✅ **Do**: Verify all data before sending

---

## Example Complete Output

See the JSON example above for the complete format. Every recipe you generate must follow this exact structure.

---

## Questions?

If you need clarification on any field or format, ask before generating. Accuracy and completeness are critical.

**Ready to generate recipes?** I'll send you recipe names + IDs, and you'll return complete JSON + images! 🚀

