-- Disable email confirmation requirement in Supabase
-- This allows users to login without verifying their email

-- Note: This needs to be done in Supabase Dashboard, not via SQL
-- Go to: Authentication > Settings > Auth Providers > Email
-- Disable "Confirm email" toggle

-- However, we can check if email confirmation is causing issues by querying auth users
-- This query shows users with unconfirmed emails (for debugging)

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Not Confirmed'
    ELSE 'Confirmed'
  END as confirmation_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- To allow a specific user to login without confirmation (admin only):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'user@example.com';

-- OR disable email confirmation for all users (use with caution):
-- UPDATE auth.users 
-- SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
-- WHERE email_confirmed_at IS NULL;

