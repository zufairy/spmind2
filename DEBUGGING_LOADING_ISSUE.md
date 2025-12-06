# Debugging: Stuck on Loading Screen

## What I Just Fixed

✅ Added 3-second timeout to prevent infinite auth loading  
✅ Added 5-second timeout to prevent infinite onboarding check  
✅ Added extensive console logging throughout the flow  

## What You Need to Do RIGHT NOW

### Step 1: Check Your Console/Terminal

Look at your **Expo Dev Tools** or **Terminal** console. You should see these logs:

```
🚀 AppWithNavigation: Auth loading state: { authLoading: true, hasUser: false }
⏳ AppWithNavigation: Showing loading screen
```

**After 3 seconds max**, you should see:
```
⚠️ AppWithNavigation: Auth loading timeout, forcing app to load
✅ AppWithNavigation: Rendering app content
```

### Step 2: Share What You See

**Take a screenshot or copy the console output** and share it. This will tell us:
- Is auth initializing?
- Is it stuck?
- What error is happening?

### Step 3: Make Sure Database Is Set Up

**This is the #1 reason for loading issues!**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **+ New Query**
5. Copy ALL of `database/fix_users_schema.sql`
6. Paste and click **Run**
7. Should see "Success. No rows returned"

### Step 4: Verify Database Column Exists

In Supabase SQL Editor, run this query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Check if you see:**
- ✅ `onboarding_completed` column exists
- ✅ `username` column exists
- ✅ `school` is nullable (YES in is_nullable column)
- ✅ `age` is nullable (YES in is_nullable column)
- ✅ `birth_date` is nullable (YES in is_nullable column)

### Step 5: Clear Everything and Restart

```bash
# Stop your Expo server (Ctrl+C)

# Clear cache completely
npx expo start --clear

# Or on Windows:
npx expo start -c
```

### Step 6: Try Fresh Registration

1. Use a **NEW email** (not one you tried before)
2. Watch the console logs carefully
3. Share any errors or where it gets stuck

## Expected Console Flow (Normal Operation)

When everything works correctly, you should see:

```
🚀 AppWithNavigation: Auth loading state: { authLoading: true, hasUser: false }
⏳ AppWithNavigation: Showing loading screen
🚀 AppWithNavigation: Auth loading state: { authLoading: false, hasUser: false }
✅ AppWithNavigation: Rendering app content
🔍 OnboardingCheck: Starting check...
❌ OnboardingCheck: No user found, allowing through
🏁 OnboardingCheck: Check complete
```

Then after registration:

```
🔐 AuthContext: Starting registration...
✅ AuthContext: Registration successful, user: abc-123
📝 AuthContext: Got session: true
✅ AuthContext: Auth state updated
🔍 OnboardingCheck: Starting check...
📊 OnboardingCheck: Querying database for user: abc-123
✅ OnboardingCheck: Found profile: { onboarding_completed: false }
➡️ OnboardingCheck: Redirecting to onboarding
```

## Common Issues & Solutions

### Issue 1: Logs Show "Error checking onboarding status"

**Problem:** Database column doesn't exist  
**Solution:** Run `database/fix_users_schema.sql` in Supabase

### Issue 2: Logs Show "Profile creation error"

**Problem:** Database has wrong constraints  
**Solution:** Run `database/fix_users_schema.sql` in Supabase

### Issue 3: No Logs at All

**Problem:** App not loading  
**Solution:** 
```bash
npx expo start --clear
# Press 'r' to reload
```

### Issue 4: Timeout Messages Appear

**Problem:** Auth or database query taking too long  
**Solution:** Check your internet connection and Supabase status

### Issue 5: Stuck After Exactly 3 Seconds

**Symptom:** See "Auth loading timeout, forcing app to load"  
**Problem:** AuthContext initialization failing  
**Solution:** Check Supabase connection in `services/supabase.ts`

## Quick Checklist

Before asking for more help, make sure:

- [ ] Database migration (`fix_users_schema.sql`) has been run
- [ ] Expo cache has been cleared (`npx expo start --clear`)
- [ ] You're using a NEW email for registration
- [ ] Console logs are visible in terminal
- [ ] Supabase project is active (not paused)
- [ ] Internet connection is working

## Need Immediate Help?

Share these 3 things:

1. **Console logs** (copy ALL the emoji logs)
2. **Screenshot** of what you see on screen
3. **Database schema** (result of the query in Step 4)

This will help diagnose the exact issue!
