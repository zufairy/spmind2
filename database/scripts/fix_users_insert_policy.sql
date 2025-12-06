-- Fix "new row violates policy users" error during registration
-- This ensures users can insert their own profile when registering

-- Drop existing INSERT policy if it exists (may have different names)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create the correct INSERT policy
-- Users can insert their own profile during registration
-- The policy ensures auth.uid() matches the id being inserted
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
-- You can check this in Supabase Dashboard → Table Editor → users → Policies

COMMENT ON POLICY "Users can insert own profile" ON public.users IS 
'Allows authenticated users to insert their own profile during registration. The user ID must match auth.uid().';

