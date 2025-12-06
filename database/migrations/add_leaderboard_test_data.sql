-- Test data for leaderboard
-- This script adds points to existing users for testing the leaderboard
-- WARNING: Only run this in development/testing environments!

-- Option 1: Add points to your current user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- Example: SELECT add_points_to_user('b2e6ce9f-b00f-47c5-87da-81685b10d793'::uuid, 150);

-- SELECT add_points_to_user('YOUR_USER_ID_HERE'::uuid, 150);

-- Option 2: Add random points to all users who completed onboarding
-- This will give each user a random amount of points between 0-1000
DO $$
DECLARE
  user_record RECORD;
  random_points INTEGER;
BEGIN
  FOR user_record IN 
    SELECT id FROM public.users 
    WHERE onboarding_completed = true 
    AND points < 50  -- Only update users with less than 50 points
  LOOP
    -- Generate random points between 50 and 1000
    random_points := 50 + floor(random() * 950)::integer;
    
    -- Update user points
    UPDATE public.users
    SET points = random_points
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Updated user % with % points', user_record.id, random_points;
  END LOOP;
END $$;

-- Verify the leaderboard
SELECT * FROM get_leaderboard(10);

-- Check total users with points
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN points > 0 THEN 1 END) as users_with_points,
  MAX(points) as highest_points,
  AVG(points)::integer as average_points
FROM public.users
WHERE onboarding_completed = true;

