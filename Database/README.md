# Database Documentation Index

This directory contains documentation and scripts for managing the recipe database.

## 📚 Documentation Files

### Recipe Format & ChatGPT Integration

- **[CHATGPT_RECIPE_JSON_GUIDE.md](./CHATGPT_RECIPE_JSON_GUIDE.md)** ⭐ **START HERE**
  - Complete specification for ChatGPT recipe JSON format
  - Full field reference with examples
  - Nutrition rules (per-serving vs totals)
  - Import/export workflow
  - Troubleshooting guide

- **[CHATGPT_QUICK_REFERENCE.md](./CHATGPT_QUICK_REFERENCE.md)**
  - Quick reference for ChatGPT
  - Minimal format checklist
  - Critical rules summary
  - Perfect for copying to ChatGPT conversation

### Recipe Editing

- **[RECIPE_EDITING_GUIDE.md](./RECIPE_EDITING_GUIDE.md)**
  - How to edit recipes via web interface
  - Using Recipe Editor in Admin Dashboard
  - Bulk editing tips
  - Image replacement guide

### Nutrition System

- **[NUTRITION_SYSTEM_EXPLANATION.md](./NUTRITION_SYSTEM_EXPLANATION.md)**
  - How nutrition data is stored (totals vs per-serving)
  - How the UI scales nutrition by serving size
  - How the Recipe Editor converts values
  - Examples and verification methods

- **[NUTRITION_DATA_GUIDE.md](./NUTRITION_DATA_GUIDE.md)**
  - Step-by-step nutrition data entry instructions
  - Troubleshooting nutrition issues
  - Common mistakes to avoid

### Images

- **[IMAGE_MATCHING_STRATEGY.md](./IMAGE_MATCHING_STRATEGY.md)**
  - Image matching and upload strategies

## 🔧 Scripts

- **REPLACE_RECIPE_IMAGE.py** - Replace recipe images by ID
- **import_recipes_to_supabase.py** - Bulk recipe import
- Other utility scripts for database management

## 🚀 Quick Start

1. **For ChatGPT Integration:**
   - Read [CHATGPT_RECIPE_JSON_GUIDE.md](./CHATGPT_RECIPE_JSON_GUIDE.md)
   - Copy [CHATGPT_QUICK_REFERENCE.md](./CHATGPT_QUICK_REFERENCE.md) to ChatGPT

2. **For Recipe Editing:**
   - Read [RECIPE_EDITING_GUIDE.md](./RECIPE_EDITING_GUIDE.md)
   - Use Recipe Editor in Admin Dashboard

3. **For Understanding Nutrition:**
   - Read [NUTRITION_SYSTEM_EXPLANATION.md](./NUTRITION_SYSTEM_EXPLANATION.md)
   - Always use per-serving values in JSON imports

---

**Main README:** See root [README.md](../README.md) for project setup and deployment.

