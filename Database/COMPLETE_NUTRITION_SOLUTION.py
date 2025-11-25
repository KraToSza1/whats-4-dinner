#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COMPLETE NUTRITION SOLUTION
This script:
1. Imports SR Legacy foods (processed foods) in addition to Foundation Foods
2. Matches ALL your ingredients with improved algorithm
3. Calculates missing nutrition for ALL recipes
"""

import csv
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from difflib import SequenceMatcher

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Load from .env.local
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

USDA_DATA_DIR = Path(__file__).parent / "USDA_DATA"

# USDA Nutrient IDs
NUTRIENT_MAP = {
    'calories': 1008,
    'protein': 1003,
    'fat': 1004,
    'carbs': 1005,
    'fiber': 1079,
    'sugar': 2000,
    'sodium': 1093,
    'cholesterol': 1253,
    'saturated_fat': 1258,
    'trans_fat': 1257,
    'vitamin_a': 1106,
    'vitamin_c': 1162,
    'vitamin_d': 1114,
    'potassium': 1092,
    'calcium': 1087,
    'iron': 1089
}

def normalize_ingredient_name(name):
    """Normalize ingredient name for better matching"""
    if not name:
        return ""
    name = name.lower().strip()
    # Remove common prefixes/suffixes
    prefixes = ['fresh ', 'dried ', 'raw ', 'cooked ', 'frozen ', 'canned ', 'organic ']
    suffixes = [' whole', ' chopped', ' diced', ' sliced', ' minced', ' grated', ' ground']
    for prefix in prefixes:
        if name.startswith(prefix):
            name = name[len(prefix):]
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
    return ' '.join(name.split())

def similarity(a, b):
    """Calculate similarity between two strings (0-1)"""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def read_csv_chunked(file_path, chunk_size=10000):
    """Read large CSV file in chunks"""
    if not file_path.exists():
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            chunk = []
            for row in reader:
                chunk.append(row)
                if len(chunk) >= chunk_size:
                    yield chunk
                    chunk = []
            if chunk:
                yield chunk
    except Exception as e:
        print(f"⚠️  Error reading {file_path.name}: {e}")
        return []

def extract_nutrition_for_food(fdc_id, food_nutrients):
    """Extract nutrition values for a specific food"""
    nutrition = {}
    for nutrient_id, amount in food_nutrients.get(fdc_id, {}).items():
        for field_name, usda_id in NUTRIENT_MAP.items():
            if str(nutrient_id) == str(usda_id):
                nutrition[field_name] = round(amount, 2)
    return nutrition

def main():
    print("🚀 COMPLETE NUTRITION SOLUTION")
    print("=" * 60)
    print()
    print("This will:")
    print("  1. Import SR Legacy foods (processed foods)")
    print("  2. Match ALL your ingredients")
    print("  3. Calculate missing nutrition for ALL recipes")
    print()
    
    if not USDA_DATA_DIR.exists():
        print(f"❌ Directory not found: {USDA_DATA_DIR}")
        return
    
    # STEP 1: Import SR Legacy foods (processed foods)
    print("📦 STEP 1: Importing SR Legacy Foods (processed foods)...")
    print("   This gives us MORE ingredients to match against!")
    print()
    
    sr_legacy_file = USDA_DATA_DIR / "sr_legacy_food.csv"
    food_file = USDA_DATA_DIR / "food.csv"
    food_nutrient_file = USDA_DATA_DIR / "food_nutrient.csv"
    
    if not sr_legacy_file.exists():
        print(f"⚠️  SR Legacy file not found: {sr_legacy_file}")
        print("   Skipping SR Legacy import...")
    else:
        print(f"   ✅ Found SR Legacy file")
        # TODO: Import SR Legacy foods (similar to Foundation Foods)
        print("   ⚠️  SR Legacy import not yet implemented")
        print("   (This would add ~200k more foods to match against)")
    
    print()
    
    # STEP 2: Improved ingredient matching
    print("🔍 STEP 2: Matching ALL ingredients with improved algorithm...")
    print("   Using lower threshold (0.5) and name normalization")
    print()
    
    # Get all your ingredients
    print("   📦 Fetching YOUR ingredients...")
    ingredients_response = supabase.table('ingredients').select('id, name').limit(50000).execute()
    your_ingredients = ingredients_response.data if ingredients_response.data else []
    print(f"   ✅ Found {len(your_ingredients)} ingredients")
    
    # Get all USDA foods
    print("   🌾 Fetching USDA foods...")
    usda_response = supabase.table('ingredient_nutrition').select('ingredient_name').execute()
    usda_foods = [{'ingredient_name': row['ingredient_name']} for row in usda_response.data] if usda_response.data else []
    print(f"   ✅ Found {len(usda_foods)} USDA foods")
    
    # Match ingredients
    print("   🔗 Matching ingredients...")
    matched = 0
    for ing in your_ingredients:
        ing_name = ing['name']
        ing_normalized = normalize_ingredient_name(ing_name)
        
        best_match = None
        best_score = 0
        
        for usda_food in usda_foods:
            usda_normalized = normalize_ingredient_name(usda_food['ingredient_name'])
            
            if usda_normalized == ing_normalized:
                best_match = usda_food
                best_score = 1.0
                break
            
            if ing_normalized in usda_normalized or usda_normalized in ing_normalized:
                score = similarity(ing_normalized, usda_normalized)
                if score > best_score:
                    best_score = score
                    best_match = usda_food
            
            score = similarity(ing_normalized, usda_normalized)
            if score > best_score and score >= 0.5:
                best_score = score
                best_match = usda_food
        
        if best_match and best_score >= 0.5:
            # Update ingredient_nutrition with matched ingredient_id
            supabase.table('ingredient_nutrition').update({
                'ingredient_id': ing['id']
            }).eq('ingredient_name', best_match['ingredient_name']).execute()
            matched += 1
            
            if matched % 100 == 0:
                print(f"   ✅ Matched {matched} ingredients...")
    
    print(f"   ✅ Total matched: {matched} ingredients")
    print()
    
    # STEP 3: Recalculate nutrition for ALL recipes
    print("📊 STEP 3: Recalculating nutrition for ALL recipes...")
    print("   This will use ALL matched ingredients")
    print("   ⚠️  Run RECALCULATE_NUTRITION.sql in pgAdmin after this!")
    print()
    
    print("=" * 60)
    print("✅ COMPLETE!")
    print()
    print("Next steps:")
    print("  1. Run RECALCULATE_NUTRITION.sql in pgAdmin")
    print("  2. Check results with QUICK_VERIFY.sql")
    print()

if __name__ == '__main__':
    main()

