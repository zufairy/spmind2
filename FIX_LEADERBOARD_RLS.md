# 🔒 Fix Leaderboard - Only Showing One User (RLS Issue)

## 🔴 Problem

You're seeing **only yourself** in the leaderboard even though there are many users with points in the database.

**Root Cause:** Row Level Security (RLS) on the `users` table is blocking you from seeing other users' data.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**

### Step 2: Run This SQL

Copy and paste this entire script:

```sql
-- Create a function to get leaderboard data (bypasses RLS)
-- This is safe because we're only exposing public leaderboard information

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_leaderboard(integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  points integer,
  avatar_url text,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.full_name::text,
    u.username::text,
    COALESCE(u.points, 0) as points,
    u.avatar_url::text,
    ROW_NUMBER() OVER (ORDER BY COALESCE(u.points, 0) DESC) as rank
  FROM public.users u
  WHERE COALESCE(u.points, 0) > 0
  ORDER BY COALESCE(u.points, 0) DESC
  LIMIT limit_count;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon;

COMMENT ON FUNCTION public.get_leaderboard IS 'Get top users by points for leaderboard (bypasses RLS)';
```

### Step 3: Update Community Screen

The app will automatically use this function. Just reload your app!

---

## 🔍 Why This Happens

### Current RLS Policy on `users` table:
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);
```

This blocks you from seeing other users' data, which is **good for privacy** but **bad for leaderboards**.

### The Solution:
Create a **SECURITY DEFINER** function that:
- ✅ Bypasses RLS (safe - only returns public leaderboard data)
- ✅ Only exposes: name, username, points, avatar (no private data)
- ✅ Only shows users with points > 0
- ✅ Sorted by highest points first

---

## 📊 What You'll See After the Fix

**Before:**
- Only 1 user (yourself)
- Empty podium slots

**After:**
- ✅ ALL users with points
- ✅ Full top 3 podium
- ✅ Ranks 4-7 populated
- ✅ "Show All" modal works

---

## 🧪 Test It Works

After running the SQL, test in Supabase SQL Editor:

```sql
-- Should return all users with points
SELECT * FROM get_leaderboard(10);
```

Expected result: List of 10 users sorted by points

---

## Alternative Fix (If Above Doesn't Work)

If you want a temporary fix for testing, you can modify the RLS policy:

```sql
-- TEMPORARY: Allow reading all users (for leaderboard)
-- WARNING: This exposes more user data than needed
CREATE POLICY "Public leaderboard access"
ON users FOR SELECT
TO authenticated
USING (points > 0);
```

**⚠️ NOT RECOMMENDED:** This is less secure. The function method above is better!

---

## Verification Checklist

After running the SQL fix:

- [ ] Function `get_leaderboard` exists (check in Supabase Functions)
- [ ] Test query returns multiple users
- [ ] Reload your app
- [ ] Check console logs (should say "✅ Using RPC function")
- [ ] Leaderboard shows multiple users
- [ ] Top 3 podium is populated
- [ ] Your rank is highlighted in gold

---

## Console Logs to Watch For

### If RLS is Still Blocking:
```
⚠️⚠️⚠️ IMPORTANT: Only seeing YOUR user!
⚠️ Row Level Security (RLS) is blocking other users
⚠️ Solution: Run database/migrations/add_leaderboard_function.sql
```

### If Fixed Successfully:
```
✅ Loaded 15 users from database
📊 Top 7 users: [{ name: 'User1', points: 1250 }, ...]
```

---

## 🎯 Summary

**Problem:** RLS blocking other users  
**Solution:** Run the SQL script to create `get_leaderboard()` function  
**Time:** 5 minutes  
**Result:** Leaderboard shows all users!  

---

**Last Updated:** October 8, 2025  
**Status:** Ready to fix

