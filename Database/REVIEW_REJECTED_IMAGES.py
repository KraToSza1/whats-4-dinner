"""
=========================================
REVIEW AND REJECT BAD IMAGES
Helps identify and remove non-food images from downloaded_images folder
=========================================

This script helps you:
1. List all downloaded images with their recipe titles
2. Mark images as rejected (moves to rejected folder)
3. Generate a report of rejected images
"""

import os
import json
import shutil
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Directories
DOWNLOAD_DIR = Path(__file__).parent / "downloaded_images"
REJECTED_DIR = Path(__file__).parent / "rejected_images"
REJECTED_DIR.mkdir(exist_ok=True)
PROGRESS_FILE = Path(__file__).parent / "image_download_progress.json"
REJECTED_LOG = Path(__file__).parent / "rejected_images_log.json"

def load_progress():
    """Load download progress"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"downloaded": [], "failed": [], "rejected": []}

def load_rejected_log():
    """Load rejected images log"""
    if REJECTED_LOG.exists():
        try:
            with open(REJECTED_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"rejected": []}

def save_rejected_log(log):
    """Save rejected images log"""
    with open(REJECTED_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def get_recipe_title(recipe_id: str) -> str:
    """Get recipe title from database"""
    try:
        response = supabase.table("recipes").select("title").eq("id", recipe_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0].get("title", "Unknown")
    except:
        pass
    return "Unknown"

def list_all_images():
    """List all downloaded images with recipe info"""
    progress = load_progress()
    downloaded = progress.get("downloaded", [])
    
    print("=" * 80)
    print("📋 ALL DOWNLOADED IMAGES")
    print("=" * 80)
    print("")
    
    if not downloaded:
        print("No images found in progress file.")
        return
    
    # Get all image files
    image_files = list(DOWNLOAD_DIR.glob("*.jpg")) + list(DOWNLOAD_DIR.glob("*.png")) + list(DOWNLOAD_DIR.glob("*.webp"))
    
    print(f"Found {len(image_files)} image files")
    print(f"Found {len(downloaded)} entries in progress file")
    print("")
    
    # Create mapping
    recipe_map = {}
    for item in downloaded:
        if isinstance(item, dict):
            recipe_id = item.get("recipe_id")
            filename = item.get("filename")
            if recipe_id and filename:
                recipe_map[filename] = {
                    "recipe_id": recipe_id,
                    "recipe_title": item.get("recipe_title", "Unknown"),
                    "search_query": item.get("search_query", ""),
                    "alt": item.get("alt", "")
                }
    
    # List images
    for i, img_file in enumerate(image_files, 1):
        filename = img_file.name
        recipe_info = recipe_map.get(filename, {})
        recipe_id = recipe_info.get("recipe_id", filename.replace(".jpg", "").replace(".png", "").replace(".webp", ""))
        recipe_title = recipe_info.get("recipe_title") or get_recipe_title(recipe_id)
        
        print(f"{i}. {filename}")
        print(f"   Recipe: {recipe_title}")
        print(f"   Query: {recipe_info.get('search_query', 'N/A')}")
        if recipe_info.get("alt"):
            print(f"   Alt: {recipe_info['alt'][:60]}...")
        print("")

def reject_image(filename: str, reason: str = "Non-food image"):
    """Move image to rejected folder and log it"""
    img_file = DOWNLOAD_DIR / filename
    
    if not img_file.exists():
        print(f"❌ Image not found: {filename}")
        return False
    
    # Get recipe info
    progress = load_progress()
    recipe_info = None
    for item in progress.get("downloaded", []):
        if isinstance(item, dict) and item.get("filename") == filename:
            recipe_info = item
            break
    
    # Move to rejected folder
    rejected_file = REJECTED_DIR / filename
    shutil.move(str(img_file), str(rejected_file))
    
    # Log rejection
    log = load_rejected_log()
    log["rejected"] = log.get("rejected", [])
    log["rejected"].append({
        "filename": filename,
        "recipe_id": recipe_info.get("recipe_id") if recipe_info else None,
        "recipe_title": recipe_info.get("recipe_title") if recipe_info else "Unknown",
        "reason": reason,
        "rejected_at": str(Path(__file__).stat().st_mtime)
    })
    save_rejected_log(log)
    
    # Remove from downloaded list
    if recipe_info:
        progress["downloaded"] = [item for item in progress.get("downloaded", []) 
                                  if not (isinstance(item, dict) and item.get("filename") == filename)]
        with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
            json.dump(progress, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Rejected: {filename}")
    print(f"   Reason: {reason}")
    return True

def main():
    print("🔍 IMAGE REVIEW TOOL")
    print("=" * 80)
    print("")
    print("Options:")
    print("1. List all images")
    print("2. Reject an image (by filename)")
    print("3. Show rejected images log")
    print("")
    
    choice = input("Choose option (1-3): ").strip()
    
    if choice == "1":
        list_all_images()
    elif choice == "2":
        filename = input("Enter filename to reject: ").strip()
        reason = input("Reason (default: Non-food image): ").strip() or "Non-food image"
        reject_image(filename, reason)
    elif choice == "3":
        log = load_rejected_log()
        rejected = log.get("rejected", [])
        print(f"\n📋 Rejected Images: {len(rejected)}")
        print("=" * 80)
        for item in rejected:
            print(f"  - {item.get('filename')}")
            print(f"    Recipe: {item.get('recipe_title', 'Unknown')}")
            print(f"    Reason: {item.get('reason', 'N/A')}")
            print("")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()

