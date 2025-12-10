-- Add cache_bust_version column to profiles table for per-user cache flushing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cache_bust_version BIGINT DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_cache_bust_version ON profiles(cache_bust_version);

-- Add comment
COMMENT ON COLUMN profiles.cache_bust_version IS 'Version number for per-user cache busting. Incrementing this triggers client-side cache clear for that user.';

