"""
=========================================
PHASE 2: UPLOAD DOWNLOADED IMAGES TO SUPABASE
Uploads images from local PC to Supabase storage
Can run anytime after Phase 1 completes
=========================================

Setup:
1. Run Phase 1 first to download images
2. Run: python FETCH_RECIPE_IMAGES_PHASE2_UPLOAD.py
3. Uploads all images from Database/downloaded_images/
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import json
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Supabase credentials not found in .env.local")
    sys.exit(1)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Local storage paths
DOWNLOAD_DIR = Path(__file__).parent / "downloaded_images"
PROGRESS_FILE = Path(__file__).parent / "image_download_progress.json"
UPLOAD_PROGRESS_FILE = Path(__file__).parent / "image_upload_progress.json"

def load_download_progress():
    """Load download progress"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Handle both old format (list of dicts) and new format (list of IDs)
                downloaded = data.get("downloaded", [])
                if downloaded and isinstance(downloaded[0], str):
                    # New format: list of recipe IDs
                    return {"downloaded_ids": downloaded, "downloaded": []}
                return data
        except:
            pass
    return {"downloaded": [], "failed": [], "downloaded_ids": []}

def load_upload_progress():
    """Load upload progress"""
    if UPLOAD_PROGRESS_FILE.exists():
        try:
            with open(UPLOAD_PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"uploaded": [], "failed": []}

def save_upload_progress(progress):
    """Save upload progress"""
    with open(UPLOAD_PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

def upload_image_to_supabase(file_path: Path, recipe_id: str, content_type: str) -> str:
    """Upload image file to Supabase storage"""
    try:
        bucket = supabase.storage.from_("recipe-images")
        
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload (use recipe_id as filename)
        filename = file_path.name
        result = bucket.upload(
            filename,
            file_data,
            file_options={"content-type": content_type}
        )
        
        # Check if upload was successful
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
        
        return None
    except Exception as e:
        print(f"   ⚠️  Upload error: {e}")
        return None

def update_recipe_image_url(recipe_id: str, image_url: str):
    """Update hero_image_url in recipes table"""
    try:
        supabase.table("recipes").update({"hero_image_url": image_url}).eq("id", recipe_id).execute()
        return True
    except Exception as e:
        print(f"   ⚠️  Update error: {e}")
        return False

def get_recipe_title(recipe_id: str) -> str:
    """Get recipe title from database"""
    try:
        response = supabase.table("recipes").select("title").eq("id", recipe_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0].get("title", "Unknown")
    except:
        pass
    return "Unknown"

def main():
    print("PHASE 2: Upload Images to Supabase")
    print("=" * 60)
    
    # Load progress
    download_progress = load_download_progress()
    upload_progress = load_upload_progress()
    
    uploaded_ids = set()
    if isinstance(upload_progress.get("uploaded"), list):
        for item in upload_progress.get("uploaded", []):
            if isinstance(item, dict):
                uploaded_ids.add(item.get("recipe_id"))
            else:
                uploaded_ids.add(item)
    
    failed_upload_ids = set()
    if isinstance(upload_progress.get("failed"), list):
        for item in upload_progress.get("failed", []):
            if isinstance(item, dict):
                failed_upload_ids.add(item.get("recipe_id"))
            else:
                failed_upload_ids.add(item)
    
    # Get list of downloaded images - handle both formats
    downloaded_items = download_progress.get("downloaded", [])
    downloaded_ids = download_progress.get("downloaded_ids", [])
    
    # Also scan actual files in folder (in case progress file is missing/outdated)
    image_files = list(DOWNLOAD_DIR.glob("*.jpg")) + list(DOWNLOAD_DIR.glob("*.png")) + list(DOWNLOAD_DIR.glob("*.webp"))
    files_in_folder = {f.stem: f for f in image_files}
    
    # Handle case where downloaded_items is a list of strings (recipe IDs)
    if downloaded_items and isinstance(downloaded_items[0], str):
        # Convert list of IDs to list of dicts
        temp_items = []
        for recipe_id in downloaded_items:
            if isinstance(recipe_id, str) and recipe_id in files_in_folder:
                img_file = files_in_folder[recipe_id]
                temp_items.append({
                    "recipe_id": recipe_id,
                    "filename": img_file.name,
                    "file_path": str(img_file),
                    "content_type": "image/jpeg"
                })
        downloaded_items = temp_items
    
    # Convert downloaded_ids to items format if needed
    if downloaded_ids and not downloaded_items:
        for recipe_id in downloaded_ids:
            if isinstance(recipe_id, str) and recipe_id in files_in_folder:
                img_file = files_in_folder[recipe_id]
                downloaded_items.append({
                    "recipe_id": recipe_id,
                    "filename": img_file.name,
                    "file_path": str(img_file),
                    "content_type": "image/jpeg"
                })
    
    # Always scan folder for all images (in case there are more than in progress file)
    # This ensures we upload ALL images in the folder, not just those in the progress file
    print(f"📁 Scanning folder for images...")
    folder_image_ids = set()
    for img_file in image_files:
        recipe_id = img_file.stem
        folder_image_ids.add(recipe_id)
        # Add to downloaded_items if not already there
        if not any(item.get("recipe_id") == recipe_id if isinstance(item, dict) else item == recipe_id for item in downloaded_items):
            downloaded_items.append({
                "recipe_id": recipe_id,
                "filename": img_file.name,
                "file_path": str(img_file),
                "content_type": "image/jpeg" if img_file.suffix == ".jpg" else "image/png" if img_file.suffix == ".png" else "image/webp"
            })
    
    print(f"   Found {len(folder_image_ids)} images in folder")
    print(f"   Total items to process: {len(downloaded_items)}")
    
    if not downloaded_items:
        print("ERROR: No downloaded images found!")
        print("   Run Phase 1 first: python FETCH_RECIPE_IMAGES_PHASE1_DOWNLOAD.py")
        return
    
    # Filter out already uploaded
    to_upload = []
    for item in downloaded_items:
        recipe_id = item.get("recipe_id") if isinstance(item, dict) else item
        if recipe_id not in uploaded_ids and recipe_id not in failed_upload_ids:
            if isinstance(item, dict):
                to_upload.append(item)
            else:
                # Convert to dict format
                img_file = None
                for ext in [".jpg", ".png", ".webp"]:
                    test_file = DOWNLOAD_DIR / f"{recipe_id}{ext}"
                    if test_file.exists():
                        img_file = test_file
                        break
                if img_file:
                    to_upload.append({
                        "recipe_id": recipe_id,
                        "filename": img_file.name,
                        "file_path": str(img_file),
                        "content_type": "image/jpeg"
                    })
    
    if not to_upload:
        print("All images already uploaded!")
        print(f"   Uploaded: {len(uploaded_ids)}")
        print(f"   Failed: {len(failed_upload_ids)}")
        return
    
    total = len(to_upload)
    print(f"Found {total} images to upload")
    print(f"   Already uploaded: {len(uploaded_ids)}")
    print(f"   Previously failed: {len(failed_upload_ids)}")
    print("")
    
    processed = 0
    success = 0
    failed = 0
    
    try:
        for item in to_upload:
            processed += 1
            recipe_id = item.get("recipe_id") if isinstance(item, dict) else item
            recipe_title = item.get("recipe_title") if isinstance(item, dict) else None
            if not recipe_title:
                recipe_title = get_recipe_title(recipe_id)
            recipe_title = recipe_title or "Unknown"
            file_path = Path(item.get("file_path") if isinstance(item, dict) else DOWNLOAD_DIR / f"{recipe_id}.jpg")
            content_type = item.get("content_type", "image/jpeg") if isinstance(item, dict) else "image/jpeg"
            
            print(f"[{processed}/{total}] Uploading: {recipe_title[:50]}...")
            
            # Check file exists
            if not file_path.exists():
                print(f"   ERROR: File not found: {file_path}")
                failed_upload_ids.add(recipe_id)
                failed += 1
                continue
            
            # Upload to Supabase
            public_url = upload_image_to_supabase(file_path, recipe_id, content_type)
            
            if not public_url:
                print(f"   ERROR: Upload failed")
                failed_upload_ids.add(recipe_id)
                failed += 1
                continue
            
            # Update database
            if update_recipe_image_url(recipe_id, public_url):
                uploaded_ids.add(recipe_id)
                upload_progress.setdefault("uploaded", []).append({
                    "recipe_id": recipe_id,
                    "recipe_title": recipe_title,
                    "public_url": public_url
                })
                
                # Delete local file after successful upload
                try:
                    if file_path.exists():
                        file_path.unlink()
                        print(f"   ✅ Uploaded & deleted local file")
                    else:
                        print(f"   ✅ Uploaded (local file already gone)")
                except Exception as e:
                    print(f"   ✅ Uploaded (but failed to delete local: {e})")
                
                success += 1
            else:
                print(f"   ❌ ERROR: Database update failed")
                failed_upload_ids.add(recipe_id)
                failed += 1
            
            # Save progress every 10 uploads
            if processed % 10 == 0:
                upload_progress["uploaded"] = [{"recipe_id": rid} if isinstance(rid, str) else rid for rid in uploaded_ids]
                upload_progress["failed"] = list(failed_upload_ids)
                save_upload_progress(upload_progress)
                print(f"")
                print(f"Progress: {processed}/{total} | SUCCESS: {success} | FAILED: {failed}")
                print(f"Progress saved!")
                print(f"")
    
    except KeyboardInterrupt:
        print("\n\nInterrupted by user!")
        print("Saving progress...")
        upload_progress["uploaded"] = [{"recipe_id": rid} if isinstance(rid, str) else rid for rid in uploaded_ids]
        upload_progress["failed"] = list(failed_upload_ids)
        save_upload_progress(upload_progress)
        print("Progress saved! You can resume later.")
    
    # Final save
    upload_progress["uploaded"] = [{"recipe_id": rid} if isinstance(rid, str) else rid for rid in uploaded_ids]
    upload_progress["failed"] = list(failed_upload_ids)
    save_upload_progress(upload_progress)
    
    # Check remaining files in folder
    remaining_files = list(DOWNLOAD_DIR.glob("*.jpg")) + list(DOWNLOAD_DIR.glob("*.png")) + list(DOWNLOAD_DIR.glob("*.webp"))
    remaining_count = len(remaining_files)
    
    print("")
    print("=" * 60)
    print(f"Upload Complete!")
    print(f"   Processed: {processed}")
    print(f"   Success: {success}")
    print(f"   Failed: {failed}")
    print(f"   Total uploaded: {len(uploaded_ids)}")
    print("")
    if remaining_count > 0:
        print(f"📁 Remaining files in folder: {remaining_count}")
        print(f"   (These are either failed uploads or new downloads)")
    else:
        print(f"✅ All uploaded images deleted from local folder!")
    print("")
    print("Images are now live in your app!")

if __name__ == "__main__":
    main()

