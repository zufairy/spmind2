-- Script to populate random points for existing users for testing leaderboards
-- This will assign random points to users so you can see dynamic leaderboard data

-- Update users with random points (between 100 and 2500)
UPDATE public.users
SET 
  points = FLOOR(RANDOM() * 2400 + 100)::INTEGER,
  updated_at = NOW()
WHERE points = 0 OR points IS NULL;

-- Alternatively, update ALL users with random points (including those with existing points)
-- Uncomment the following to reset everyone's points randomly:
-- UPDATE public.users
-- SET 
--   points = FLOOR(RANDOM() * 2400 + 100)::INTEGER,
--   updated_at = NOW();

-- Set random locations for users if not already set
UPDATE public.users
SET 
  region = CASE 
    WHEN RANDOM() < 0.2 THEN 'Kuala Lumpur'
    WHEN RANDOM() < 0.4 THEN 'Selangor'
    WHEN RANDOM() < 0.5 THEN 'Penang'
    WHEN RANDOM() < 0.6 THEN 'Johor'
    WHEN RANDOM() < 0.7 THEN 'Perak'
    WHEN RANDOM() < 0.8 THEN 'Sabah'
    WHEN RANDOM() < 0.9 THEN 'Sarawak'
    ELSE 'Melaka'
  END,
  state = CASE 
    WHEN RANDOM() < 0.2 THEN 'Kuala Lumpur'
    WHEN RANDOM() < 0.4 THEN 'Selangor'
    WHEN RANDOM() < 0.5 THEN 'Penang'
    WHEN RANDOM() < 0.6 THEN 'Johor'
    WHEN RANDOM() < 0.7 THEN 'Perak'
    WHEN RANDOM() < 0.8 THEN 'Sabah'
    WHEN RANDOM() < 0.9 THEN 'Sarawak'
    ELSE 'Melaka'
  END,
  country = 'Malaysia',
  updated_at = NOW()
WHERE region IS NULL OR region = '';

-- Create some mock points history entries for realism
INSERT INTO public.points_history (user_id, points_earned, source, description, created_at)
SELECT 
  id,
  FLOOR(RANDOM() * 200 + 50)::INTEGER,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'daily_brain_boost'
    WHEN RANDOM() < 0.6 THEN 'word_bomb'
    WHEN RANDOM() < 0.8 THEN 'quiz'
    ELSE 'homework_help'
  END,
  'Test points from various activities',
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM public.users
WHERE id IN (SELECT id FROM public.users ORDER BY RANDOM() LIMIT 20);

-- Verify the update
SELECT 
  full_name,
  username,
  points,
  region,
  state,
  country
FROM public.users
ORDER BY points DESC
LIMIT 20;

-- Show leaderboard by region
SELECT * FROM public.get_leaderboard('region', 'Selangor', 10);

-- Show leaderboard by country
SELECT * FROM public.get_leaderboard('country', 'Malaysia', 10);

-- Show global leaderboard
SELECT * FROM public.get_leaderboard('global', NULL, 10);

