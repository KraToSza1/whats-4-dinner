"""
=========================================
REPLACE REJECTED IMAGES
Re-downloads images for recipes that were rejected during review
=========================================

Usage:
1. Review images using REVIEW_IMAGES_VISUALLY.html
2. Export rejected list (saves to localStorage, or create rejected_list.json)
3. Run this script to re-download with better validation
"""

import json
import sys
import io
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import shutil

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

if not PEXELS_API_KEY:
    print("ERROR: PEXELS_API_KEY not found in .env.local")
    sys.exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Directories
DOWNLOAD_DIR = Path(__file__).parent / "downloaded_images"
REJECTED_DIR = Path(__file__).parent / "rejected_images"
REJECTED_DIR.mkdir(exist_ok=True)
REJECTED_LIST_FILE = Path(__file__).parent / "rejected_list.json"

def load_rejected_list():
    """Load list of rejected recipe IDs"""
    if REJECTED_LIST_FILE.exists():
        try:
            with open(REJECTED_LIST_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                return data.get("rejected", [])
        except:
            pass
    
    # Try to load from localStorage export (if user exported from HTML tool)
    print("No rejected_list.json found.")
    print("Create rejected_list.json with format: [\"recipe-id-1\", \"recipe-id-2\", ...]")
    return []

def move_to_rejected(recipe_id: str):
    """Move image to rejected folder"""
    for ext in [".jpg", ".png", ".webp"]:
        img_file = DOWNLOAD_DIR / f"{recipe_id}{ext}"
        if img_file.exists():
            rejected_file = REJECTED_DIR / img_file.name
            shutil.move(str(img_file), str(rejected_file))
            return True
    return False

def main():
    print("Replace Rejected Images")
    print("=" * 60)
    
    rejected_ids = load_rejected_list()
    
    if not rejected_ids:
        print("No rejected images found!")
        print("")
        print("To use this script:")
        print("1. Review images in REVIEW_IMAGES_VISUALLY.html")
        print("2. Export rejected list (or create rejected_list.json manually)")
        print("3. Run this script again")
        return
    
    print(f"Found {len(rejected_ids)} rejected images")
    print("")
    print("This script will:")
    print("1. Move rejected images to rejected_images/ folder")
    print("2. Re-download images using FETCH_RECIPE_IMAGES_PHASE1_DOWNLOAD_FIXED.py")
    print("")
    
    confirm = input("Continue? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Cancelled.")
        return
    
    # Move rejected images
    print("")
    print("Moving rejected images...")
    moved = 0
    for recipe_id in rejected_ids:
        if move_to_rejected(recipe_id):
            moved += 1
    
    print(f"Moved {moved} images to rejected_images/")
    print("")
    print("Next step:")
    print("Run: python Database/FETCH_RECIPE_IMAGES_PHASE1_DOWNLOAD_FIXED.py")
    print("It will skip already-downloaded images and re-download rejected ones")

if __name__ == "__main__":
    main()

