# 🚀 Quick Spline Installation

## Step 1: Install Package
```bash
npx expo install react-native-webview -- --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is needed due to React 19 compatibility.

## Step 2: Add Your Spline URL

In `app/daily-brain-boost.tsx` at **line 778**, replace:
```typescript
sceneUrl="YOUR_SPLINE_URL"
```

With your actual Spline URL:
```typescript
sceneUrl="https://my.spline.design/your-brain-scene-url"
```

## Step 3: Run App
```bash
npm start
```

## 📖 Full Guide
See `SPLINE_SETUP_GUIDE.md` for detailed instructions and troubleshooting.

