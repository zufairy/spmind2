# How to Test the Intro Screen

## Quick Reset Method

To see the intro screen again when not logged in, you need to clear the `hasSeenIntro` flag from AsyncStorage.

### Method 1: Using React Native Debugger (Easiest)

1. Open your app in development mode
2. Open React Native Debugger (or Chrome DevTools)
3. In the Console tab, run:
```javascript
AsyncStorage.removeItem('hasSeenIntro').then(() => console.log('Intro reset!'))
```
4. **Close the app completely** (don't just refresh)
5. Reopen the app - you should see the intro!

### Method 2: Add Temporary Button in Login Screen

Add this code temporarily to `app/auth/login.tsx`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this button near the top of your screen for testing
<TouchableOpacity 
  style={{position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'red'}}
  onPress={async () => {
    await AsyncStorage.removeItem('hasSeenIntro');
    Alert.alert('Intro Reset', 'Close and reopen the app to see intro');
  }}
>
  <Text style={{color: 'white'}}>Reset Intro</Text>
</TouchableOpacity>
```

### Method 3: Delete and Reinstall App

1. Delete the app from your device/simulator
2. Reinstall by running `npx expo start`
3. The intro will show automatically

### Method 4: iOS Simulator

```bash
# Reset iOS simulator completely
xcrun simctl erase all
# Then reinstall your app
```

### Method 5: Android Emulator

```bash
# Clear app data
adb shell pm clear com.yourapp.bundleid
# Or wipe data
adb shell pm clear your.app.package.name
```

## Check Current Status

To check if intro has been seen:

```javascript
AsyncStorage.getItem('hasSeenIntro').then(value => console.log('Has seen intro:', value))
```

## Expected Behavior

### First Time (No Login, No Intro Seen):
```
App Opens → Splash Screen → 3-Page Intro → Login Page
```

### After Seeing Intro Once:
```
App Opens → Splash Screen → Login Page (skip intro)
```

### After Logging In:
```
App Opens → Splash Screen → Home (or Onboarding if first login)
```

## Troubleshooting

**"Intro still doesn't show"**
- Make sure you cleared `hasSeenIntro` from AsyncStorage
- **Important:** Close and reopen the app (don't just refresh)
- Check Metro console for logs: `👋 NavigationHandler: First time user, showing intro`
- Try deleting and reinstalling the app

**"App goes straight to login"**
- AsyncStorage still has `hasSeenIntro` value
- Run the clear command again
- Make sure you're completely closing the app

**"I see errors"**
- Check Metro bundler console for errors
- Make sure all dependencies are installed
- Try: `npx expo start --clear`

## Console Logs to Watch For

When intro should show:
```
🧭 NavigationHandler: Checking navigation...
⏳ NavigationHandler: Auth still loading
🧭 NavigationHandler: Checking navigation...
👋 NavigationHandler: First time user, showing intro
```

When intro should be skipped:
```
🧭 NavigationHandler: Checking navigation...
🔒 NavigationHandler: Returning user, going to login
```

## Quick Test Script

Save this as a snippet and run in the console:

```javascript
// Clear intro and check
await AsyncStorage.removeItem('hasSeenIntro');
const value = await AsyncStorage.getItem('hasSeenIntro');
console.log('Intro status after clear:', value); // Should be null
console.log('Close and reopen app to see intro!');
```




