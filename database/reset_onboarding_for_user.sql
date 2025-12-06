-- Script to reset onboarding status for a specific user
-- This allows you to test the onboarding flow again

-- Update your user ID here (you can find it in Supabase Dashboard -> Authentication -> Users)
-- Example: UPDATE users SET onboarding_completed = false WHERE id = 'your-user-id-here';

-- Or reset ALL users (use with caution in production!)
UPDATE users SET onboarding_completed = false;

-- Verify the change
SELECT id, email, full_name, onboarding_completed FROM users;


