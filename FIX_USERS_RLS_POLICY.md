# Fix "new row violates policy users" Error

## Problem
You're getting an error: **"new row violates policy users"** when trying to register a new user.

## Root Cause
The Row Level Security (RLS) policy on the `users` table is either:
1. Missing the INSERT policy
2. Has the wrong condition in the INSERT policy
3. The policy condition doesn't match what's needed for registration

## ✅ Solution

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Fix Script
Copy and paste the entire contents of `database/scripts/fix_users_rls_policy.sql` into the SQL Editor and run it.

Or copy this:

```sql
-- Fix "new row violates policy users" error during registration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create the correct INSERT policy
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Verify SELECT policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Verify UPDATE policy exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 3: Verify the Fix
1. Try registering a new user in your app
2. The registration should work now!

## How It Works

When a user registers:
1. Supabase Auth creates the user account (this sets `auth.uid()`)
2. Your app inserts a row in the `users` table with `id = auth.uid()`
3. The RLS policy checks: `auth.uid() = id` ✅ (they match!)
4. The insert is allowed

## Important Notes

- The policy `auth.uid() = id` ensures users can **only** create their own profile
- This is secure because users cannot create profiles for other users
- The policy works because:
  - During registration, `auth.uid()` returns the newly created user's ID
  - The `id` in the insert matches this ID
  - So the condition passes ✅

## Troubleshooting

If you still get errors after running the script:

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';
   ```
   Should show `rowsecurity = true`

2. **List all policies on users table:**
   ```sql
   SELECT policyname, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'users' AND schemaname = 'public';
   ```

3. **Check if the user is authenticated when inserting:**
   - The error might happen if `auth.uid()` is NULL
   - Make sure the auth user is created BEFORE inserting the profile

## Alternative: Use a Database Function (More Secure)

If you continue to have issues, you can create a database function that bypasses RLS:

```sql
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id uuid,
  user_email text,
  user_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO public.users (id, email, full_name, onboarding_completed)
  VALUES (user_id, user_email, user_full_name, false)
  RETURNING to_jsonb(*) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) TO authenticated;
```

Then update your `authService.ts` to use this function instead of direct insert.

