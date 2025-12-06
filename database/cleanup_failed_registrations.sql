-- CLEANUP FAILED REGISTRATIONS
-- Run this in Supabase Dashboard → SQL Editor
-- This removes auth users that don't have a corresponding profile in users table

-- Step 1: View orphaned auth users (users in auth.users but not in public.users)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Delete orphaned auth users
-- UNCOMMENT the line below after verifying the list above
-- DELETE FROM auth.users WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN public.users u ON au.id = u.id
--   WHERE u.id IS NULL
-- );

-- Step 3: Verify cleanup
-- After running the DELETE, run this to confirm:
-- SELECT COUNT(*) as orphaned_users
-- FROM auth.users au
-- LEFT JOIN public.users u ON au.id = u.id
-- WHERE u.id IS NULL;
-- Should return 0

-- SPECIFIC EMAIL CLEANUP (if needed)
-- Replace 'sufi25@gmail.com' with the email you want to clean up
-- DELETE FROM auth.users WHERE email = 'sufi25@gmail.com';
-- DELETE FROM public.users WHERE email = 'sufi25@gmail.com';

