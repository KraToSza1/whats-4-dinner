#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Match YOUR ingredients to USDA foods and populate ingredient_nutrition table
This uses REAL matching - no samples, only actual data
"""

import os
import sys
from pathlib import Path
from difflib import SequenceMatcher
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

def similarity(a, b):
    """Calculate similarity between two strings (0-1)"""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def normalize_ingredient_name(name):
    """Normalize ingredient name for better matching"""
    name = name.lower().strip()
    # Remove common prefixes/suffixes
    name = name.replace('fresh ', '').replace('dried ', '').replace('raw ', '')
    name = name.replace(' whole', '').replace(' chopped', '').replace(' diced', '')
    name = name.replace(' sliced', '').replace(' minced', '').replace(' grated', '')
    # Remove extra spaces
    name = ' '.join(name.split())
    return name

def find_best_usda_match(ingredient_name, usda_foods, min_similarity=0.5):
    """Find best matching USDA food for an ingredient (lowered threshold to 0.5)"""
    best_match = None
    best_score = 0
    
    ingredient_lower = ingredient_name.lower().strip()
    ingredient_normalized = normalize_ingredient_name(ingredient_name)
    
    for usda_food in usda_foods:
        usda_name = usda_food.get('ingredient_name', '').lower().strip()
        usda_normalized = normalize_ingredient_name(usda_food.get('ingredient_name', ''))
        
        # Exact match (normalized)
        if usda_normalized == ingredient_normalized:
            return usda_food, 1.0
        
        # Check if ingredient name is in USDA name or vice versa (normalized)
        if ingredient_normalized in usda_normalized or usda_normalized in ingredient_normalized:
            score = similarity(ingredient_normalized, usda_normalized)
            if score > best_score:
                best_score = score
                best_match = usda_food
        
        # Similarity match (normalized) - lowered threshold
        score = similarity(ingredient_normalized, usda_normalized)
        if score > best_score and score >= min_similarity:
            best_score = score
            best_match = usda_food
    
    return best_match, best_score

def main():
    print("🔍 Matching YOUR Ingredients to USDA Foods")
    print("=" * 60)
    print()
    
    # Get all your ingredients
    print("📦 Fetching YOUR ingredients from database...")
    try:
        ingredients_result = supabase.table('ingredients').select('id, name').execute()
        ingredients = ingredients_result.data if ingredients_result.data else []
        print(f"   ✅ Found {len(ingredients)} ingredients")
    except Exception as e:
        print(f"❌ Error fetching ingredients: {e}")
        return
    
    if not ingredients:
        print("❌ No ingredients found in database!")
        return
    
    # Get ALL USDA foods (Foundation + SR Legacy) from ingredient_nutrition table
    # Handle pagination to get ALL foods (Supabase default limit is 1000)
    print("🌾 Fetching ALL USDA foods (Foundation + SR Legacy)...")
    print("   ⚠️  This may take a moment - fetching ALL 8,096+ foods...")
    try:
        usda_foods = []
        page_size = 1000
        offset = 0
        
        while True:
            # Fetch page of USDA foods
            usda_result = supabase.table('ingredient_nutrition').select('*').in_('source', ['usda_foundation', 'usda_sr_legacy']).range(offset, offset + page_size - 1).execute()
            
            if not usda_result.data or len(usda_result.data) == 0:
                break
            
            usda_foods.extend(usda_result.data)
            offset += page_size
            
            if len(usda_result.data) < page_size:
                break  # Last page
        
        foundation_count = sum(1 for f in usda_foods if f.get('source') == 'usda_foundation')
        sr_legacy_count = sum(1 for f in usda_foods if f.get('source') == 'usda_sr_legacy')
        
        print(f"   ✅ Found {len(usda_foods)} total USDA foods")
        print(f"      - Foundation Foods: {foundation_count}")
        print(f"      - SR Legacy Foods: {sr_legacy_count}")
    except Exception as e:
        print(f"❌ Error fetching USDA foods: {e}")
        print("   Make sure you've run IMPORT_USDA_REAL_DATA.py and IMPORT_SR_LEGACY_FOODS.py first")
        return
    
    if not usda_foods:
        print("❌ No USDA foods found!")
        print("   Please run IMPORT_USDA_REAL_DATA.py first to import USDA data")
        return
    
    # Match ingredients
    print()
    print("🔗 Matching ingredients...")
    matched = 0
    already_matched = 0
    unmatched = []
    
    for ingredient in ingredients:
        ingredient_name = ingredient['name']
        ingredient_lower = ingredient_name.lower().strip()
        
        # Check if already matched
        existing = supabase.table('ingredient_nutrition').select('*').eq('ingredient_name', ingredient_lower).execute()
        if existing.data and existing.data[0].get('ingredient_id'):
            already_matched += 1
            continue
        
        # Find best match
        best_match, score = find_best_usda_match(ingredient_name, usda_foods, min_similarity=0.5)
        
        if best_match and score >= 0.5:
            # Link ingredient to USDA nutrition
            try:
                # Update existing or create new entry
                supabase.table('ingredient_nutrition').upsert({
                    'ingredient_name': ingredient_lower,
                    'ingredient_id': ingredient['id'],
                    'calories_per_100g': best_match.get('calories_per_100g'),
                    'protein_per_100g': best_match.get('protein_per_100g'),
                    'fat_per_100g': best_match.get('fat_per_100g'),
                    'carbs_per_100g': best_match.get('carbs_per_100g'),
                    'fiber_per_100g': best_match.get('fiber_per_100g'),
                    'sugar_per_100g': best_match.get('sugar_per_100g'),
                    'sodium_per_100g': best_match.get('sodium_per_100g'),
                    'cholesterol_per_100g': best_match.get('cholesterol_per_100g'),
                    'saturated_fat_per_100g': best_match.get('saturated_fat_per_100g'),
                    'trans_fat_per_100g': best_match.get('trans_fat_per_100g'),
                    'vitamin_a_per_100g': best_match.get('vitamin_a_per_100g'),
                    'vitamin_c_per_100g': best_match.get('vitamin_c_per_100g'),
                    'vitamin_d_per_100g': best_match.get('vitamin_d_per_100g'),
                    'potassium_per_100g': best_match.get('potassium_per_100g'),
                    'calcium_per_100g': best_match.get('calcium_per_100g'),
                    'iron_per_100g': best_match.get('iron_per_100g'),
                    'source': 'usda_matched'
                }, on_conflict='ingredient_name').execute()
                
                matched += 1
                if matched % 50 == 0:
                    print(f"   ✅ Matched {matched} ingredients...")
            except Exception as e:
                print(f"⚠️  Error matching {ingredient_name}: {e}")
                unmatched.append(ingredient_name)
        else:
            unmatched.append(ingredient_name)
    
    print()
    print("=" * 60)
    print(f"✅ MATCHING COMPLETE!")
    print(f"   Newly matched: {matched} ingredients")
    print(f"   Already matched: {already_matched} ingredients")
    print(f"   Unmatched: {len(unmatched)} ingredients")
    
    if unmatched:
        print()
        print("📋 Unmatched ingredients (first 20):")
        for name in unmatched[:20]:
            print(f"   - {name}")
        print()
        print("💡 These can be added manually or will need better matching")

if __name__ == '__main__':
    main()

