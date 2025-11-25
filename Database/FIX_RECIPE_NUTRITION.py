"""
Fix nutrition data for a specific recipe.
This script directly updates the recipe_nutrition table to fix incorrect values.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Recipe to fix
RECIPE_ID = "19df7313-2c1a-4825-aea0-db1dea74feda"
RECIPE_TITLE = "Three Cheese Enchiladas"

# Correct nutrition values (TOTAL for 6 servings)
# Per serving: 295 kcal
# Total for 6 servings: 1770 kcal
CORRECT_NUTRITION = {
    "calories": 1770,  # 295 per serving × 6 servings
    "protein": 78,     # 13 per serving × 6 servings
    "fat": 102,        # 17 per serving × 6 servings
    "carbs": 138,      # 23 per serving × 6 servings
    "fiber": 18,       # 3 per serving × 6 servings
    "sugar": 18,       # 3 per serving × 6 servings
    "sodium": 3780,    # 630 per serving × 6 servings
    "cholesterol": 240, # 40 per serving × 6 servings
    "saturated_fat": 48, # 8 per serving × 6 servings
    "trans_fat": 0,
    "vitamin_a": 2580,  # 430 per serving × 6 servings
    "vitamin_c": 12,    # 2 per serving × 6 servings
    "vitamin_d": 0,
    "potassium": 1140,  # 190 per serving × 6 servings
    "calcium": 1860,    # 310 per serving × 6 servings
    "iron": 7           # 1.2 per serving × 6 servings (rounded)
}

def main():
    print(f"🔧 Fixing nutrition for recipe: {RECIPE_TITLE}")
    print(f"📋 Recipe ID: {RECIPE_ID}")
    print()
    
    # Check current values
    print("📊 Checking current nutrition data...")
    nutrition_res = supabase.table("recipe_nutrition").select("*").eq("recipe_id", RECIPE_ID).execute()
    
    if not nutrition_res.data or len(nutrition_res.data) == 0:
        print("❌ No nutrition record found! Creating new record...")
        nutrition_data = {**CORRECT_NUTRITION, "recipe_id": RECIPE_ID}
        result = supabase.table("recipe_nutrition").insert(nutrition_data).execute()
        if result.data:
            print("✅ Created new nutrition record")
        else:
            print("❌ Failed to create nutrition record")
            return
    else:
        current = nutrition_res.data[0]
        print(f"📊 Current calories: {current.get('calories')}")
        print(f"📊 Expected calories: {CORRECT_NUTRITION['calories']}")
        print()
        
        if current.get('calories') == CORRECT_NUTRITION['calories']:
            print("✅ Nutrition data is already correct!")
            return
        
        # Update nutrition
        print("🔄 Updating nutrition data...")
        update_data = {**CORRECT_NUTRITION}
        result = supabase.table("recipe_nutrition").update(update_data).eq("recipe_id", RECIPE_ID).execute()
        
        if result.data:
            updated = result.data[0]
            print("✅ Nutrition updated successfully!")
            print(f"📊 New calories: {updated.get('calories')}")
            print(f"📊 Per serving (6 servings): {updated.get('calories') / 6:.1f} kcal")
        else:
            print("❌ Failed to update nutrition")
            return
    
    # Also update the recipes table calories field
    print()
    print("🔄 Updating recipe calories field...")
    recipe_result = supabase.table("recipes").update({
        "calories": CORRECT_NUTRITION["calories"],
        "has_complete_nutrition": True
    }).eq("id", RECIPE_ID).execute()
    
    if recipe_result.data:
        print("✅ Recipe calories field updated!")
    else:
        print("⚠️ Failed to update recipe calories field (non-critical)")
    
    # Verify
    print()
    print("🔍 Verifying update...")
    verify_res = supabase.table("recipe_nutrition").select("calories, protein, fat, carbs").eq("recipe_id", RECIPE_ID).execute()
    if verify_res.data:
        verified = verify_res.data[0]
        print(f"✅ Verified calories: {verified.get('calories')}")
        print(f"✅ Per serving: {verified.get('calories') / 6:.1f} kcal")
        if verified.get('calories') == CORRECT_NUTRITION['calories']:
            print("✅ Values match! Fix complete.")
        else:
            print("⚠️ Values don't match - there may be an issue")
    else:
        print("❌ Verification failed")

if __name__ == "__main__":
    main()

