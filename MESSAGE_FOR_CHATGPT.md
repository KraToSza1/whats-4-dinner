# Message to Send to ChatGPT

---

Hi ChatGPT!

I have a recipe application using Supabase (PostgreSQL database). I've built a bulk recipe editor that can export/import CSV files.

## What I CAN Do:
- Export recipes to CSV (ID, Title, Description, Prep Minutes, Cook Minutes, Servings, Difficulty, Author)
- Import CSV files back into the editor
- Edit recipes in a table view
- Save all changes at once

## What I CANNOT Do:
- I cannot give you direct database access
- I cannot run automated scripts or APIs
- I cannot process complex data (ingredients, instructions, nutrition) automatically
- I removed ChatGPT API integration to avoid costs

## The Official Workflow:

**What I'll Do:**
1. Export recipes from bulk editor → CSV (up to 5 recipes at a time)
2. Manually paste CSV content into this chat
3. Import your corrected CSV back into bulk editor
4. Click "Save All"

**What I Need You To Do:**
- Take CSV snippet
- Fix titles (capitalization, spelling)
- Fix and polish descriptions
- Standardize punctuation and formatting
- Sanity-check prep/cook/servings/difficulty (only adjust if clearly wrong)
- Return CSV in EXACTLY the same format (same columns, same IDs)

**Rules:**
- Do not change the header row
- Keep all 8 columns exactly as-is
- Always include the ID, even if some other fields are empty
- Up to 5 recipes per message
- Only basic fields (no ingredients, instructions, nutrition)

**Example CSV format I'll send:**
```csv
ID,Title,Description,Prep Minutes,Cook Minutes,Servings,Difficulty,Author
f1342843-fbf0-4bfd-9a53-dcd437abf3ea,"marshmallow peanut chocolate squares","oh my! this are utterly fantastic...",20,30,12,easy,Community
```

**What I expect back:**
Same format, same IDs, cleaned text, ready to import.

Can you help me with this? 5 recipes at a time is perfect - I don't mind doing it manually!

Thanks!

---

