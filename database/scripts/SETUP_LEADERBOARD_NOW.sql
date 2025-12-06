-- 🚀 COMPLETE LEADERBOARD SETUP - RUN THIS NOW!
-- Copy all of this and paste into Supabase SQL Editor, then click Run

-- STEP 1: Add location columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Malaysia';

-- STEP 2: Give ALL users random points (100-2500)
UPDATE public.users
SET points = FLOOR(RANDOM() * 2400 + 100)::INTEGER
WHERE points = 0 OR points IS NULL;

-- STEP 3: Set random Malaysian locations for ALL users
UPDATE public.users
SET 
  region = (ARRAY['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Sabah', 'Sarawak', 'Melaka', 'Negeri Sembilan', 'Kedah'])[FLOOR(RANDOM() * 10 + 1)],
  state = (ARRAY['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Sabah', 'Sarawak', 'Melaka', 'Negeri Sembilan', 'Kedah'])[FLOOR(RANDOM() * 10 + 1)],
  country = 'Malaysia'
WHERE region IS NULL OR region = '';

-- STEP 4: Verify the setup
SELECT 
  '✅ SETUP COMPLETE!' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN points > 0 THEN 1 END) as users_with_points,
  MAX(points) as highest_points,
  COUNT(DISTINCT region) as total_regions
FROM public.users;

-- STEP 5: Show top 10 users
SELECT 
  ROW_NUMBER() OVER (ORDER BY points DESC) as rank,
  full_name,
  username,
  points,
  region,
  state
FROM public.users
WHERE points > 0
ORDER BY points DESC
LIMIT 10;

-- 🎉 DONE! Now refresh your app and check the Community tab!

