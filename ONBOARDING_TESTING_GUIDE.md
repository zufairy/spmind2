# Onboarding Testing Guide

This guide explains how to test the onboarding flow in your Genius app.

## How Onboarding Works

When a user first logs in or signs up, the app checks if they've completed onboarding by:
1. Looking at the `onboarding_completed` field in the `users` table
2. If `false` or `null`, the user is redirected to `/onboarding`
3. After completing onboarding, the field is set to `true`

## Testing Onboarding for Existing Users

If you've already completed onboarding and want to test it again:

### Method 1: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **users**
3. Find your user (by email)
4. Set `onboarding_completed` to `false` or `null`
5. Reload the app

### Method 2: Using SQL Editor

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query and run:

```sql
-- Reset onboarding for a specific user
UPDATE users 
SET onboarding_completed = false 
WHERE email = 'your-email@example.com';

-- Or reset ALL users (use with caution!)
UPDATE users SET onboarding_completed = false;
```

### Method 3: Using the Script

We've created a SQL script for you at `database/reset_onboarding_for_user.sql`:

1. Open the file
2. Modify the query for your specific user
3. Run it in Supabase SQL Editor

## Testing with a Fresh Account

1. **Sign out** of your current account
2. **Register a new account** with a new email
3. After registration, you should automatically be taken to onboarding
4. Complete the onboarding flow

## What to Test

During onboarding testing, verify:

- [ ] Onboarding starts automatically after first login/signup
- [ ] All steps display correctly
- [ ] Avatar animations work (talking, listening, idle)
- [ ] Voice input works (optional)
- [ ] Text input validation works
- [ ] Multi-select options work
- [ ] Date picker works
- [ ] Data saves correctly to the database
- [ ] After completion, user is redirected to home
- [ ] Onboarding doesn't show again after completion

## Troubleshooting

### "Onboarding doesn't show"

1. Check the Metro bundler console for logs starting with:
   - `🔍 OnboardingCheck:`
   - `📊 OnboardingCheck:`
2. Verify your user's `onboarding_completed` is `false` in the database
3. Make sure `SKIP_ONBOARDING` is set to `false` in `components/OnboardingCheck.tsx`

### "Stuck on loading screen"

1. Check console logs for errors
2. Verify Supabase connection is working
3. Check that the `users` table has the `onboarding_completed` column

### "Database errors during onboarding"

1. Check that your `users` table has all required columns:
   - `onboarding_completed` (boolean)
   - `full_name` (text)
   - `preferred_language` (text)
   - `school` (text)
   - `birth_date` (date)
   - `age` (integer)
   - `weak_subjects` (text array)
   - `strong_subjects` (text array)
   - `study_hours_per_day` (integer)
   - `academic_goals` (text)

## Console Logs Reference

Watch for these logs during onboarding flow:

```
🔍 OnboardingCheck: Starting check...
📊 OnboardingCheck: Querying database for user: [id]
✅ OnboardingCheck: Found profile: { onboarding_completed: false }
➡️ OnboardingCheck: User needs onboarding
🔀 OnboardingCheck: Navigating to /onboarding
```

## Splash Screen / Loading Screen

The app shows loading screens at various stages:

1. **Initial app load**: `InitialNavigator` component (purple gradient)
2. **Checking onboarding**: Shows "Checking your profile..."
3. **Preparing onboarding**: Shows "Preparing onboarding..."

All loading screens should be visible and smooth. If they don't show:

1. Check that fonts are loaded
2. Verify `expo-splash-screen` is configured
3. Check console for errors during font loading




