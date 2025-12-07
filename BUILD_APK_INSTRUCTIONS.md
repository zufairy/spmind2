# Building Android APK

## Quick Build (Recommended)

Run the build script:
```bash
./build-apk.sh
```

When prompted to "Generate a new Android Keystore?", answer **y** (yes) for your first build.

## Manual Build Steps

If you prefer to build manually:

1. **Make sure you're logged in:**
   ```bash
   eas whoami
   ```
   If not logged in, run:
   ```bash
   eas login
   ```

2. **Remove local Android directory (if exists):**
   ```bash
   rm -rf android
   ```

3. **Start the build:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **When prompted for keystore generation, answer 'y' (yes)**

5. **Wait for the build to complete** (usually 10-20 minutes)

6. **Download your APK** from:
   https://expo.dev/accounts/zufairy/projects/bolt-expo-nativewind/builds

## Build Configuration

- **Profile**: `preview` (creates an APK for direct installation)
- **Platform**: Android
- **Package**: `com.rithdan.geniusapp`
- **Build Type**: APK (not AAB)

## Troubleshooting

### "EAS project not configured"
Run: `eas project:init --force`

### "Generate a new Android Keystore?"
Answer **y** (yes) for the first build. This keystore will be saved and reused for future builds.

### Build fails
- Check your internet connection
- Ensure all dependencies are installed: `npm install`
- Check the build logs on expo.dev

## Alternative: Local Build (Requires Java/Android SDK)

If you have Java and Android SDK installed:

1. **Generate native code:**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find your APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

