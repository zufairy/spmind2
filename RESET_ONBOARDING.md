# Reset Onboarding Status

## Issue
You're not seeing the onboarding page even though you haven't completed it yet.

## Likely Cause
Your user profile in the database has `onboarding_completed = true` when it should be `false` or `null`.

## Solution - Reset Onboarding

### Option 1: Run SQL in Supabase Dashboard

1. Go to your Supabase project
2. Click on "SQL Editor"
3. Run this query (replace with your email):

```sql
-- Reset onboarding for specific user
UPDATE users
SET onboarding_completed = false
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, full_name, onboarding_completed
FROM users
WHERE email = 'your-email@example.com';
```

### Option 2: Reset for Current Logged-In User

```sql
-- Get your current user ID from the session, then:
UPDATE users
SET onboarding_completed = false
WHERE id = 'your-user-id-here';

-- Verify
SELECT id, email, full_name, onboarding_completed
FROM users
WHERE id = 'your-user-id-here';
```

### Option 3: Reset All Users (if testing)

```sql
-- WARNING: This resets ALL users
UPDATE users
SET onboarding_completed = false;

-- Verify
SELECT email, onboarding_completed FROM users;
```

## After Resetting

1. Close your app completely
2. Reopen the app
3. You should see the onboarding page
4. Complete the onboarding flow
5. Your status will be set to `true` automatically

## Check Current Status

Run this to see your current status:

```sql
SELECT 
  email, 
  full_name, 
  onboarding_completed,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Flow

With `onboarding_completed = false`:
1. Login → Checking profile → Onboarding page ✅
2. Complete onboarding → Home page ✅

With `onboarding_completed = true`:
1. Login → Checking profile → Home page ✅




