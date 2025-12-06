# Database Setup Guide

## ✅ Verify Database Connection

Your Supabase project is configured with:
- **URL**: `https://dzothjxrsbrxezqzkesx.supabase.co`
- **Anon Key**: Configured in `services/supabase.ts`

## Required Database Setup

### Step 1: Create RPC Functions for Username/Email Checking

Go to **Supabase Dashboard > SQL Editor** and run this SQL:

```sql
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
```

**File location**: `database/allow_username_email_check.sql`

### Step 2: Verify Functions Exist

Run this in SQL Editor to verify:

```sql
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name IN ('check_username_exists', 'check_email_exists')
AND routine_schema = 'public';
```

You should see both functions listed.

### Step 3: Test Database Connection

The app now includes automatic database connection testing. When you open the registration page, check the console for:
- ✅ `Database connection and RPC functions are working` - Everything OK
- ⚠️ `RPC functions may not be set up` - Run Step 1 above
- ❌ `Database connection failed` - Check your Supabase project status

## Troubleshooting

### Error: "no api key found in request" when checking username

This error is misleading. If you see this when checking username:

1. **Check Database Connection**: The error might be from a failed database query
2. **Verify RPC Functions**: Make sure the SQL from Step 1 has been run
3. **Check Console Logs**: Look for detailed error messages about what failed

### Error: "function does not exist"

**Solution**: Run the SQL from Step 1 in Supabase SQL Editor.

### Error: "permission denied"

**Solution**: Make sure you ran the `GRANT EXECUTE` statements in Step 1.

## Database Status Check

The app automatically tests the database connection when you:
- Open the registration page
- Try to check username/email availability

Check your browser/app console for connection status messages.

