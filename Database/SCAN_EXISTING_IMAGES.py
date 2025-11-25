"""
=========================================
SCAN EXISTING DOWNLOADED IMAGES
Helps identify potentially bad images from the 997 already downloaded
=========================================

This scans through your downloaded_images folder and helps identify:
- Images that might not be food-related
- Images that need manual review
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
SCAN_REPORT = Path(__file__).parent / "image_scan_report.json"

def load_progress():
    """Load download progress"""
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"downloaded": [], "failed": [], "rejected": []}

def get_recipe_title(recipe_id: str) -> str:
    """Get recipe title from database"""
    try:
        response = supabase.table("recipes").select("title").eq("id", recipe_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0].get("title", "Unknown")
    except:
        pass
    return "Unknown"

def analyze_search_query(query: str) -> dict:
    """Analyze search query for potential issues"""
    issues = []
    query_lower = query.lower()
    
    # Check for vague queries
    vague_terms = ["other food", "food", "other", "cake", "bread", "cookie"]
    if query_lower in vague_terms or query_lower.count(" ") == 0:
        issues.append("Vague query - might return random results")
    
    # Check for non-food terms
    non_food_terms = ["woman", "man", "person", "people", "portrait", "fashion"]
    for term in non_food_terms:
        if term in query_lower:
            issues.append(f"Contains non-food term: {term}")
    
    return {
        "has_issues": len(issues) > 0,
        "issues": issues
    }

def scan_images():
    """Scan all downloaded images and identify potential issues"""
    progress = load_progress()
    downloaded = progress.get("downloaded", [])
    
    print("Scanning downloaded images...")
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
    
    # Analyze each image
    suspicious = []
    vague_queries = []
    
    for item in downloaded:
        if not isinstance(item, dict):
            continue
        
        recipe_id = item.get("recipe_id")
        filename = item.get("filename")
        search_query = item.get("search_query", "")
        alt_text = item.get("alt", "")
        recipe_title = item.get("recipe_title", "Unknown")
        
        # Check if file exists
        img_file = DOWNLOAD_DIR / filename
        if not img_file.exists():
            continue
        
        # Analyze query
        query_analysis = analyze_search_query(search_query)
        
        # Check alt text for non-food indicators
        alt_lower = alt_text.lower()
        non_food_in_alt = any(term in alt_lower for term in ["person", "woman", "man", "portrait", "fashion", "model"])
        
        if query_analysis["has_issues"] or non_food_in_alt:
            suspicious.append({
                "filename": filename,
                "recipe_id": recipe_id,
                "recipe_title": recipe_title,
                "search_query": search_query,
                "alt_text": alt_text,
                "query_issues": query_analysis["issues"],
                "has_non_food_alt": non_food_in_alt
            })
        
        if query_analysis["has_issues"]:
            vague_queries.append({
                "recipe_title": recipe_title,
                "query": search_query,
                "issues": query_analysis["issues"]
            })
    
    # Generate report
    report = {
        "total_images": len(downloaded),
        "suspicious_images": len(suspicious),
        "suspicious_list": suspicious[:50],  # Limit to first 50
        "vague_queries": vague_queries[:20]  # Limit to first 20
    }
    
    # Save report
    with open(SCAN_REPORT, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("=" * 80)
    print("SCAN RESULTS")
    print("=" * 80)
    print(f"Total images: {len(downloaded)}")
    print(f"WARNING: Suspicious images: {len(suspicious)}")
    print(f"Vague queries: {len(vague_queries)}")
    print("")
    
    if suspicious:
        print("WARNING: SUSPICIOUS IMAGES (first 20):")
        print("-" * 80)
        for i, img in enumerate(suspicious[:20], 1):
            print(f"{i}. {img['filename']}")
            print(f"   Recipe: {img['recipe_title']}")
            print(f"   Query: {img['search_query']}")
            if img['query_issues']:
                print(f"   Issues: {', '.join(img['query_issues'])}")
            if img['has_non_food_alt']:
                print(f"   WARNING: Alt text contains non-food terms: {img['alt_text'][:60]}...")
            print("")
    
    print("")
    print(f"Full report saved to: {SCAN_REPORT}")
    print("")
    print("Next steps:")
    print("   1. Review suspicious images manually")
    print("   2. Use REVIEW_REJECTED_IMAGES.py to reject bad ones")
    print("   3. Re-run FETCH_RECIPE_IMAGES_PHASE1_DOWNLOAD_FIXED.py for rejected ones")

if __name__ == "__main__":
    scan_images()

