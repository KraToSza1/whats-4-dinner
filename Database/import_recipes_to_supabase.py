#!/usr/bin/env python3
"""
Import RAW_recipes.csv into Supabase database
This script transforms the CSV format to match your database schema
"""

import csv
import json
import sys
import uuid
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Supabase credentials (set these in .env or environment)
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Use service role key for bulk imports

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")
    print("Set these in .env file or export as environment variables")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def parse_json_array(text):
    """Parse JSON array string, handle various formats"""
    if not text or text.strip() == '':
        return []
    try:
        # Clean up the string
        text = text.strip()
        if text.startswith('[') and text.endswith(']'):
            return json.loads(text)
        else:
            # Try to parse as comma-separated values
            items = [item.strip().strip("'\"") for item in text.split(',')]
            return [item for item in items if item]
    except:
        return []

def parse_nutrition(nutrition_array, servings):
    """Parse nutrition array: [calories, total_fat, sugar, sodium, protein, saturated_fat, carbs]
    Returns dict with per-serving values"""
    if not nutrition_array or len(nutrition_array) < 7:
        return None
    
    # Original array format: [calories, total_fat, sugar, sodium, protein, saturated_fat, carbs]
    # Note: These might be per-recipe totals, so we divide by servings
    servings = max(servings, 1)  # Avoid division by zero
    
    return {
        'calories': int(float(nutrition_array[0]) / servings) if nutrition_array[0] else 0,
        'fat': int(float(nutrition_array[1]) / servings) if nutrition_array[1] else 0,
        'sugar': int(float(nutrition_array[2]) / servings) if nutrition_array[2] else 0,
        'sodium': int(float(nutrition_array[3]) / servings) if nutrition_array[3] else 0,
        'protein': int(float(nutrition_array[4]) / servings) if nutrition_array[4] else 0,
        'saturated_fat': int(float(nutrition_array[5]) / servings) if nutrition_array[5] else None,
        'carbs': int(float(nutrition_array[6]) / servings) if nutrition_array[6] else 0,
        # Defaults for missing fields
        'fiber': None,
        'cholesterol': None,
        'trans_fat': None,
        'vitamin_a': None,
        'vitamin_c': None,
        'vitamin_d': None,
        'potassium': None,
        'calcium': None,
        'iron': None,
    }

def extract_tags(tags_array):
    """Extract cuisine, meal_types, diets, occasions from tags"""
    cuisine = []
    meal_types = []
    diets = []
    occasions = []
    
    if not tags_array:
        return cuisine, meal_types, diets, occasions
    
    # Common cuisine keywords
    cuisine_keywords = ['italian', 'mexican', 'chinese', 'japanese', 'indian', 'thai', 
                       'mediterranean', 'american', 'british', 'spanish', 'greek', 
                       'french', 'korean', 'vietnamese', 'caribbean', 'african', 
                       'middle-eastern', 'german', 'brazilian', 'moroccan', 'turkish']
    
    # Meal types
    meal_keywords = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer']
    
    # Diets
    diet_keywords = ['vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'dairy-free',
                    'nut-free', 'low-carb', 'low-fat', 'low-sodium']
    
    # Occasions
    occasion_keywords = ['weeknight', 'weekend', 'holiday', 'party', 'picnic', 'brunch']
    
    for tag in tags_array:
        tag_lower = tag.lower().replace('_', '-').replace(' ', '-')
        
        # Check cuisine
        for cuis in cuisine_keywords:
            if cuis in tag_lower:
                cuisine.append(cuis.title())
                break
        
        # Check meal type
        for meal in meal_keywords:
            if meal in tag_lower:
                meal_types.append(meal)
                break
        
        # Check diet
        for diet in diet_keywords:
            if diet in tag_lower:
                diets.append(diet)
                break
        
        # Check occasion
        for occ in occasion_keywords:
            if occ in tag_lower:
                occasions.append(occ)
                break
    
    return list(set(cuisine)), list(set(meal_types)), list(set(diets)), list(set(occasions))

def determine_difficulty(tags_array, minutes):
    """Determine difficulty based on tags and cooking time"""
    if not tags_array:
        tags_lower = []
    else:
        tags_lower = [tag.lower() for tag in tags_array]
    
    if 'easy' in ' '.join(tags_lower) or minutes < 30:
        return 'easy'
    elif 'hard' in ' '.join(tags_lower) or minutes > 120:
        return 'hard'
    else:
        return 'medium'

def upsert_ingredient(name):
    """Upsert ingredient and return its UUID"""
    # Try to find existing ingredient
    result = supabase.table('ingredients').select('id').eq('name', name).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]['id']
    
    # Create new ingredient
    new_ingredient = {
        'id': str(uuid.uuid4()),
        'name': name,
        'default_unit': 'unit',  # Default, can be updated later
    }
    
    supabase.table('ingredients').insert(new_ingredient).execute()
    return new_ingredient['id']

def import_recipes(csv_file, limit=None):
    """Import recipes from CSV file"""
    print(f"🚀 Starting import from {csv_file}...")
    
    recipes_imported = 0
    recipes_failed = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for idx, row in enumerate(reader, 1):
            if limit and idx > limit:
                break
            
            try:
                # Parse data
                recipe_id = str(uuid.uuid4())
                title = row['name'].strip()
                description = row.get('description', '').strip()[:500]  # Limit length
                total_minutes = int(row.get('minutes', 0) or 0)
                servings = int(row.get('n_ingredients', 4) or 4)  # Default to 4 if not specified
                
                # Estimate prep/cook time (split 60/40)
                prep_minutes = int(total_minutes * 0.4)
                cook_minutes = int(total_minutes * 0.6)
                
                # Parse arrays
                tags_array = parse_json_array(row.get('tags', '[]'))
                nutrition_array = parse_json_array(row.get('nutrition', '[]'))
                steps_array = parse_json_array(row.get('steps', '[]'))
                ingredients_array = parse_json_array(row.get('ingredients', '[]'))
                
                # Extract metadata from tags
                cuisine, meal_types, diets, occasions = extract_tags(tags_array)
                difficulty = determine_difficulty(tags_array, total_minutes)
                
                # Parse nutrition
                nutrition = parse_nutrition(nutrition_array, servings)
                
                # Create recipe
                recipe = {
                    'id': recipe_id,
                    'title': title,
                    'description': description if description else f"A delicious {title} recipe.",
                    'prep_minutes': prep_minutes,
                    'cook_minutes': cook_minutes,
                    'servings': max(servings, 1),
                    'difficulty': difficulty,
                    'cuisine': cuisine if cuisine else ['Other'],
                    'meal_types': meal_types if meal_types else ['dinner'],
                    'diets': diets,
                    'occasions': occasions,
                    'calories': nutrition['calories'] if nutrition else None,
                    'author': 'Community',
                    'source': 'csv_import',
                    'hero_image_url': '',  # Empty, will use fallback
                }
                
                # Insert recipe
                supabase.table('recipes').insert(recipe).execute()
                
                # Insert nutrition
                if nutrition:
                    nutrition['recipe_id'] = recipe_id
                    supabase.table('recipe_nutrition').insert(nutrition).execute()
                
                # Insert steps
                for step_idx, step_text in enumerate(steps_array, 1):
                    if step_text and step_text.strip():
                        step = {
                            'id': str(uuid.uuid4()),
                            'recipe_id': recipe_id,
                            'position': step_idx,
                            'instruction': step_text.strip(),
                            'timer_seconds': 0,
                        }
                        supabase.table('recipe_steps').insert(step).execute()
                
                # Insert tags
                for tag in tags_array[:10]:  # Limit to 10 tags
                    if tag and tag.strip():
                        tag_entry = {
                            'recipe_id': recipe_id,
                            'tag': tag.strip()[:50],  # Limit length
                        }
                        supabase.table('recipe_tags').insert(tag_entry).execute()
                
                # Insert ingredients (simplified - just name, no quantity/unit parsing)
                for ing_idx, ing_name in enumerate(ingredients_array):
                    if ing_name and ing_name.strip():
                        try:
                            ingredient_id = upsert_ingredient(ing_name.strip())
                            recipe_ingredient = {
                                'id': str(uuid.uuid4()),
                                'recipe_id': recipe_id,
                                'ingredient_id': ingredient_id,
                                'quantity': 1,  # Default, needs manual update
                                'unit': 'unit',
                                'preparation': '',
                                'optional': False,
                                'order_index': ing_idx,
                            }
                            supabase.table('recipe_ingredients').insert(recipe_ingredient).execute()
                        except Exception as e:
                            print(f"  ⚠️  Failed to add ingredient {ing_name}: {e}")
                            continue
                
                recipes_imported += 1
                
                if idx % 100 == 0:
                    print(f"  ✅ Imported {idx} recipes...")
                    
            except Exception as e:
                recipes_failed += 1
                print(f"  ❌ Failed to import recipe {idx} ({row.get('name', 'unknown')}): {e}")
                continue
    
    print(f"\n✅ Import complete!")
    print(f"   Imported: {recipes_imported}")
    print(f"   Failed: {recipes_failed}")

if __name__ == '__main__':
    csv_file = 'RAW_recipes.csv'
    limit = None  # Set to a number to limit imports for testing
    
    # Check if limit argument provided
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
        print(f"⚠️  Limiting import to {limit} recipes for testing")
    
    import_recipes(csv_file, limit)

