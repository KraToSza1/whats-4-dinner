#!/usr/bin/env python3
"""
Advanced Python script to parse ingredient strings and extract quantities/units
This is a more sophisticated parser than the SQL version
Run this if the SQL parsing doesn't work well enough
"""

import csv
import json
import re
import sys
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Unit patterns (more comprehensive than SQL)
UNIT_PATTERNS = [
    (r'\b(cup|cups|c\.?)\b', 'cup'),
    (r'\b(tablespoon|tablespoons|tbsp|tbs\.?)\b', 'tbsp'),
    (r'\b(teaspoon|teaspoons|tsp|t\.?)\b', 'tsp'),
    (r'\b(ounce|ounces|oz\.?)\b', 'oz'),
    (r'\b(pound|pounds|lb|lbs\.?)\b', 'lb'),
    (r'\b(gram|grams|g\.?)\b', 'g'),
    (r'\b(kilogram|kilograms|kg\.?)\b', 'kg'),
    (r'\b(milliliter|milliliters|ml\.?)\b', 'ml'),
    (r'\b(liter|liters|l\.?)\b', 'l'),
    (r'\b(pint|pints|pt\.?)\b', 'pint'),
    (r'\b(quart|quarts|qt\.?)\b', 'quart'),
    (r'\b(gallon|gallons|gal\.?)\b', 'gallon'),
    (r'\b(clove|cloves)\b', 'clove'),
    (r'\b(slice|slices)\b', 'slice'),
    (r'\b(piece|pieces|pc\.?)\b', 'piece'),
    (r'\b(can|cans)\b', 'can'),
    (r'\b(box|boxes)\b', 'box'),
    (r'\b(package|packages|pkg\.?)\b', 'package'),
]

# Number words
NUMBER_WORDS = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'half': 0.5, 'quarter': 0.25, 'third': 0.33, 'fourth': 0.25,
}

def parse_ingredient(ingredient_text):
    """Parse ingredient string to extract quantity, unit, and name"""
    if not ingredient_text or not ingredient_text.strip():
        return None
    
    text = ingredient_text.strip()
    quantity = 1
    unit = 'unit'
    name = text
    
    # Try to extract numeric quantity first
    num_match = re.match(r'^(\d+(?:\.\d+)?)', text)
    if num_match:
        quantity = float(num_match.group(1))
        text = text[num_match.end():].strip()
    
    # Try number words
    if quantity == 1:
        for word, num in NUMBER_WORDS.items():
            if re.match(rf'^{word}\b', text, re.I):
                quantity = num
                text = re.sub(rf'^{word}\s+', '', text, flags=re.I)
                break
    
    # Try to extract unit
    for pattern, unit_name in UNIT_PATTERNS:
        match = re.search(pattern, text, re.I)
        if match:
            unit = unit_name
            # Remove the unit from text
            text = re.sub(pattern, '', text, flags=re.I).strip()
            break
    
    # Extract ingredient name (everything left)
    name = re.sub(r'\s+', ' ', text).strip()
    
    # If name is empty or too short, use original
    if not name or len(name) < 2:
        name = ingredient_text.strip()
        # Try to remove just the quantity/unit from original
        name = re.sub(r'^\d+(?:\.\d+)?\s*', '', name)
        for pattern, _ in UNIT_PATTERNS:
            name = re.sub(pattern, '', name, flags=re.I)
        name = re.sub(r'\s+', ' ', name).strip()
    
    # Common ingredient defaults
    if name.lower() in ['salt', 'pepper'] and unit == 'unit':
        unit = 'tsp'
    elif name.lower() in ['sugar', 'flour'] and unit == 'unit':
        unit = 'cup'
        if quantity == 1:
            quantity = 2 if 'flour' in name.lower() else 1
    elif name.lower() in ['butter', 'oil'] and unit == 'unit':
        unit = 'tbsp'
        if quantity == 1:
            quantity = 2
    
    return {
        'quantity': quantity,
        'unit': unit,
        'name': name
    }

def update_recipe_ingredients(csv_file='RAW_recipes.csv', limit=None):
    """Parse ingredients from CSV and update Supabase"""
    print(f"🚀 Starting ingredient quantity sync from {csv_file}...")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    # Get all recipes from Supabase
    recipes_result = supabase.table('recipes').select('id, title').eq('source', 'csv_import').execute()
    recipes_by_title = {r['title'].strip().lower(): r for r in recipes_result.data}
    
    print(f"📦 Found {len(recipes_by_title)} recipes in Supabase")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for idx, row in enumerate(reader, 1):
            if limit and idx > limit:
                break
            
            try:
                recipe_name = row.get('name', '').strip()
                if not recipe_name:
                    continue
                
                # Find matching recipe in Supabase
                recipe_key = recipe_name.lower()
                if recipe_key not in recipes_by_title:
                    skipped_count += 1
                    if idx % 1000 == 0:
                        print(f"  ⏭️  Processed {idx} rows (skipped: {skipped_count})")
                    continue
                
                recipe = recipes_by_title[recipe_key]
                recipe_id = recipe['id']
                
                # Parse ingredients
                ingredients_str = row.get('ingredients', '[]')
                try:
                    if ingredients_str.startswith('['):
                        ingredients_list = json.loads(ingredients_str)
                    else:
                        # Try to parse as comma-separated
                        ingredients_list = [i.strip().strip("'\"") for i in ingredients_str.split(',')]
                except:
                    ingredients_list = []
                
                # Get existing recipe_ingredients
                ri_result = supabase.table('recipe_ingredients').select('id, ingredient_id, order_index').eq('recipe_id', recipe_id).execute()
                existing_ingredients = {ri['order_index']: ri for ri in ri_result.data}
                
                # Parse and update each ingredient
                for pos, ingredient_text in enumerate(ingredients_list, 1):
                    if not ingredient_text or not ingredient_text.strip():
                        continue
                    
                    parsed = parse_ingredient(ingredient_text)
                    if not parsed:
                        continue
                    
                    # Find matching recipe_ingredient by position
                    if pos in existing_ingredients:
                        ri = existing_ingredients[pos]
                        
                        # Get ingredient name to verify match
                        ing_result = supabase.table('ingredients').select('id, name').eq('id', ri['ingredient_id']).execute()
                        if ing_result.data:
                            ing_name = ing_result.data[0]['name'].lower()
                            parsed_name = parsed['name'].lower()
                            
                            # Fuzzy match check
                            if (ing_name in parsed_name or parsed_name in ing_name or 
                                abs(len(ing_name) - len(parsed_name)) <= 3):
                                
                                # Update recipe_ingredient
                                supabase.table('recipe_ingredients').update({
                                    'quantity': parsed['quantity'],
                                    'unit': parsed['unit']
                                }).eq('id', ri['id']).execute()
                                
                                updated_count += 1
                
                if idx % 100 == 0:
                    print(f"  ✅ Processed {idx} recipes (updated: {updated_count})")
                    
            except Exception as e:
                error_count += 1
                if idx % 100 == 0:
                    print(f"  ⚠️  Error on row {idx}: {e}")
                continue
    
    print(f"\n✅ Sync complete!")
    print(f"   Updated: {updated_count} ingredients")
    print(f"   Skipped: {skipped_count} recipes (not in Supabase)")
    print(f"   Errors: {error_count}")

if __name__ == '__main__':
    csv_file = 'RAW_recipes.csv'
    limit = None  # Set to a number to limit for testing
    
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
        print(f"⚠️  Limiting to {limit} recipes for testing")
    
    update_recipe_ingredients(csv_file, limit)

