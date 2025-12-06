-- QUICK SCRIPT: Populate random points for ALL users
-- Run this in Supabase SQL Editor to instantly see leaderboard data

-- 1. Give everyone random points (100 to 2500)
UPDATE public.users
SET 
  points = FLOOR(RANDOM() * 2400 + 100)::INTEGER,
  updated_at = NOW();

-- 2. Set random Malaysian locations
UPDATE public.users
SET 
  region = (ARRAY['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Sabah', 'Sarawak', 'Melaka'])[FLOOR(RANDOM() * 8 + 1)],
  state = (ARRAY['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Sabah', 'Sarawak', 'Melaka'])[FLOOR(RANDOM() * 8 + 1)],
  country = 'Malaysia',
  updated_at = NOW()
WHERE region IS NULL OR region = '' OR country IS NULL;

-- 3. Verify - Show top 10
SELECT 
  full_name,
  username,
  points,
  region,
  state
FROM public.users
ORDER BY points DESC
LIMIT 10;

