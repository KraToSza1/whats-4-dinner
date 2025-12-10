-- Create admin_settings table for app-wide settings and cache management
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Insert default app_settings if it doesn't exist
INSERT INTO admin_settings (key, value)
VALUES (
  'app_settings',
  jsonb_build_object(
    'appName', 'What''s 4 Dinner?',
    'appDescription', 'Your personal cooking assistant',
    'maintenanceMode', false,
    'maintenanceMessage', 'We are currently performing maintenance. Please check back soon!',
    'cacheBustVersion', 0,
    'cacheEnabled', true,
    'cacheTTL', 3600
  )
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read/write (you'll need to adjust this based on your admin check)
-- For now, allow service role to manage (this is handled server-side)
CREATE POLICY "Service role can manage admin_settings"
  ON admin_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE admin_settings IS 'App-wide admin settings and cache management flags';

