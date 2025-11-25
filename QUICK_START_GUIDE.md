# Quick Start - First Batch of 5 Recipes

## Step 1: Export Recipes

1. Go to `/admin` → Recipe Editor → Click "Open Bulk Editor"
2. You'll see up to 100 recipes loaded
3. Click "Export CSV" button
4. A CSV file will download (e.g., `recipes_export_2025-11-24.csv`)

## Step 2: Get First 5 Recipes

1. Open the downloaded CSV file in a text editor (Notepad, VS Code, etc.)
2. Copy the header row + first 5 recipe rows
3. It should look like this:

```csv
ID,Title,Description,Prep Minutes,Cook Minutes,Servings,Difficulty,Author
f1342843-fbf0-4bfd-9a53-dcd437abf3ea,"marshmallow peanut chocolate squares","oh my! this are utterly fantastic...",20,30,12,easy,Community
867eafeb-882a-40e4-93ec-6b6941978363,"Easy Venison Steaks","quick and easy venison steaks recipe",15,20,4,medium,Community
ffbc977b-ccb2-432e-b2b8-60be67304df3,"Red Velvet Pound Cake","classic red velvet pound cake recipe",30,60,12,easy,Community
[recipe 4 ID],"recipe 4 title","recipe 4 description",prep,cook,servings,difficulty,author
[recipe 5 ID],"recipe 5 title","recipe 5 description",prep,cook,servings,difficulty,author
```

## Step 3: Send to ChatGPT

Copy that CSV block and paste it into ChatGPT with this message:

```
Here are 5 recipes to fix:

[Paste CSV here]

Please fix typos, improve descriptions, and return corrected CSV in the same format.
```

## Step 4: Import Corrected CSV

1. Copy the corrected CSV from ChatGPT
2. Paste into a new file: `corrected_recipes.csv`
3. Go back to Bulk Editor
4. Click "Import CSV"
5. Select `corrected_recipes.csv`
6. Click "Save All"

## Step 5: Repeat

- Process next 5 recipes
- Continue until all recipes are done!

---

**Ready?** Export your CSV and get the first 5 recipes ready! 🚀

