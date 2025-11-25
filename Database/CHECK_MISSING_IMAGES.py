"""Quick check of how many recipes need images"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Count recipes without images
print("Checking recipes without images...")
response = supabase.table("recipes").select("id", count="exact").eq("source", "csv_import").eq("has_complete_nutrition", True).or_("hero_image_url.is.null,hero_image_url.eq.").limit(1).execute()

total_without = response.count if hasattr(response, 'count') else 0

# Also check total recipes
total_response = supabase.table("recipes").select("id", count="exact").eq("source", "csv_import").eq("has_complete_nutrition", True).limit(1).execute()
total_recipes = total_response.count if hasattr(total_response, 'count') else 0

print(f"Total recipes: {total_recipes}")
print(f"Recipes without images: {total_without}")
print(f"Recipes with images: {total_recipes - total_without}")

