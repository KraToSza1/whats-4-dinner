#!/usr/bin/env python3
"""
Quick script to check and fix has_complete_nutrition flag for a specific recipe
"""
import os
import sys
import io
from dotenv import load_dotenv
from supabase import create_client, Client

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try loading .env.local from project root
from pathlib import Path
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Recipe ID to check
RECIPE_ID = "6a325698-8366-4697-b318-803f6baf78ec"

print(f"🔍 Checking recipe: {RECIPE_ID}")

# Check current status
response = supabase.table("recipes").select("id,title,has_complete_nutrition,hero_image_url").eq("id", RECIPE_ID).execute()

if not response.data or len(response.data) == 0:
    print(f"❌ Recipe not found: {RECIPE_ID}")
    sys.exit(1)

recipe = response.data[0]
print(f"✅ Recipe found: {recipe['title']}")
print(f"   Current has_complete_nutrition: {recipe['has_complete_nutrition']}")
print(f"   Has image: {bool(recipe.get('hero_image_url'))}")

# Check if recipe has ingredients
ingredients_response = supabase.table("recipe_ingredients").select("id", count="exact").eq("recipe_id", RECIPE_ID).execute()
ingredients_count = ingredients_response.count if hasattr(ingredients_response, 'count') else len(ingredients_response.data or [])
print(f"   Ingredients count: {ingredients_count}")

# Check if recipe has steps
steps_response = supabase.table("recipe_steps").select("id", count="exact").eq("recipe_id", RECIPE_ID).execute()
steps_count = steps_response.count if hasattr(steps_response, 'count') else len(steps_response.data or [])
print(f"   Steps count: {steps_count}")

# Check if recipe has nutrition
nutrition_response = supabase.table("recipe_nutrition").select("id").eq("recipe_id", RECIPE_ID).execute()
has_nutrition = len(nutrition_response.data or []) > 0
print(f"   Has nutrition data: {has_nutrition}")

# Determine if recipe should have complete flag
should_have_flag = (
    recipe.get('hero_image_url') and
    ingredients_count > 0 and
    steps_count > 0 and
    has_nutrition
)

print(f"\n📊 Recipe completeness check:")
print(f"   Should have flag: {should_have_flag}")
print(f"   Currently has flag: {recipe['has_complete_nutrition']}")

if should_have_flag and not recipe['has_complete_nutrition']:
    print(f"\n🔧 Setting has_complete_nutrition = true...")
    update_response = supabase.table("recipes").update({
        "has_complete_nutrition": True
    }).eq("id", RECIPE_ID).execute()
    
    if update_response.data:
        print(f"✅ Successfully set has_complete_nutrition = true")
        print(f"   Recipe will now appear in search results!")
    else:
        print(f"❌ Failed to update recipe")
elif recipe['has_complete_nutrition']:
    print(f"\n✅ Recipe already has has_complete_nutrition = true")
else:
    print(f"\n⚠️ Recipe is missing some data:")
    if not recipe.get('hero_image_url'):
        print(f"   - Missing hero_image_url")
    if ingredients_count == 0:
        print(f"   - Missing ingredients")
    if steps_count == 0:
        print(f"   - Missing steps")
    if not has_nutrition:
        print(f"   - Missing nutrition data")
    print(f"\n   Recipe needs to be completed before it can be marked as complete.")

