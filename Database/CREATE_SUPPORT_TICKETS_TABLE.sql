-- Support Tickets Table for User Support Management
-- Run this SQL in your Supabase SQL Editor to create the support tickets table

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'account', 'feature_request', 'bug_report')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  comments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own tickets
CREATE POLICY "Users can create own tickets"
  ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all tickets (you'll need to adjust this based on your admin check)
-- For now, we'll use a service role key for admin operations
-- You can add a more specific policy based on your admin setup

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Add foreign key constraint to profiles table if it exists
-- This helps with joins in the admin dashboard
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Add a foreign key if profiles table exists
    -- Note: This assumes profiles.id references auth.users.id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'support_tickets_user_id_fkey'
    ) THEN
      -- The foreign key to auth.users is already created above
      -- This is just a note that you might want to add a relationship to profiles
      NULL;
    END IF;
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

