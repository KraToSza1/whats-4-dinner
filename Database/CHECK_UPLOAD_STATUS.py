"""Quick check of upload status"""
from pathlib import Path
import json
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

download_dir = Path(__file__).parent / "downloaded_images"
upload_progress_file = Path(__file__).parent / "image_upload_progress.json"
download_progress_file = Path(__file__).parent / "image_download_progress.json"

# Count files in folder
files = list(download_dir.glob("*.jpg")) + list(download_dir.glob("*.png")) + list(download_dir.glob("*.webp"))
print(f"📁 Images in downloaded_images folder: {len(files)}")

# Check upload progress
if upload_progress_file.exists():
    with open(upload_progress_file, 'r') as f:
        upload_data = json.load(f)
    uploaded = upload_data.get('uploaded', [])
    failed = upload_data.get('failed', [])
    print(f"✅ Already uploaded: {len(uploaded)}")
    print(f"❌ Failed uploads: {len(failed)}")
    
    # Get uploaded IDs
    uploaded_ids = set()
    for item in uploaded:
        if isinstance(item, dict):
            uploaded_ids.add(item.get('recipe_id'))
        else:
            uploaded_ids.add(item)
    
    # Check which files haven't been uploaded
    not_uploaded = []
    for f in files:
        recipe_id = f.stem
        if recipe_id not in uploaded_ids:
            not_uploaded.append(f)
    
    print(f"📤 Files ready to upload: {len(not_uploaded)}")
    if not_uploaded:
        print(f"\nFirst 10 files to upload:")
        for f in not_uploaded[:10]:
            print(f"   - {f.name}")
else:
    print("⚠️  No upload progress file found")

# Check download progress
if download_progress_file.exists():
    with open(download_progress_file, 'r') as f:
        download_data = json.load(f)
    downloaded_ids = download_data.get('downloaded_ids', [])
    print(f"\n📥 Total downloaded (from progress): {len(downloaded_ids)}")

