#!/usr/bin/env python3
"""
Build Ingredient Nutrition Database using USDA FoodData Central API
This script queries the USDA API for nutrition data and stores it in a lookup table
"""

import requests
import time
import json
import sys
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# USDA API Configuration
USDA_API_KEY = os.getenv('USDA_API_KEY')
USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'

# Supabase Configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not USDA_API_KEY:
    print("❌ ERROR: Missing USDA_API_KEY in .env file")
    print("Get your free API key at: https://fdc.nal.usda.gov/api-guide.html")
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing Supabase credentials")
    sys.exit(1)

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def search_usda_food(query):
    """Search USDA FoodData Central for a food item"""
    params = {
        'api_key': USDA_API_KEY,
        'query': query,
        'pageSize': 1,  # Get top result
        'dataType': ['Foundation', 'SR Legacy']  # Most accurate data types
    }
    
    try:
        response = requests.get(USDA_API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('foods') and len(data['foods']) > 0:
            return data['foods'][0]
        return None
    except Exception as e:
        print(f"⚠️  Error searching for '{query}': {e}")
        return None

def extract_nutrition(food_data):
    """Extract nutrition values from USDA food data"""
    if not food_data or 'foodNutrients' not in food_data:
        return None
    
    nutrition = {
        'calories_per_100g': None,
        'protein_per_100g': None,
        'fat_per_100g': None,
        'carbs_per_100g': None,
        'fiber_per_100g': None,
        'sugar_per_100g': None,
        'sodium_per_100g': None,
        'cholesterol_per_100g': None,
        'saturated_fat_per_100g': None,
        'trans_fat_per_100g': None,
        'vitamin_a_per_100g': None,  # in IU
        'vitamin_c_per_100g': None,  # in mg
        'vitamin_d_per_100g': None,  # in IU
        'potassium_per_100g': None,  # in mg
        'calcium_per_100g': None,    # in mg
        'iron_per_100g': None        # in mg
    }
    
    # USDA nutrient IDs (these are standard)
    nutrient_map = {
        'calories': 1008,  # Energy (kcal)
        'protein': 1003,   # Protein
        'fat': 1004,      # Total lipid (fat)
        'carbs': 1005,    # Carbohydrate, by difference
        'fiber': 1079,    # Fiber, total dietary
        'sugar': 2000,    # Sugars, total including NLEA
        'sodium': 1093,   # Sodium, Na
        'cholesterol': 1253, # Cholesterol
        'saturated_fat': 1258, # Fatty acids, total saturated
        'trans_fat': 1257,    # Fatty acids, total trans
        'vitamin_a': 1106,    # Vitamin A, IU
        'vitamin_c': 1162,    # Vitamin C, total ascorbic acid
        'vitamin_d': 1114,    # Vitamin D (D2 + D3)
        'potassium': 1092,    # Potassium, K
        'calcium': 1087,      # Calcium, Ca
        'iron': 1089          # Iron, Fe
    }
    
    # Extract nutrients
    for nutrient in food_data.get('foodNutrients', []):
        nutrient_id = nutrient.get('nutrient', {}).get('id')
        amount = nutrient.get('amount')
        
        if amount is None:
            continue
        
        # Map nutrient ID to our field
        for key, usda_id in nutrient_map.items():
            if nutrient_id == usda_id:
                field_name = f"{key}_per_100g"
                if field_name in nutrition:
                    nutrition[field_name] = round(amount, 2)
    
    return nutrition

def get_unique_ingredients():
    """Get all unique ingredients from database"""
    try:
        result = supabase.table('ingredients').select('id, name').execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Error fetching ingredients: {e}")
        return []

def save_ingredient_nutrition(ingredient_name, nutrition_data):
    """Save nutrition data to database"""
    try:
        # Check if table exists, create if not
        # For now, we'll use a simple approach: store in a JSON column or separate table
        
        # Option 1: Create ingredient_nutrition table (run SQL first)
        # Option 2: Store in ingredients table as JSON
        
        # For now, print what we'd save
        print(f"✅ {ingredient_name}: {json.dumps(nutrition_data, indent=2)}")
        
        # TODO: Insert into ingredient_nutrition table
        # supabase.table('ingredient_nutrition').upsert({
        #     'ingredient_name': ingredient_name,
        #     **nutrition_data
        # }).execute()
        
    except Exception as e:
        print(f"⚠️  Error saving nutrition for {ingredient_name}: {e}")

def main():
    print("🔍 Building Ingredient Nutrition Database from USDA API...")
    print(f"📊 API Key: {USDA_API_KEY[:10]}...")
    print()
    
    # Get all unique ingredients
    ingredients = get_unique_ingredients()
    print(f"📦 Found {len(ingredients)} unique ingredients")
    print()
    
    # Process ingredients (limit for testing)
    processed = 0
    found = 0
    not_found = 0
    
    for ingredient in ingredients[:50]:  # Start with first 50 for testing
        ingredient_name = ingredient['name']
        print(f"🔍 Searching: {ingredient_name}...", end=' ')
        
        # Search USDA
        food_data = search_usda_food(ingredient_name)
        
        if food_data:
            nutrition = extract_nutrition(food_data)
            if nutrition:
                save_ingredient_nutrition(ingredient_name, nutrition)
                found += 1
                print("✅ Found")
            else:
                print("⚠️  No nutrition data")
                not_found += 1
        else:
            print("❌ Not found")
            not_found += 1
        
        processed += 1
        
        # Rate limiting (USDA allows 1000 requests/hour)
        time.sleep(0.1)  # 100ms delay = ~600 requests/hour
        
        if processed % 10 == 0:
            print(f"\n📊 Progress: {processed}/{len(ingredients)} processed ({found} found, {not_found} not found)\n")
    
    print(f"\n✅ Complete! Processed {processed} ingredients")
    print(f"   Found: {found}")
    print(f"   Not found: {not_found}")
    print(f"\n💡 Next steps:")
    print(f"   1. Review the results above")
    print(f"   2. Create ingredient_nutrition table in database")
    print(f"   3. Run this script again to save to database")
    print(f"   4. Run CALCULATE_NUTRITION_FROM_INGREDIENTS.sql to calculate recipe nutrition")

if __name__ == '__main__':
    main()

