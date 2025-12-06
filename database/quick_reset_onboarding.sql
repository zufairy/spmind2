-- Quick Reset Onboarding Status
-- Run this in Supabase SQL Editor to reset YOUR onboarding

-- Reset ALL users (for testing)
UPDATE users 
SET onboarding_completed = false;

-- Verify it worked
SELECT 
  email, 
  full_name, 
  onboarding_completed,
  created_at
FROM users
ORDER BY created_at DESC;




