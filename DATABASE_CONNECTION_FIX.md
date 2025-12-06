# Fix Database Connection & Username Checking

## Problem
Getting "no api key found in request" error when checking username availability.

## Root Cause
This error message is misleading - username checking uses **Supabase database**, not OpenAI API. The error likely means:
1. Database connection issue, OR
2. RPC functions are not set up in Supabase

## ✅ Solution - Complete Fix

### Step 1: Verify Supabase Connection

Your Supabase is configured in `services/supabase.ts`:
- URL: `https://dzothjxrsbrxezqzkesx.supabase.co`
- Connection should work automatically

### Step 2: Set Up Database Functions (REQUIRED)

**Go to Supabase Dashboard → SQL Editor** and run:

```sql
-- Create username check function
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

-- Create email check function  
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

-- Grant permissions to anonymous users (for registration)
GRANT EXECUTE ON FUNCTION public.check_username_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;
```

### Step 3: Verify Setup

After running the SQL, verify with:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('check_username_exists', 'check_email_exists')
AND routine_schema = 'public';
```

You should see both functions.

## What I Fixed

1. ✅ **Added database connection testing** - Automatically tests connection on registration page load
2. ✅ **Improved error handling** - Better error messages that distinguish database vs API errors
3. ✅ **Added fallback queries** - If RPC functions don't exist, tries direct query
4. ✅ **Graceful degradation** - If checks fail, allows registration (will validate on submit)

## Testing

1. Open the registration page
2. Check console logs - you should see:
   - `✅ Database connection and RPC functions are working` - GOOD
   - `⚠️ RPC functions may not be set up` - Run Step 2 above
   - `❌ Database connection failed` - Check Supabase project

3. Type a username (3+ characters)
4. Should see real-time check with:
   - Spinner while checking
   - ✅ Green checkmark if available
   - ❌ Red X if taken

## If Still Not Working

1. **Check Supabase Dashboard** - Make sure project is active
2. **Verify URL and Key** - Check `services/supabase.ts`
3. **Run SQL Functions** - Make sure Step 2 SQL was executed successfully
4. **Check Console Logs** - Look for detailed error messages

The app will now work even if RPC functions are missing (will validate on registration submit instead).

