"""
=========================================
PHASE 1: DOWNLOAD IMAGES TO LOCAL PC (FIXED)
Downloads images with recipe IDs as filenames
VALIDATES images are food-related before saving
=========================================

Improvements:
- Gets multiple results and picks best food match
- Validates images are food-related (not people, random objects)
- Better search queries focused on food
- Filters out inappropriate images
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

# Configuration
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not PEXELS_API_KEY:
    print("❌ ERROR: PEXELS_API_KEY not found in .env.local")
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Supabase credentials not found in .env.local")
    sys.exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pexels API configuration
PEXELS_BASE_URL = "https://api.pexels.com/v1/search"
RATE_LIMIT_PER_HOUR = 200  # Free tier limit
DELAY_BETWEEN_REQUESTS = 3600 / RATE_LIMIT_PER_HOUR  # ~18 seconds between requests

# Local storage
DOWNLOAD_DIR = Path(__file__).parent / "downloaded_images"
DOWNLOAD_DIR.mkdir(exist_ok=True)
PROGRESS_FILE = Path(__file__).parent / "image_download_progress.json"

# Food-related keywords for validation
FOOD_KEYWORDS = [
    "food", "dish", "meal", "recipe", "cooking", "cuisine", "restaurant", "kitchen",
    "chicken", "beef", "pork", "fish", "salmon", "shrimp", "pasta", "rice", 
    "potato", "tomato", "cheese", "chocolate", "cake", "bread", "pizza", "soup", 
    "salad", "cookie", "apple", "banana", "berry", "mushroom", "onion", "garlic",
    "pepper", "carrot", "broccoli", "spinach", "lettuce", "avocado", "egg",
    "dessert", "breakfast", "lunch", "dinner", "snack", "beverage", "drink",
    "ingredient", "spice", "herb", "vegetable", "fruit", "meat", "seafood"
]

# Keywords that indicate NON-FOOD images (people, objects, etc.)
NON_FOOD_KEYWORDS = [
    "person", "people", "woman", "man", "girl", "boy", "child", "children",
    "portrait", "face", "smile", "laughing", "posing", "model", "fashion",
    "building", "architecture", "landscape", "nature", "sky", "ocean", "beach",
    "car", "vehicle", "technology", "computer", "phone", "book", "text"
]

def load_progress():
    """Load download progress from JSON file"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {
        "downloaded": [],
        "failed": [],
        "rejected": []  # Images that were rejected for being non-food
    }

def save_progress(progress):
    """Save download progress to JSON file"""
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

def extract_key_ingredients(title: str) -> list:
    """Extract main ingredients from recipe title for better matching"""
    food_keywords = [
        "chicken", "beef", "pork", "fish", "salmon", "shrimp", "pasta", "rice", 
        "potato", "potatoes", "tomato", "tomatoes", "cheese", "chocolate", 
        "cake", "bread", "pizza", "soup", "salad", "cookie", "cookies",
        "apple", "banana", "strawberry", "berry", "berries", "mushroom",
        "onion", "garlic", "pepper", "peppers", "carrot", "carrots",
        "broccoli", "spinach", "lettuce", "avocado", "egg", "eggs",
        "pancake", "waffle", "muffin", "pie", "tart", "brownie", "cookie",
        "burger", "sandwich", "taco", "burrito", "quesadilla", "pasta",
        "noodle", "stir", "fry", "roast", "grill", "bake", "steak"
    ]
    
    title_lower = title.lower()
    found_ingredients = []
    
    for keyword in food_keywords:
        if keyword in title_lower:
            found_ingredients.append(keyword)
    
    return found_ingredients[:3]

def get_search_query(recipe_title: str, cuisine: str = None) -> str:
    """Create optimized search query for Pexels - FOOD FOCUSED with better matching"""
    title_lower = recipe_title.lower()
    
    # Extract specific food type keywords
    food_type_keywords = ["muffin", "cookie", "cake", "bread", "pie", "tart", "soup", "salad", 
                          "pasta", "pizza", "burger", "sandwich", "stew", "casserole", 
                          "pancake", "waffle", "brownie", "cookie", "biscuit"]
    
    # Check for specific food types
    found_types = []
    for keyword in food_type_keywords:
        if keyword in title_lower:
            found_types.append(keyword)
    
    # Extract main ingredients
    ingredients = extract_key_ingredients(recipe_title)
    
    # Build query prioritizing food type
    if found_types:
        query_parts = [found_types[0]]  # Primary food type
        if ingredients:
            query_parts.append(ingredients[0])  # Main ingredient
        query = " ".join(query_parts)
    elif ingredients:
        query_parts = ingredients[:2]
        query = " ".join(query_parts)
    else:
        # Fallback: clean title
        query = recipe_title.lower().strip()
        stop_words = ["recipe", "recipes", "dish", "meal", "how to", "easy", "best", 
                     "amazing", "quick", "simple", "delicious", "homemade", "copycat", 
                     "style", "s", "favorite", "favourite", "gluten", "free"]
        for word in stop_words:
            query = query.replace(word, "").strip()
        query = query.strip()
    
    # Add cuisine if available and relevant
    if cuisine:
        if isinstance(cuisine, list) and len(cuisine) > 0:
            cuisine_str = cuisine[0].lower()
            if cuisine_str not in ["other", "unknown"] and len(query.split()) < 3:
                query = f"{query} {cuisine_str}"
        elif isinstance(cuisine, str) and cuisine.strip():
            cuisine_str = cuisine.lower()
            if cuisine_str not in ["other", "unknown"] and len(query.split()) < 3:
                query = f"{query} {cuisine_str}"
    
    return query.strip()

def is_food_image(photo_data: dict, recipe_title: str = "") -> bool:
    """Validate that image is food-related, not people/objects - IMPROVED"""
    # Check photo description and alt text
    text_to_check = ""
    
    if photo_data.get("alt"):
        text_to_check += photo_data["alt"].lower() + " "
    if photo_data.get("photographer"):
        text_to_check += photo_data["photographer"].lower() + " "
    
    # Check for non-food keywords (strong rejection)
    for keyword in NON_FOOD_KEYWORDS:
        if keyword in text_to_check:
            return False
    
    # Check for food keywords (strong acceptance)
    food_score = 0
    for keyword in FOOD_KEYWORDS:
        if keyword in text_to_check:
            food_score += 1
    
    # Validate food type matches recipe type
    title_lower = recipe_title.lower()
    food_type_keywords = {
        "muffin": ["muffin", "cupcake"],
        "cookie": ["cookie", "biscuit"],
        "cake": ["cake", "dessert"],
        "bread": ["bread", "loaf"],
        "soup": ["soup", "broth"],
        "salad": ["salad", "greens"],
        "pasta": ["pasta", "noodle", "spaghetti"],
        "pizza": ["pizza"],
        "burger": ["burger", "sandwich"],
        "pancake": ["pancake", "waffle"]
    }
    
    # Check if recipe type matches image
    for food_type, keywords in food_type_keywords.items():
        if food_type in title_lower:
            # Recipe is this type - check if image matches
            if any(kw in text_to_check for kw in keywords):
                food_score += 5  # Strong match
            # Penalize if image shows wrong food type
            wrong_types = ["turkey", "chicken", "roast", "dinner", "table", "person", "people", "portrait"]
            if any(wt in text_to_check for wt in wrong_types):
                return False
    
    # If we found food keywords, it's likely food
    if food_score >= 1:
        return True
    
    # If no food keywords but also no non-food keywords, check URL
    photo_url = photo_data.get("src", {}).get("large", "") or photo_data.get("src", {}).get("medium", "")
    if any(keyword in photo_url.lower() for keyword in ["food", "dish", "meal", "cooking", "recipe"]):
        return True
    
    # Default: if we can't tell, reject it (better safe than sorry)
    return False

def search_pexels_image(query: str, api_key: str, recipe_title: str):
    """Search Pexels for food images and return the best validated match"""
    try:
        headers = {"Authorization": api_key}
        params = {
            "query": query,
            "per_page": 10,  # Get multiple results to find best match
            "orientation": "landscape",
        }
        
        response = requests.get(PEXELS_BASE_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        photos = data.get("photos", [])
        
        if not photos:
            return None
        
        # Score and validate each photo
        best_photo = None
        best_score = -1
        
        for photo in photos:
            # Validate it's food-related (pass recipe title for better validation)
            if not is_food_image(photo, recipe_title):
                continue
            
            # Score based on relevance
            score = 0
            photo_text = (photo.get("alt", "") + " " + query).lower()
            
            # Check if query terms appear in photo description
            query_terms = query.lower().split()
            for term in query_terms:
                if term in photo_text:
                    score += 2
            
            # Prefer photos with food keywords
            for keyword in FOOD_KEYWORDS:
                if keyword in photo_text:
                    score += 1
            
            if score > best_score:
                best_score = score
                best_photo = photo
        
        # If we found a validated food image, return it
        if best_photo:
            return {
                "url": best_photo.get("src", {}).get("large") or best_photo.get("src", {}).get("medium"),
                "alt": best_photo.get("alt", ""),
                "score": best_score
            }
        
        # If no validated food images found, return None
        return None
        
    except Exception as e:
        print(f"   ⚠️  Pexels search error: {e}")
        return None

def download_image(image_data: dict, recipe_id: str) -> dict:
    """Download image and save locally with recipe ID"""
    try:
        image_url = image_data["url"]
        
        # Download image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Get file extension from content type
        content_type = response.headers.get("content-type", "image/jpeg")
        ext = ".jpg"
        if "png" in content_type:
            ext = ".png"
        elif "webp" in content_type:
            ext = ".webp"
        
        # Save file with recipe ID as filename
        filename = f"{recipe_id}{ext}"
        file_path = DOWNLOAD_DIR / filename
        
        with open(file_path, 'wb') as f:
            f.write(response.content)
        
        return {
            "success": True,
            "filename": filename,
            "file_path": str(file_path),
            "content_type": content_type,
            "size_bytes": len(response.content),
            "alt": image_data.get("alt", "")
        }
    except Exception as e:
        print(f"   ⚠️  Download error: {e}")
        return {"success": False, "error": str(e)}

def main():
    print("🚀 PHASE 1: Download Images to Local PC (FIXED - WITH VALIDATION)")
    print("=" * 60)
    print(f"📊 Pexels API: {RATE_LIMIT_PER_HOUR} requests/hour (free tier)")
    print(f"💾 Download folder: {DOWNLOAD_DIR}")
    print(f"📝 Progress file: {PROGRESS_FILE}")
    print("")
    print("✅ VALIDATION ENABLED: Only food-related images will be downloaded")
    print("")
    
    # Load progress
    progress = load_progress()
    downloaded_ids = set()
    failed_ids = set()
    rejected_ids = set()
    
    # Convert old format to new format
    if isinstance(progress.get("downloaded"), list):
        for item in progress.get("downloaded", []):
            if isinstance(item, dict):
                downloaded_ids.add(item.get("recipe_id"))
            else:
                downloaded_ids.add(item)
    
    if isinstance(progress.get("failed"), list):
        for item in progress.get("failed", []):
            if isinstance(item, dict):
                failed_ids.add(item.get("recipe_id"))
            else:
                failed_ids.add(item)
    
    rejected_ids = set(progress.get("rejected", []))
    
    print(f"📋 Resuming: {len(downloaded_ids)} downloaded, {len(failed_ids)} failed, {len(rejected_ids)} rejected")
    print("")
    
    # Get recipes without images - process in batches
    # Get ALL recipes without images (not just those with complete nutrition)
    print("📋 Fetching recipes without images...")
    batch_size = 1000
    offset = 0
    recipes = []
    
    while True:
        # Get all recipes without images (no filter on has_complete_nutrition)
        recipes_response = supabase.table("recipes").select("id,title,cuisine,hero_image_url").eq("source", "csv_import").or_("hero_image_url.is.null,hero_image_url.eq.").range(offset, offset + batch_size - 1).execute()
        batch = recipes_response.data if recipes_response.data else []
        if not batch:
            break
        recipes.extend([r for r in batch if not r.get("hero_image_url") or not r["hero_image_url"].strip()])
        offset += batch_size
        if len(batch) < batch_size:
            break
    
    # Filter out already processed
    recipes = [r for r in recipes if r["id"] not in downloaded_ids and r["id"] not in failed_ids and r["id"] not in rejected_ids]
    
    if not recipes:
        print("✅ All recipes already processed!")
        print(f"   Downloaded: {len(downloaded_ids)}")
        print(f"   Failed: {len(failed_ids)}")
        print(f"   Rejected: {len(rejected_ids)}")
        return
    
    total_recipes = len(recipes)
    print(f"📊 Found {total_recipes} recipes to download")
    print("")
    
    processed = 0
    success = 0
    failed = 0
    rejected = 0
    
    try:
        for recipe in recipes:
            processed += 1
            recipe_id = recipe["id"]
            recipe_title = recipe.get("title", "")
            cuisine = recipe.get("cuisine")
            
            if not recipe_title:
                print(f"[{processed}/{total_recipes}] ⚠️  Skipping: No title (ID: {recipe_id})")
                failed_ids.add(recipe_id)
                failed += 1
                continue
            
            print(f"[{processed}/{total_recipes}] 🔍 {recipe_title[:50]}...")
            
            # Create search query
            search_query = get_search_query(recipe_title, cuisine)
            print(f"   🔎 Query: '{search_query}'")
            
            # Search Pexels with validation
            image_data = search_pexels_image(search_query, PEXELS_API_KEY, recipe_title)
            
            if not image_data:
                print(f"   ❌ No valid food image found (all results were non-food)")
                rejected_ids.add(recipe_id)
                rejected += 1
                time.sleep(DELAY_BETWEEN_REQUESTS)
                continue
            
            print(f"   ✅ Found food image (score: {image_data.get('score', 0)})")
            if image_data.get("alt"):
                print(f"   📝 Alt: {image_data['alt'][:60]}...")
            
            # Download image
            print(f"   📥 Downloading...")
            result = download_image(image_data, recipe_id)
            
            if result["success"]:
                downloaded_ids.add(recipe_id)
                progress["downloaded"] = progress.get("downloaded", [])
                if isinstance(progress["downloaded"], list):
                    progress["downloaded"].append({
                        "recipe_id": recipe_id,
                        "recipe_title": recipe_title,
                        "filename": result["filename"],
                        "file_path": result["file_path"],
                        "content_type": result["content_type"],
                        "size_bytes": result["size_bytes"],
                        "search_query": search_query,
                        "alt": result.get("alt", "")
                    })
                print(f"   ✅ Saved: {result['filename']} ({result['size_bytes']//1024}KB)")
                success += 1
            else:
                failed_ids.add(recipe_id)
                progress["failed"] = progress.get("failed", [])
                if isinstance(progress["failed"], list):
                    progress["failed"].append({
                        "recipe_id": recipe_id,
                        "recipe_title": recipe_title,
                        "error": result.get("error", "Unknown error")
                    })
                print(f"   ❌ Download failed")
                failed += 1
            
            # Save progress every 10 recipes
            if processed % 10 == 0:
                progress["rejected"] = list(rejected_ids)
                save_progress(progress)
                print(f"")
                print(f"📊 Progress: {processed}/{total_recipes} | ✅ {success} | ❌ {failed} | 🚫 {rejected}")
                print(f"💾 Progress saved!")
                print(f"")
            
            # Rate limiting
            time.sleep(DELAY_BETWEEN_REQUESTS)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user!")
        print("💾 Saving progress...")
        progress["rejected"] = list(rejected_ids)
        save_progress(progress)
        print("✅ Progress saved! You can resume later.")
    
    # Final save
    progress["rejected"] = list(rejected_ids)
    save_progress(progress)
    
    print("")
    print("=" * 60)
    print(f"🎉 Download Complete!")
    print(f"   Processed: {processed}")
    print(f"   Success: {success}")
    print(f"   Failed: {failed}")
    print(f"   Rejected (non-food): {rejected}")
    print(f"   Total downloaded: {len(downloaded_ids)}")
    print("")
    print(f"💾 Images saved to: {DOWNLOAD_DIR}")
    print(f"📝 Progress saved to: {PROGRESS_FILE}")
    print("")
    print("🚀 Next step: Run PHASE2_UPLOAD.py to upload images to Supabase")

if __name__ == "__main__":
    main()

