# 🎨 Spline 3D Integration Setup Guide

## Overview
This guide will help you integrate your Spline 3D brain model into the Daily Brain Boost feature.

---

## 📦 Step 1: Install Dependencies

You need to install `react-native-webview` to display Spline scenes.

### For Expo (Recommended):
```bash
npx expo install react-native-webview -- --legacy-peer-deps
```

**Note:** The `-- --legacy-peer-deps` flag is required because the project uses React 19, which has peer dependency conflicts with some packages.

### For React Native CLI:
```bash
npm install react-native-webview --legacy-peer-deps
cd ios && pod install && cd ..
```

---

## 🔗 Step 2: Get Your Spline URL

1. **Open your Spline project** at https://spline.design
2. **Click "Export"** in the top right
3. **Select "Export to Web"**
4. **Copy the generated URL** (it will look like: `https://my.spline.design/xxxxxxxxxxxxx`)

### Example URLs:
- `https://my.spline.design/brain-3d-animation-abc123`
- `https://prod.spline.design/your-project-id/scene.splinecode`

---

## ✏️ Step 3: Add Your Spline URL

Open `app/daily-brain-boost.tsx` and find this line (around line 778):

```typescript
<SplineScene 
  sceneUrl="YOUR_SPLINE_URL"  // ← Replace this
  width={120}
  height={120}
/>
```

**Replace** `YOUR_SPLINE_URL` with your actual Spline URL:

```typescript
<SplineScene 
  sceneUrl="https://my.spline.design/brain-3d-animation-abc123"
  width={120}
  height={120}
/>
```

---

## 🎨 Step 4: Customize Appearance (Optional)

### Adjust Size:
```typescript
<SplineScene 
  sceneUrl="https://my.spline.design/your-url"
  width={150}   // Increase for larger brain
  height={150}
/>
```

### Recommended Sizes:
- **Small**: 100x100
- **Medium**: 120x120 (default)
- **Large**: 150x150

---

## 🔧 Troubleshooting

### Issue 1: "ERESOLVE could not resolve" or peer dependency conflict
**Error:** `peer react@"^16.5.1 || ^17.0.0 || ^18.0.0" from lucide-react-native`

**Solution:** Use the legacy peer deps flag:
```bash
npx expo install react-native-webview -- --legacy-peer-deps
```

This happens because your project uses React 19, but some packages haven't updated their peer dependencies yet.

### Issue 2: "Cannot find module 'react-native-webview'"
**Solution:** Make sure you've installed the package:
```bash
npx expo install react-native-webview -- --legacy-peer-deps
```

### Issue 2: Spline scene shows blank/white screen
**Possible causes:**
1. URL is incorrect - double-check your Spline export URL
2. Internet connection required - Spline loads from the web
3. Scene hasn't loaded yet - wait a few seconds

### Issue 3: Spline scene is too small/large
**Solution:** Adjust width and height in the SplineScene component

### Issue 4: Performance issues on older devices
**Solution:** Consider adding a fallback to the Brain icon:

```typescript
{/* Fallback example */}
{Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 28) ? (
  <SplineScene 
    sceneUrl="https://my.spline.design/your-url"
    width={120}
    height={120}
  />
) : (
  <Brain size={60} color="#FFD700" />
)}
```

---

## 📱 Testing

1. **Start your dev server:**
   ```bash
   npm start
   ```

2. **Open on device/simulator**

3. **Navigate to Daily Brain Boost**

4. **Check:**
   - ✅ 3D brain loads properly
   - ✅ Talking indicator animation works
   - ✅ No lag or performance issues
   - ✅ Looks good in both light/dark mode

---

## 🎯 Tips for Best Results

### Spline Scene Optimization:
1. **Keep it simple** - Complex scenes may lag on mobile
2. **Optimize textures** - Use compressed images
3. **Limit animations** - Too many animations = performance hit
4. **Test on real devices** - Simulator doesn't show real performance

### Recommended Spline Settings:
- **Resolution**: Medium or Low for mobile
- **Animations**: Keep minimal (idle animation works great)
- **Lighting**: Simple lighting setup
- **Materials**: Avoid too many reflective/transparent materials

---

## 🌟 Example Spline Scenes

Here are some good reference examples for brain animations:

1. **Rotating Brain** - Simple idle rotation
2. **Pulsing Brain** - Gentle scale animation
3. **Glowing Brain** - Emission animation for "thinking"
4. **Interactive Brain** - Responds to user interaction

---

## 🚀 Next Steps

After integration, you can:

1. **Add more Spline scenes** to other parts of the app
2. **Create different avatars** for different modes
3. **Animate based on AI state** (thinking, speaking, listening)
4. **Add interactive elements** that respond to user input

---

## 📄 File Structure

```
geniusapp/
├── app/
│   └── daily-brain-boost.tsx        ← Spline used here
├── components/
│   └── SplineScene.tsx              ← Reusable Spline component
└── SPLINE_SETUP_GUIDE.md           ← This file
```

---

## ❓ Need Help?

If you encounter issues:

1. Check the Spline URL is correct
2. Verify react-native-webview is installed
3. Test on a real device (not just simulator)
4. Check console for error messages
5. Ensure good internet connection (Spline loads from web)

---

## 🎨 SplineScene Component API

### Props:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sceneUrl` | string | required | Your Spline export URL |
| `width` | number | 200 | Width of the scene container |
| `height` | number | 200 | Height of the scene container |
| `style` | ViewStyle | undefined | Additional custom styles |

### Example Usage:
```typescript
<SplineScene 
  sceneUrl="https://my.spline.design/brain-abc123"
  width={120}
  height={120}
  style={{ marginTop: 10 }}
/>
```

---

## ✅ Checklist

Before deploying:

- [ ] Installed react-native-webview
- [ ] Replaced YOUR_SPLINE_URL with actual URL
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Verified performance is acceptable
- [ ] Checked it works with talking indicator
- [ ] Tested with poor internet connection
- [ ] Added loading state (included by default)

---

Happy coding! 🎉

