#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import SR Legacy Foods into ingredient_nutrition table
SR Legacy has processed foods, recipes, and more ingredients than Foundation Foods
This will give us ~7,795 more foods to match against!
"""

import csv
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

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

# USDA Nutrient IDs (same as Foundation Foods)
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

def read_csv_file(file_path):
    """Read CSV file and return list of dictionaries"""
    if not file_path.exists():
        return []
    
    data = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
        return data
    except Exception as e:
        print(f"⚠️  Error reading {file_path.name}: {e}")
        return []

def extract_nutrition_for_food(fdc_id, food_nutrients):
    """Extract nutrition values for a specific food from food_nutrient data"""
    nutrition = {}
    for nutrient_id, amount in food_nutrients.get(fdc_id, {}).items():
        for field_name, usda_id in NUTRIENT_MAP.items():
            if str(nutrient_id) == str(usda_id):
                nutrition[field_name] = round(amount, 2)
    return nutrition

def main():
    print("📦 Importing SR Legacy Foods (Processed Foods)")
    print("=" * 60)
    print()
    print("This will add ~7,795 more foods to match against!")
    print("SR Legacy includes processed foods, recipes, and more ingredients")
    print()
    
    if not USDA_DATA_DIR.exists():
        print(f"❌ Directory not found: {USDA_DATA_DIR}")
        return
    
    # Read SR Legacy foods
    print("📖 Reading SR Legacy foods...")
    sr_legacy_file = USDA_DATA_DIR / "sr_legacy_food.csv"
    if not sr_legacy_file.exists():
        print(f"❌ File not found: {sr_legacy_file}")
        return
    
    sr_legacy_foods = read_csv_file(sr_legacy_file)
    print(f"   ✅ Found {len(sr_legacy_foods)} SR Legacy foods")
    
    # Get FDC IDs
    sr_legacy_fdc_ids = {int(row['fdc_id']) for row in sr_legacy_foods if row.get('fdc_id')}
    print(f"   ✅ Found {len(sr_legacy_fdc_ids)} unique FDC IDs")
    
    # Read food.csv to get descriptions
    print("📖 Reading food descriptions...")
    food_file = USDA_DATA_DIR / "food.csv"
    foods = read_csv_file(food_file)
    food_lookup = {int(row['fdc_id']): row.get('description', '') for row in foods if row.get('fdc_id')}
    print(f"   ✅ Loaded {len(food_lookup)} food descriptions")
    
    # Read food_nutrient.csv in chunks (it's 1.6GB!)
    print("📖 Reading food_nutrient.csv (this is the big one - 1.6GB)...")
    print("   Filtering for SR Legacy foods only...")
    food_nutrient_file = USDA_DATA_DIR / "food_nutrient.csv"
    
    if not food_nutrient_file.exists():
        print(f"❌ File not found: {food_nutrient_file}")
        return
    
    # Build nutrition lookup for SR Legacy foods only
    food_nutrients = {}
    chunk_size = 100000
    processed = 0
    
    try:
        with open(food_nutrient_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                fdc_id = int(row.get('fdc_id', 0))
                if fdc_id in sr_legacy_fdc_ids:
                    nutrient_id = int(row.get('nutrient_id', 0))
                    amount = float(row.get('amount', 0))
                    
                    if fdc_id not in food_nutrients:
                        food_nutrients[fdc_id] = {}
                    food_nutrients[fdc_id][nutrient_id] = amount
                
                processed += 1
                if processed % 500000 == 0:
                    print(f"   📊 Processed {processed:,} nutrient rows...")
    except Exception as e:
        print(f"⚠️  Error reading food_nutrient.csv: {e}")
        return
    
    print(f"   ✅ Filtered nutrition data for {len(food_nutrients)} SR Legacy foods")
    print()
    
    # Process and import SR Legacy foods
    print("🔄 Processing SR Legacy foods and extracting nutrition...")
    imported = 0
    skipped = 0
    errors = 0
    batch = []
    batch_size = 100
    
    for sr_food in sr_legacy_foods:
        fdc_id = int(sr_food.get('fdc_id', 0))
        if fdc_id == 0:
            continue
        
        # Get food description
        description = food_lookup.get(fdc_id, '').strip()
        if not description:
            skipped += 1
            continue
        
        # Extract nutrition
        nutrition = extract_nutrition_for_food(fdc_id, food_nutrients)
        if not nutrition or not nutrition.get('calories'):
            skipped += 1
            continue
        
        # Prepare data for insert (use _per_100g column names)
        ingredient_data = {
            'ingredient_name': description,
            'source': 'usda_sr_legacy',
            'calories_per_100g': nutrition.get('calories'),
            'protein_per_100g': nutrition.get('protein'),
            'fat_per_100g': nutrition.get('fat'),
            'carbs_per_100g': nutrition.get('carbs'),
            'fiber_per_100g': nutrition.get('fiber'),
            'sugar_per_100g': nutrition.get('sugar'),
            'sodium_per_100g': nutrition.get('sodium'),
            'cholesterol_per_100g': nutrition.get('cholesterol'),
            'saturated_fat_per_100g': nutrition.get('saturated_fat'),
            'trans_fat_per_100g': nutrition.get('trans_fat'),
            'vitamin_a_per_100g': nutrition.get('vitamin_a'),
            'vitamin_c_per_100g': nutrition.get('vitamin_c'),
            'vitamin_d_per_100g': nutrition.get('vitamin_d'),
            'potassium_per_100g': nutrition.get('potassium'),
            'calcium_per_100g': nutrition.get('calcium'),
            'iron_per_100g': nutrition.get('iron')
        }
        
        batch.append(ingredient_data)
        
        if len(batch) >= batch_size:
            try:
                # Upsert batch
                for item in batch:
                    supabase.table('ingredient_nutrition').upsert(
                        item,
                        on_conflict='ingredient_name'
                    ).execute()
                imported += len(batch)
                print(f"   ✅ Imported {imported} foods...")
                batch = []
            except Exception as e:
                errors += len(batch)
                print(f"⚠️  Error importing batch: {e}")
                batch = []
    
    # Import final batch
    if batch:
        try:
            for item in batch:
                supabase.table('ingredient_nutrition').upsert(
                    item,
                    on_conflict='ingredient_name'
                ).execute()
            imported += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"⚠️  Error importing final batch: {e}")
    
    print()
    print("=" * 60)
    print(f"✅ IMPORT COMPLETE!")
    print(f"   Imported: {imported} SR Legacy foods")
    print(f"   Skipped: {skipped} foods (no nutrition data)")
    print(f"   Errors: {errors}")
    print()
    print("📊 Total USDA foods now available:")
    print(f"   - Foundation Foods: 340")
    print(f"   - SR Legacy Foods: {imported}")
    print(f"   - TOTAL: {340 + imported} foods to match against!")
    print()
    print("🚀 Next Steps:")
    print("   1. Run MATCH_INGREDIENTS_TO_USDA.py - Match YOUR ingredients to ALL USDA foods")
    print("   2. Run RECALCULATE_NUTRITION.sql - Fill missing nutrition for ALL recipes")
    print()

if __name__ == '__main__':
    main()

