-- STEP 1: Add location columns to users table
-- Run this FIRST in Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Malaysia';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('region', 'state', 'city', 'country');

-- Success message
SELECT 'Location columns added successfully!' as status;

