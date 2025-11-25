#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import REAL USDA Foundation Foods data into Supabase
This processes the actual CSV files you downloaded - NO SAMPLE DATA
"""

import csv
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Load from .env.local in project root
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Path to your downloaded USDA data
USDA_DATA_DIR = Path(__file__).parent / "USDA_DATA"

# USDA Nutrient IDs (standard)
NUTRIENT_MAP = {
    'calories': 1008,      # Energy (kcal)
    'protein': 1003,       # Protein
    'fat': 1004,          # Total lipid (fat)
    'carbs': 1005,        # Carbohydrate, by difference
    'fiber': 1079,        # Fiber, total dietary
    'sugar': 2000,        # Sugars, total including NLEA
    'sodium': 1093,       # Sodium, Na
    'cholesterol': 1253,  # Cholesterol
    'saturated_fat': 1258, # Fatty acids, total saturated
    'trans_fat': 1257,    # Fatty acids, total trans
    'vitamin_a': 1106,    # Vitamin A, IU
    'vitamin_c': 1162,    # Vitamin C, total ascorbic acid
    'vitamin_d': 1114,    # Vitamin D (D2 + D3)
    'potassium': 1092,    # Potassium, K
    'calcium': 1087,      # Calcium, Ca
    'iron': 1089          # Iron, Fe
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
    nutrition = {key: None for key in NUTRIENT_MAP.keys()}
    
    # Find all nutrients for this food
    food_nutrient_rows = [
        fn for fn in food_nutrients 
        if str(fn.get('fdc_id', '')) == str(fdc_id)
    ]
    
    # Extract values
    for fn in food_nutrient_rows:
        nutrient_id = fn.get('nutrient_id', '')
        amount = fn.get('amount', '')
        
        if not nutrient_id or not amount:
            continue
        
        try:
            amount = float(amount)
        except:
            continue
        
        # Map nutrient ID to our field
        for field_name, usda_id in NUTRIENT_MAP.items():
            if str(nutrient_id) == str(usda_id):
                nutrition[field_name] = round(amount, 2)
    
    return nutrition

def main():
    print("🌾 Importing REAL USDA Foundation Foods Data")
    print("=" * 60)
    print()
    
    # Check if directory exists
    if not USDA_DATA_DIR.exists():
        print(f"❌ Directory not found: {USDA_DATA_DIR}")
        print()
        print("📁 Make sure USDA_DATA folder exists in Database/ folder")
        return
    
    print(f"📂 Reading from: {USDA_DATA_DIR}")
    print()
    
    # Read required CSV files (Foundation Foods only - these are raw ingredients)
    print("📖 Reading CSV files...")
    print("   ⚠️  This may take a minute - food_nutrient.csv is 1.6GB...")
    
    foundation_foods = read_csv_file(USDA_DATA_DIR / "foundation_food.csv")
    foods = read_csv_file(USDA_DATA_DIR / "food.csv")
    
    # For food_nutrient.csv (1.6GB), we'll process it in chunks
    # First, get all Foundation Food fdc_ids
    foundation_fdc_ids = set()
    for ff in foundation_foods:
        fdc_id = ff.get('fdc_id', '')
        if fdc_id:
            foundation_fdc_ids.add(str(fdc_id))
    
    print(f"   ✅ foundation_food.csv: {len(foundation_foods)} foods")
    print(f"   ✅ food.csv: {len(foods)} total foods")
    print(f"   🔍 Found {len(foundation_fdc_ids)} Foundation Food IDs")
    print()
    
    # Process food_nutrient.csv in chunks (it's 1.6GB!)
    print("📊 Processing food_nutrient.csv (this is the big one - 1.6GB)...")
    print("   Filtering for Foundation Foods only...")
    
    food_nutrients = []
    food_nutrient_file = USDA_DATA_DIR / "food_nutrient.csv"
    
    if not food_nutrient_file.exists():
        print(f"❌ File not found: {food_nutrient_file}")
        return
    
    # Read in chunks to avoid memory issues
    chunk_size = 100000
    processed = 0
    matched = 0
    
    try:
        with open(food_nutrient_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            chunk = []
            
            for row in reader:
                fdc_id = str(row.get('fdc_id', ''))
                if fdc_id in foundation_fdc_ids:
                    chunk.append(row)
                    matched += 1
                
                processed += 1
                if len(chunk) >= chunk_size:
                    food_nutrients.extend(chunk)
                    chunk = []
                    print(f"   Processed {processed:,} rows, matched {matched:,} Foundation Foods...")
            
            # Add remaining chunk
            if chunk:
                food_nutrients.extend(chunk)
    
    except Exception as e:
        print(f"❌ Error reading food_nutrient.csv: {e}")
        return
    
    print(f"   ✅ Filtered {matched:,} nutrient entries for Foundation Foods")
    print()
    
    if not foundation_foods:
        print("❌ No data found in foundation_food.csv!")
        print("   Make sure the CSV files are in Database/USDA_DATA/ folder")
        return
    
    if not food_nutrients:
        print("⚠️  No nutrient data found for Foundation Foods!")
        print("   This might take longer to process...")
        return
    
    # Create lookup: fdc_id -> food description
    food_lookup = {}
    for food in foods:
        fdc_id = food.get('fdc_id', '')
        description = food.get('description', '')
        if fdc_id and description:
            food_lookup[str(fdc_id)] = description
    
    # Process Foundation Foods (these are the research-grade ingredient data)
    print("🔄 Processing Foundation Foods and extracting nutrition...")
    imported = 0
    skipped = 0
    errors = 0
    
    # Process in batches to Supabase
    batch_size = 50
    batch = []
    
    for foundation_food in foundation_foods:
        fdc_id = foundation_food.get('fdc_id', '')
        if not fdc_id:
            skipped += 1
            continue
        
        # Get food description
        food_description = food_lookup.get(str(fdc_id), '')
        if not food_description:
            # Try to get from foundation_food table directly
            food_description = foundation_food.get('description', '')
        
        if not food_description:
            skipped += 1
            continue
        
        # Extract nutrition
        nutrition = extract_nutrition_for_food(fdc_id, food_nutrients)
        
        # Only import if we have some nutrition data
        if not any(v for v in nutrition.values() if v is not None):
            skipped += 1
            continue
        
        # Prepare data for database
        ingredient_name = food_description.lower().strip()
        nutrition_data = {
            'ingredient_name': ingredient_name,
            'calories_per_100g': nutrition['calories'],
            'protein_per_100g': nutrition['protein'],
            'fat_per_100g': nutrition['fat'],
            'carbs_per_100g': nutrition['carbs'],
            'fiber_per_100g': nutrition['fiber'],
            'sugar_per_100g': nutrition['sugar'],
            'sodium_per_100g': nutrition['sodium'],
            'cholesterol_per_100g': nutrition['cholesterol'],
            'saturated_fat_per_100g': nutrition['saturated_fat'],
            'trans_fat_per_100g': nutrition['trans_fat'],
            'vitamin_a_per_100g': nutrition['vitamin_a'],
            'vitamin_c_per_100g': nutrition['vitamin_c'],
            'vitamin_d_per_100g': nutrition['vitamin_d'],
            'potassium_per_100g': nutrition['potassium'],
            'calcium_per_100g': nutrition['calcium'],
            'iron_per_100g': nutrition['iron'],
            'source': 'usda_foundation'
        }
        
        # Add to batch
        batch.append(nutrition_data)
        
        # Insert batch when full
        if len(batch) >= batch_size:
            try:
                supabase.table('ingredient_nutrition').upsert(
                    batch,
                    on_conflict='ingredient_name'
                ).execute()
                
                imported += len(batch)
                batch = []
                
                if imported % 100 == 0:
                    print(f"   ✅ Imported {imported} foods...")
            except Exception as e:
                errors += len(batch)
                if errors <= 5:
                    print(f"⚠️  Error importing batch: {e}")
                batch = []
    
    # Insert remaining batch
    if batch:
        try:
            supabase.table('ingredient_nutrition').upsert(
                batch,
                on_conflict='ingredient_name'
            ).execute()
            imported += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"⚠️  Error importing final batch: {e}")
    
    print()
    print("=" * 60)
    print(f"✅ IMPORT COMPLETE!")
    print(f"   Imported: {imported} ingredient nutrition profiles")
    print(f"   Skipped: {skipped} foods (no nutrition data)")
    print(f"   Errors: {errors}")
    print()
    print("📊 What This Does:")
    print("   ✅ Creates ingredient nutrition lookup table")
    print("   ✅ Stores nutrition per 100g for each ingredient")
    print("   ✅ Ready to calculate missing values for your 230k recipes")
    print()
    print("🚀 Next Steps:")
    print("   1. Run MATCH_INGREDIENTS_TO_USDA.py - Matches YOUR ingredients to USDA")
    print("   2. Run CALCULATE_NUTRITION_FROM_INGREDIENTS.sql - Fills missing nutrition for ALL recipes")
    print()
    print("💡 This will fill in missing vitamins/minerals for your existing recipes!")

if __name__ == '__main__':
    main()

