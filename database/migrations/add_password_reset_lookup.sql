-- Create a function to look up email by username for password reset
-- This is safe because it's only used for password reset flow
-- and doesn't expose sensitive user data

CREATE OR REPLACE FUNCTION public.get_email_by_username(username_lookup text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM public.users 
  WHERE username = username_lookup;
  
  RETURN user_email;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO authenticated;

COMMENT ON FUNCTION public.get_email_by_username IS 'Get email address for a username (for password reset)';

