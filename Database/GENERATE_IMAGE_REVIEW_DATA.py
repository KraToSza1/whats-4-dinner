"""
=========================================
GENERATE IMAGE REVIEW DATA
Creates image_data.json for the visual review tool
=========================================

Run this to generate the data file for REVIEW_IMAGES_VISUALLY.html
"""

import json
import sys
import io
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Directories
DOWNLOAD_DIR = Path(__file__).parent / "downloaded_images"
PROGRESS_FILE = Path(__file__).parent / "image_download_progress.json"
UPLOAD_PROGRESS_FILE = Path(__file__).parent / "image_upload_progress.json"
OUTPUT_FILE = Path(__file__).parent / "image_data.json"

def load_progress():
    """Load download progress"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"downloaded": [], "failed": []}

def load_upload_progress():
    """Load upload progress"""
    if UPLOAD_PROGRESS_FILE.exists():
        try:
            with open(UPLOAD_PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"uploaded": [], "failed": []}

def get_recipe_info(recipe_id: str):
    """Get recipe info from database"""
    try:
        response = supabase.table("recipes").select("id,title,hero_image_url").eq("id", recipe_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
    except:
        pass
    return None

def main():
    print("Generating image review data...")
    print("=" * 60)
    
    # Load progress files
    download_progress = load_progress()
    upload_progress = load_upload_progress()
    
    # Get uploaded images with URLs
    uploaded_dict = {}
    for item in upload_progress.get("uploaded", []):
        if isinstance(item, dict):
            recipe_id = item.get("recipe_id")
            if recipe_id:
                uploaded_dict[recipe_id] = {
                    "public_url": item.get("public_url"),
                    "recipe_title": item.get("recipe_title")
                }
    
    # Get all downloaded images
    downloaded_ids = download_progress.get("downloaded", [])
    downloaded_items = download_progress.get("downloaded", [])
    
    # Handle both formats
    if downloaded_ids and isinstance(downloaded_ids[0], str):
        # New format: list of IDs
        image_files = list(DOWNLOAD_DIR.glob("*.jpg")) + list(DOWNLOAD_DIR.glob("*.png")) + list(DOWNLOAD_DIR.glob("*.webp"))
        for recipe_id in downloaded_ids:
            for img_file in image_files:
                if img_file.stem == recipe_id:
                    downloaded_items.append({
                        "recipe_id": recipe_id,
                        "filename": img_file.name,
                        "file_path": str(img_file)
                    })
                    break
    
    print(f"Found {len(downloaded_items)} downloaded images")
    print("Fetching recipe info from database...")
    
    # Build image data
    images_data = []
    processed = 0
    
    for item in downloaded_items:
        processed += 1
        if processed % 50 == 0:
            print(f"  Processed {processed}/{len(downloaded_items)}...")
        
        recipe_id = item.get("recipe_id") if isinstance(item, dict) else item
        filename = item.get("filename") if isinstance(item, dict) else None
        
        # Get recipe info
        recipe_info = get_recipe_info(recipe_id)
        if not recipe_info:
            continue
        
        # Check if uploaded
        uploaded_info = uploaded_dict.get(recipe_id, {})
        
        image_data = {
            "recipe_id": recipe_id,
            "recipe_title": recipe_info.get("title", "Unknown"),
            "filename": filename or f"{recipe_id}.jpg",
            "public_url": uploaded_info.get("public_url") or recipe_info.get("hero_image_url"),
            "search_query": item.get("search_query", "") if isinstance(item, dict) else "",
            "alt": item.get("alt", "") if isinstance(item, dict) else ""
        }
        
        images_data.append(image_data)
    
    # Save to JSON
    output_data = {
        "total": len(images_data),
        "generated_at": str(Path(__file__).stat().st_mtime),
        "images": images_data
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print("")
    print("=" * 60)
    print(f"SUCCESS!")
    print(f"Generated: {OUTPUT_FILE}")
    print(f"Total images: {len(images_data)}")
    print("")
    print("Next steps:")
    print("1. Open REVIEW_IMAGES_VISUALLY.html in your browser")
    print("2. Review images and mark as approved/rejected")
    print("3. Export rejected list and re-download with FIXED script")

if __name__ == "__main__":
    main()

