# ----------------------------------------------------
# Core / Tooling
# ----------------------------------------------------
NX_DAEMON=false

# ----------------------------------------------------
# Supabase (server + client)
# ----------------------------------------------------
# Base URL of your Supabase project (server + client)
SUPABASE_URL="https://chhdqmntirvngvamtgdo.supabase.co"

# Public anon key (safe to use in browser & server)
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTEyOTYsImV4cCI6MjA3NzQyNzI5Nn0.9jn172pl54EErWMN7Vv6_-NvEYh9ltpIjTgYkMzh3Vc"

# Service role key (SERVER ONLY – never expose in browser)
SUPABASE_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg1MTI5NiwiZXhwIjoyMDc3NDI3Mjk2fQ.depXd145gv5_wLsN6Azh4MRpZhWgrZgQk5ZV7u9vp4"

# Optional alias – only use on the server if you actually need it
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg1MTI5NiwiZXhwIjoyMDc3NDI3Mjk2fQ.depXd145gv5_wLsN6Azh4MRpZhWgrZgQk5ZV7u9vp4"

# ----------------------------------------------------
# Vite-side Supabase (what the client can see)
# ----------------------------------------------------
# Vite only exposes vars prefixed with VITE_
# These are safe for the browser (anon key only)
VITE_SUPABASE_URL="https://chhdqmntirvngvamtgdo.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGRxbW50aXJ2bmd2YW10Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTEyOTYsImV4cCI6MjA3NzQyNzI5Nn0.9jn172pl54EErWMN7Vv6_-NvEYh9ltpIjTgYkMzh3Vc"

# ----------------------------------------------------
# Paddle (payments – SERVER ONLY)
# ----------------------------------------------------
# Use these on the server (API routes / backend) – not in browser code
PADDLE_VENDOR_ID=42069
PADDLE_API_KEY=pdl_sdbx_apikey_01kaxv8mj6pk2qzbmeedhr19ee_ynYpqmPxVznVRBqYYnk7mB_AJR
PADDLE_ENV=sandbox

PADDLE_PRICE_SUPPORTER_MONTHLY=pri_01kay00wppbwg2cwdt6fdweqpr
PADDLE_PRICE_SUPPORTER_YEARLY=pri_01kay0bfm2njztsyw2mnqshjn1
PADDLE_PRICE_UNLIMITED_MONTHLY=pri_01kay0ggeaq86hf7v4rr7k8kap
PADDLE_PRICE_UNLIMITED_YEARLY=pri_01kay0jh31hafxfcdawanvhj0p
PADDLE_PRICE_FAMILY_MONTHLY=pri_01kay0r1zyn8te63ab3h7m4j7v
PADDLE_PRICE_FAMILY_YEARLY=pri_01kay0ww6zc0rzt0takfcxmj4y


# ----------------------------------------------------
# Third-party APIs (decide case-by-case: client vs server)
# ----------------------------------------------------
# If you call Pexels only from the server, keep as plain key (safer).
# If you need it in the browser, rename to VITE_PEXELS_API_KEY and update your code.
PEXELS_API_KEY="7o9p8t4HSHUXCEPU8N6OW1s3IurWBsYb4Ovrmm85kYibM6MhuwNyVIGq"

# Spoonacular – already set up for Vite
VITE_DISABLE_SPOONACULAR="1"
VITE_SPOONACULAR_KEY="c6cd1473a67b494caf3f09c1eefd21fb"

# ----------------------------------------------------
# Turbo / Nx / Build cache
# ----------------------------------------------------
TURBO_CACHE="remote:rw"
TURBO_DOWNLOAD_LOCAL_ENABLED="true"
TURBO_REMOTE_ONLY="true"
TURBO_RUN_SUMMARY="true"
