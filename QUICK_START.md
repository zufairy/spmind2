# Quick Start - Testing Onboarding & Splash Screen

## ✅ What Was Fixed

### 1. Intro Screens (NEW!)
- ✅ Created professional 3-page swipeable intro carousel
- ✅ Page 1: Snap & Solve Homework (camera feature)
- ✅ Page 2: Daily Brain Boost (15-min AI tutoring)
- ✅ Page 3: Track & Achieve Goals (streaks, Malaysian syllabus)
- ✅ Uses actual onboarding images from assets
- ✅ Shows only once on first app launch
- ✅ Skip button and smooth animations

### 2. Onboarding Flow
- ✅ Enabled onboarding for first-time users
- ✅ Improved navigation and state management
- ✅ Added better logging for debugging
- ✅ Fixed edge cases and timeout handling

### 3. Login Page
- ✅ Removed all spacing between logo and "Welcome to Genius"
- ✅ Logo margin: -20px below
- ✅ Text margin: -8px above
- ✅ Much tighter, professional look

### 4. Splash Screen / Loading Screens
- ✅ Loading screen shows during auth initialization
- ✅ "Checking your profile..." message during onboarding check
- ✅ "Preparing onboarding..." when redirecting to onboarding
- ✅ All loading states properly managed

## 🧪 How to Test Intro Screens

### To See the Intro Again:
1. Clear AsyncStorage by running in React Native Debugger console:
```javascript
AsyncStorage.removeItem('hasSeenIntro')
```
2. Or delete and reinstall the app
3. The intro will show on next app launch

### For Fresh Testing:
1. Delete the app from device/simulator
2. Reinstall and run
3. You'll see: Splash → 3-Page Intro → Login

## 🧪 How to Test Onboarding

### For New Users
1. **Create a new account**: Sign up with a new email
2. After login, you should automatically see the onboarding screen
3. Complete all onboarding steps
4. You'll be redirected to the home screen

### For Existing Users (Already Completed Onboarding)

**Option A: Reset via Supabase Dashboard**
1. Open Supabase Dashboard → **Table Editor** → **users**
2. Find your account by email
3. Set `onboarding_completed` to `false`
4. Reload your app
5. You should now see onboarding

**Option B: Reset via SQL**
1. Open Supabase Dashboard → **SQL Editor**
2. Run this query:
```sql
UPDATE users 
SET onboarding_completed = false 
WHERE email = 'your-email@example.com';
```
3. Reload your app

**Option C: Use the SQL Script**
1. Open `database/reset_onboarding_for_user.sql`
2. Follow the instructions in the file
3. Run it in Supabase SQL Editor

## 🔍 Debugging

### Check Console Logs

Watch your Metro bundler console for these logs:

```
🔍 OnboardingCheck: Starting check...
📊 OnboardingCheck: Querying database for user: [id]
✅ OnboardingCheck: Found profile: { onboarding_completed: false }
➡️ OnboardingCheck: User needs onboarding
🔀 OnboardingCheck: Navigating to /onboarding
```

### Common Issues

**Issue: "Onboarding doesn't show"**
- ✅ Check your `onboarding_completed` status in database (should be `false`)
- ✅ Check console logs for errors
- ✅ Verify you're logged in

**Issue: "Stuck on loading screen"**
- ✅ Check console for errors
- ✅ Wait 5 seconds (safety timeout will kick in)
- ✅ Verify Supabase connection

**Issue: "Splash screen doesn't show"**
- ✅ The splash screen shows during initial app load (0-3 seconds)
- ✅ Check that fonts are loading properly
- ✅ Look for purple gradient with logo during startup

## 📱 Expected Flow

### First-Time User
```
1. Open App → Splash Screen (purple gradient)
2. → 3-Page Intro Carousel (Snap & Solve, Daily Brain Boost, Track Goals)
3. → Click "Get Started" → Login/Register
4. → After Login → "Checking your profile..."
5. → Onboarding Chat Interface (name, school, subjects, etc.)
6. → Complete Onboarding → "Welcome!" Alert
7. → Redirect to Home → Main App
```

### Returning User
```
1. Open App → Splash Screen (purple gradient)
2. → Login Page (skips intro)
3. → Auto-Login → "Checking your profile..."
4. → Onboarding check complete → Main App
```

## 🎯 Files Modified/Created

1. **`app/intro.tsx`** - NEW! Professional 3-page intro carousel
2. **`components/NavigationHandler.tsx`** - Updated to check intro status
3. **`components/OnboardingCheck.tsx`** - Enabled onboarding, improved flow
4. **`app/auth/login.tsx`** - Fixed spacing (logo and text closer)
5. **`utils/resetIntro.ts`** - NEW! Helper functions for testing
6. **`database/reset_onboarding_for_user.sql`** - Helper script
7. **`INTRO_SCREEN_GUIDE.md`** - NEW! Comprehensive intro guide
8. **`ONBOARDING_TESTING_GUIDE.md`** - Comprehensive testing guide

## 📋 Checklist for Testing

- [ ] App shows splash screen on startup
- [ ] First-time users see 3-page intro carousel
- [ ] Can swipe between intro pages smoothly
- [ ] Skip button works, "Get Started" goes to login
- [ ] After seeing intro once, it doesn't show again
- [ ] Login page has no gap between logo and text
- [ ] New users see onboarding after signup
- [ ] Onboarding completes successfully
- [ ] Data saves to database correctly
- [ ] Users redirected to home after onboarding
- [ ] Existing users skip intro and onboarding
- [ ] All loading screens show properly
- [ ] No console errors

## 🚀 Next Steps

1. Test the onboarding flow with the steps above
2. If you see any issues, check console logs
3. Review `ONBOARDING_TESTING_GUIDE.md` for detailed troubleshooting
4. The app should hot-reload automatically with the changes

## 💡 Tips

- The app caches the onboarding check, so you may need to fully restart the app
- Use `npx expo start --clear` if you see unexpected behavior
- Check Supabase Dashboard to verify data is being saved
- All console logs are prefixed with emojis for easy filtering (🔍, 📊, ✅, ❌)

