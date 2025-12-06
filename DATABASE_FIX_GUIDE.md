# Database Fix Guide for Genius App

## Issues You're Experiencing

1. ❌ **Profile creation error** - Can't register new users
2. ❌ **Error checking onboarding status** - Missing onboarding columns
3. ❌ **Error fetching room** - Multiplayer tables not set up

## Solution: Run Database Migrations

You need to run these SQL scripts in your **Supabase SQL Editor** in the correct order:

### Step 1: Fix Users Table Schema

Run this first to fix the users table and add onboarding support:

```sql
-- File: database/fix_users_schema.sql
```

**In Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**
5. Copy the entire contents of `database/fix_users_schema.sql`
6. Paste and click **Run**
7. You should see "Success. No rows returned"

### Step 2: Set Up Multiplayer Tables (Optional)

If you want to use the multiplayer/lepak features, run this:

```sql
-- File: database/safe_multiplayer_setup.sql
```

Follow the same steps as above with `database/safe_multiplayer_setup.sql`

### Step 3: Enable Realtime (Optional, for Multiplayer)

If you set up multiplayer, also run:

```sql
-- File: database/enable_realtime.sql
```

---

## What These Migrations Do

### `fix_users_schema.sql`
✅ Makes `school`, `age`, and `birth_date` **nullable** (optional until onboarding)  
✅ Adds `onboarding_completed` column  
✅ Adds `username` column  
✅ Adds `preferred_language`, `weak_subjects`, `strong_subjects`, etc.  
✅ Fixes RLS (Row Level Security) policies to allow registration  
✅ Updates constraints to allow valid default values  

### `safe_multiplayer_setup.sql`
✅ Creates `multiplayer_rooms` table  
✅ Creates `chat_messages` table  
✅ Sets up RLS policies for multiplayer  
✅ Creates default rooms  

### `enable_realtime.sql`
✅ Enables real-time updates for multiplayer tables  

---

## After Running Migrations

### Test Registration
1. Clear your app data/cache (or reload expo)
2. Try registering a new user
3. You should see:
   - ✅ User created successfully
   - ✅ Redirected to onboarding
   - ✅ Complete 8 questions
   - ✅ Redirected to home screen

### Verify Database
Go to Supabase → **Table Editor** → `users` table and check:
- ✅ `onboarding_completed` column exists
- ✅ `username` column exists  
- ✅ `school`, `age`, `birth_date` allow NULL values
- ✅ New user rows appear with `onboarding_completed = false`

---

## If You Still Have Issues

### Check Your Supabase Policies

In Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. Find `users` table policies
3. Make sure these exist:
   - ✅ "Users can insert own profile"
   - ✅ "Users can update own profile"
   - ✅ "Users can view own profile"

### Check Console Logs

In your app, check the console for specific error messages:
- Look for "Profile creation error" - tells you what field is failing
- Look for "Error checking onboarding status" - tells you if column is missing
- Look for "Error fetching room" - tells you if multiplayer tables are missing

### Manual Verification

Run this query in Supabase SQL Editor to check your schema:

```sql
-- Check users table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if onboarding_completed exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'onboarding_completed';
```

---

## Clean Start (If Nothing Works)

If you want to completely rebuild the database:

1. **Drop existing tables** (⚠️ This deletes all data!)
```sql
DROP TABLE IF EXISTS session_sticky_notes CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS recording_sessions CASCADE;
DROP TABLE IF EXISTS sticky_notes CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS ai_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS multiplayer_rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

2. **Run migrations in order:**
   - `database/schema.sql` (base tables) - DON'T RUN THIS, it has the old schema
   - `database/fix_users_schema.sql` ✅ (run this first)
   - `database/schema_extension.sql` (AI progress tracking)
   - `database/safe_multiplayer_setup.sql` (multiplayer)
   - `database/enable_realtime.sql` (realtime)

Actually, better approach:

### Recommended Clean Start Process:

1. Only run `fix_users_schema.sql` - it will create/alter the users table properly
2. Then run `schema_extension.sql` for AI features
3. Then run `safe_multiplayer_setup.sql` for multiplayer

---

## Need Help?

If you continue to see errors after running the migrations:
1. Check the **exact error message** in your console
2. Take a screenshot of the Supabase Table Editor showing the `users` table structure
3. Share the error message so we can diagnose further

The most common issue is **not running the SQL migrations in Supabase** - make sure you copy the entire file content and run it in the SQL Editor!
