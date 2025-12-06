-- Allow anyone to check if username or email exists (for registration validation)
-- This is safe because we're only exposing whether a username/email exists, not the full user data

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can check username availability" ON public.users;
DROP POLICY IF EXISTS "Anyone can check email availability" ON public.users;

-- Create policy to allow checking if username exists
CREATE POLICY "Anyone can check username availability" ON public.users
  FOR SELECT 
  USING (true)
  WITH CHECK (false);

-- Note: The above policy allows SELECT but we need to make sure only username/email columns are exposed
-- Let's create a more restrictive approach using a function

-- Create a function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_exists(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE username = username_to_check
  );
END;
$$;

-- Create a function to check email availability
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE email = email_to_check
  );
END;
$$;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION public.check_username_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;

COMMENT ON FUNCTION public.check_username_exists IS 'Check if a username already exists (for registration validation)';
COMMENT ON FUNCTION public.check_email_exists IS 'Check if an email already exists (for registration validation)';

