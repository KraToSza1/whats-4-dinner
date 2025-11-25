"""
Quick script to add image for a specific recipe
"""

import os
import sys
import requests
import json
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not PEXELS_API_KEY:
    print("ERROR: PEXELS_API_KEY not found")
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Supabase credentials not found")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
PEXELS_BASE_URL = "https://api.pexels.com/v1/search"

def get_search_query(recipe_title: str) -> str:
    """Create optimized search query - MUFFIN SPECIFIC"""
    query = recipe_title.lower().strip()
    
    # Extract key food terms
    food_terms = []
    if "muffin" in query:
        food_terms.append("muffin")
    if "pumpkin" in query:
        food_terms.append("pumpkin")
    if "pie" in query:
        food_terms.append("pie")
    
    # Build focused query
    if food_terms:
        query = " ".join(food_terms[:2])  # Use 2 most relevant terms
    else:
        # Fallback: clean title
        stop_words = ["recipe", "recipes", "dish", "meal", "how to", "easy", "best", "amazing", "gluten", "free"]
        for word in stop_words:
            query = query.replace(word, "").strip()
    
    # Always add "muffin" if it's a muffin recipe
    if "muffin" in recipe_title.lower() and "muffin" not in query:
        query = f"muffin {query}"
    
    return query.strip()

def search_pexels_image(query: str, recipe_title: str = ""):
    """Search Pexels for food image - validate it matches"""
    try:
        headers = {"Authorization": PEXELS_API_KEY}
        params = {
            "query": query,
            "per_page": 15,  # Get more results to find best match
            "orientation": "landscape",
        }
        response = requests.get(PEXELS_BASE_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        photos = data.get("photos", [])
        
        if not photos:
            return None
        
        # Score photos by relevance
        best_photo = None
        best_score = -1
        
        title_lower = recipe_title.lower()
        is_muffin = "muffin" in title_lower
        
        for photo in photos:
            score = 0
            alt_text = (photo.get("alt", "") or "").lower()
            
            # Check if it's actually the right food type
            if is_muffin:
                if "muffin" in alt_text:
                    score += 10
                elif "bread" in alt_text or "cake" in alt_text or "baked" in alt_text:
                    score += 5
                # Penalize wrong food types
                if any(word in alt_text for word in ["turkey", "chicken", "roast", "dinner", "meal", "table", "person", "people"]):
                    score -= 20
            
            # Check for key ingredients
            if "pumpkin" in title_lower and "pumpkin" in alt_text:
                score += 5
            
            # Prefer food photos
            if any(word in alt_text for word in ["food", "dish", "recipe", "cooking", "baking"]):
                score += 2
            
            if score > best_score:
                best_score = score
                best_photo = photo
        
        # Only return if we found a good match
        if best_photo and best_score >= 0:
            return best_photo.get("src", {}).get("large") or best_photo.get("src", {}).get("medium")
        
        # Fallback to first result if no good match
        if photos:
            return photos[0].get("src", {}).get("large") or photos[0].get("src", {}).get("medium")
            
    except Exception as e:
        print(f"Pexels search error: {e}")
    return None

def upload_image_to_supabase(image_url: str, recipe_id: str) -> str:
    """Download and upload image to Supabase"""
    try:
        # Download image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Get file extension
        content_type = response.headers.get("content-type", "image/jpeg")
        ext = ".jpg"
        if "png" in content_type:
            ext = ".png"
        elif "webp" in content_type:
            ext = ".webp"
        
        filename = f"{recipe_id}{ext}"
        file_data = response.content
        
        # Upload to Supabase (upsert to replace existing)
        bucket = supabase.storage.from_("recipe-images")
        # Try to remove existing file first
        try:
            bucket.remove([filename])
        except:
            pass  # File might not exist
        
        result = bucket.upload(
            filename,
            file_data,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        if result and (not hasattr(result, 'error') or not result.error):
            # Get public URL
            public_url_response = bucket.get_public_url(filename)
            if isinstance(public_url_response, dict):
                if 'data' in public_url_response and isinstance(public_url_response['data'], dict):
                    return public_url_response['data'].get('publicUrl')
                elif 'publicUrl' in public_url_response:
                    return public_url_response['publicUrl']
            elif isinstance(public_url_response, str):
                return public_url_response
    except Exception as e:
        print(f"Upload error: {e}")
    return None

def add_image_for_recipe(recipe_title: str):
    """Find recipe and add image"""
    print(f"Searching for recipe: {recipe_title}")
    
    # Search for recipe
    try:
        response = supabase.table("recipes").select("id,title,hero_image_url").ilike("title", f"%{recipe_title}%").limit(5).execute()
        recipes = response.data if response.data else []
        
        if not recipes:
            print(f"Recipe not found: {recipe_title}")
            return
        
        # Find exact or closest match
        recipe = None
        for r in recipes:
            if recipe_title.lower() in r.get("title", "").lower():
                recipe = r
                break
        
        if not recipe:
            recipe = recipes[0]
        
        recipe_id = recipe["id"]
        found_title = recipe.get("title", "")
        current_image = recipe.get("hero_image_url")
        
        print(f"Found recipe: {found_title}")
        print(f"Recipe ID: {recipe_id}")
        
        if current_image:
            print(f"Already has image: {current_image}")
            print("Replacing with better match...")
        
        # Search for image
        search_query = get_search_query(found_title)
        print(f"Searching Pexels for: {search_query}")
        
        image_url = search_pexels_image(search_query, found_title)
        if not image_url:
            print("No image found")
            return
        
        print(f"Found image, uploading...")
        
        # Upload to Supabase
        public_url = upload_image_to_supabase(image_url, recipe_id)
        if not public_url:
            print("Upload failed")
            return
        
        # Update recipe
        supabase.table("recipes").update({"hero_image_url": public_url}).eq("id", recipe_id).execute()
        
        print(f"SUCCESS!")
        print(f"Image URL: {public_url}")
        print(f"Recipe updated!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    recipe_title = "pumpkin pie muffins"
    if len(sys.argv) > 1:
        recipe_title = " ".join(sys.argv[1:])
    add_image_for_recipe(recipe_title)

