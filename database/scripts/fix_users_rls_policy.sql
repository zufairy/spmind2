-- Fix "new row violates policy users" error during registration
-- This script fixes the Row Level Security (RLS) policy to allow users to insert their own profile

-- Step 1: Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing INSERT policy if it exists (may have different variations)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Step 3: Create the correct INSERT policy
-- This policy allows authenticated users to insert their own profile
-- The key is: auth.uid() must equal the id being inserted
-- This ensures users can only create their own profile, not others
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 4: Verify SELECT policy exists (for users to view their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Step 5: Verify UPDATE policy exists (for users to update their own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 6: Add helpful comments
COMMENT ON POLICY "Users can insert own profile" ON public.users IS 
'Allows authenticated users to insert their own profile during registration. Requires auth.uid() = id to ensure users can only create their own profile.';

COMMENT ON POLICY "Users can view own profile" ON public.users IS 
'Allows users to view only their own profile data.';

COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Allows users to update only their own profile data.';

-- Verification query (optional - run this to check policies)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users' AND schemaname = 'public';

-- ALTERNATIVE SOLUTION: If the above doesn't work, use this function-based approach
-- This function bypasses RLS safely because it's SECURITY DEFINER
-- Uncomment and use this if you still have issues with the direct insert

/*
-- Create a function to safely create user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text,
  user_full_name text,
  user_username text DEFAULT NULL,
  user_school text DEFAULT NULL,
  user_age integer DEFAULT NULL,
  user_birth_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Verify the user_id matches the authenticated user
  IF user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID does not match authenticated user';
  END IF;
  
  -- Insert the profile
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    username,
    school,
    age,
    birth_date,
    onboarding_completed
  )
  VALUES (
    user_id, 
    user_email, 
    user_full_name,
    user_username,
    user_school,
    user_age,
    user_birth_date,
    false
  )
  RETURNING to_jsonb(*) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(
  uuid, text, text, text, text, integer, date
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_user_profile(
  uuid, text, text, text, text, integer, date
) TO anon;

COMMENT ON FUNCTION public.create_user_profile IS 
'Safely creates a user profile during registration. Verifies auth.uid() matches user_id.';
*/

