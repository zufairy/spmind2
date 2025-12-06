-- DELETE USER ACCOUNT FROM SUPABASE
-- Use this SQL script in Supabase Dashboard → SQL Editor
-- to delete an existing user account so you can re-register

-- Replace 'your-email@example.com' with the actual email
-- In your case: 'sufi22@gmail.com'

-- Step 1: Delete from users table (this will cascade delete related data)
DELETE FROM users WHERE email = 'sufi22@gmail.com';

-- Step 2: Delete from auth.users table (Supabase auth)
DELETE FROM auth.users WHERE email = 'sufi22@gmail.com';

-- Verify deletion
SELECT * FROM users WHERE email = 'sufi22@gmail.com';
SELECT * FROM auth.users WHERE email = 'sufi22@gmail.com';
-- Both should return 0 rows

-- Now you can re-register with this email!

