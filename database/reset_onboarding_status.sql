-- Reset Onboarding Status for Testing
-- Use this if you need to test the onboarding flow again

-- OPTION 1: Reset onboarding for a specific user (by email)
-- Replace 'your-email@example.com' with the actual email
UPDATE public.users
SET onboarding_completed = false
WHERE email = 'your-email@example.com';

-- OPTION 2: Reset onboarding for ALL users (use with caution!)
-- Uncomment the line below if you want to reset all users
-- UPDATE public.users SET onboarding_completed = false;

-- Verify the change
SELECT id, email, full_name, onboarding_completed
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
