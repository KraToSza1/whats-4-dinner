"""
Replace recipe image by recipe ID
Usage: python REPLACE_RECIPE_IMAGE.py <recipe_id> <image_url_or_path>
"""
import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Supabase credentials not found in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def replace_recipe_image(recipe_id: str, image_source: str):
    """Replace recipe image - can be URL or local file path"""
    try:
        # Check if it's a local file
        if os.path.exists(image_source):
            # Upload local file
            print(f"Uploading local file: {image_source}")
            file_ext = Path(image_source).suffix
            filename = f"{recipe_id}{file_ext}"
            
            with open(image_source, 'rb') as f:
                file_data = f.read()
            
            # Upload to Supabase storage
            bucket = supabase.storage.from_("recipe-images")
            result = bucket.upload(
                filename,
                file_data,
                file_options={"content-type": f"image/{file_ext[1:]}", "upsert": "true"}
            )
            
            if result and (not hasattr(result, 'error') or not result.error):
                # Get public URL
                public_url_response = bucket.get_public_url(filename)
                if isinstance(public_url_response, dict):
                    image_url = public_url_response.get('data', {}).get('publicUrl') or public_url_response.get('publicUrl')
                else:
                    image_url = public_url_response
                
                if not image_url:
                    print("ERROR: Failed to get public URL")
                    return False
            else:
                print("ERROR: Upload failed")
                return False
        else:
            # Assume it's a URL
            image_url = image_source
            print(f"Using provided URL: {image_url}")
        
        # Update recipe
        response = supabase.table("recipes").update({
            "hero_image_url": image_url,
            "updated_at": "now()"
        }).eq("id", recipe_id).execute()
        
        if response.data:
            print(f"SUCCESS: Image updated for recipe {recipe_id}")
            print(f"New image URL: {image_url}")
            return True
        else:
            print("ERROR: No data returned from update")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def get_recipe_info(recipe_id: str):
    """Get recipe title for display"""
    try:
        response = supabase.table("recipes").select("title, hero_image_url").eq("id", recipe_id).limit(1).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
    except:
        pass
    return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python REPLACE_RECIPE_IMAGE.py <recipe_id> <image_url_or_path>")
        print("\nExamples:")
        print("  python REPLACE_RECIPE_IMAGE.py abc123 https://example.com/image.jpg")
        print("  python REPLACE_RECIPE_IMAGE.py abc123 Database/downloaded_images/abc123.jpg")
        sys.exit(1)
    
    recipe_id = sys.argv[1]
    image_source = sys.argv[2]
    
    # Get recipe info
    recipe_info = get_recipe_info(recipe_id)
    if recipe_info:
        print(f"Recipe: {recipe_info.get('title', 'Unknown')}")
        print(f"Current image: {recipe_info.get('hero_image_url', 'None')}")
        print("")
    
    # Replace image
    success = replace_recipe_image(recipe_id, image_source)
    sys.exit(0 if success else 1)

