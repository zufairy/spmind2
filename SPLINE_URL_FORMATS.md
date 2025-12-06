# 🔧 Spline URL Formats - Fixing Domain Errors

## Your Spline Scene ID
`Ob6Cbl7RUefGcUvF5au28x8H`

---

## ✅ **URL Formats to Try** (in order)

### **Format 1: Production Embed (Currently Using)**
```
https://prod.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode
```
✅ This is now set in your code

---

### **Format 2: Draft URL** (Try this if Format 1 doesn't work)
```
https://draft.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode
```

To change:
In `app/daily-brain-boost.tsx` line 778, replace with:
```typescript
sceneUrl="https://draft.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode"
```

---

### **Format 3: My Spline (Community/Public URL)**
```
https://my.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/
```

To change:
```typescript
sceneUrl="https://my.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/"
```

---

### **Format 4: Full Original URL**
```
https://my.spline.design/interactiveaiassistant-Ob6Cbl7RUefGcUvF5au28x8H/
```

To change:
```typescript
sceneUrl="https://my.spline.design/interactiveaiassistant-Ob6Cbl7RUefGcUvF5au28x8H/"
```

---

## 🔑 **How to Get the Correct URL**

### **Option A: Export from Spline (Recommended)**
1. Open your project in Spline: https://spline.design
2. Click **"Export"** (top right)
3. Select **"Code Export"** 
4. Choose **"React"** or **"Vanilla JS"**
5. Look for the URL in the code - it will be one of:
   - `https://prod.spline.design/...`
   - `https://draft.spline.design/...`
   - Or you'll see an embed code with iframe

### **Option B: Use Embed Code**
1. In Spline, click **"Share"**
2. Copy the **"Embed"** code
3. Look for the URL inside the `<iframe src="...">`
4. Use that URL

### **Option C: Make Scene Public**
1. In Spline, click **"Share"** 
2. Toggle **"Public"** or **"Make Public"**
3. Copy the public link
4. Try both formats:
   - The link as-is
   - Add `/scene.splinecode` at the end

---

## 🚀 **Quick Fix - Test All Formats**

Run this and check your console for which one works:

In `app/daily-brain-boost.tsx`, temporarily test:

```typescript
// Test URLs - try each one
const testURLs = [
  "https://prod.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode",
  "https://draft.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode",
  "https://my.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/",
];

console.log("Testing Spline URLs:", testURLs);
```

---

## ⚠️ **Common Domain Errors & Solutions**

### **Error: "Domain not allowed" or CORS error**
**Cause:** Spline scene is not public or wrong URL format

**Solution:**
1. Make sure your Spline scene is **Public** (Share → Public)
2. Use `prod.spline.design` or `draft.spline.design` URLs
3. Try the iframe wrapper (already implemented)

### **Error: "Failed to load" or blank screen**
**Cause:** Wrong URL or scene doesn't exist

**Solution:**
1. Check URL in browser first
2. Verify the scene ID is correct: `Ob6Cbl7RUefGcUvF5au28x8H`
3. Make sure scene is saved/published in Spline

### **Error: "net::ERR_NAME_NOT_RESOLVED"**
**Cause:** URL format is wrong or typo

**Solution:**
1. Double-check the URL
2. Make sure it starts with `https://`
3. No extra slashes or spaces

---

## 📱 **Test URL in Browser First**

Before using in app, open this URL in your browser:
```
https://prod.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode
```

**What to look for:**
- ✅ If it loads → URL is correct, use in app
- ❌ If 404 error → Try different format
- ❌ If domain error → Scene not public

---

## 🎯 **Current Implementation**

Your code currently uses:
- **File:** `app/daily-brain-boost.tsx`
- **Line:** 778
- **URL:** `https://prod.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode`

The WebView is configured with:
- ✅ Iframe wrapper for better compatibility
- ✅ CORS permissive settings
- ✅ Full access permissions
- ✅ Mixed content allowed

---

## 💡 **Alternative: Use Static Export**

If URLs keep failing, you can export your Spline as static files:

1. **In Spline:** Export → Download → GLB or GLTF
2. **Add to project:** `assets/models/brain.glb`
3. **Use expo-gl + three.js** to load the 3D model locally

This is more complex but doesn't require internet connection.

---

## 🔍 **Debug Steps**

1. ✅ Check if scene is public in Spline
2. ✅ Try URL in browser first
3. ✅ Test different URL formats
4. ✅ Check app console for errors
5. ✅ Verify scene ID is correct

---

## ✅ **Next Steps**

**Try Format 2** if current doesn't work:
```typescript
sceneUrl="https://draft.spline.design/Ob6Cbl7RUefGcUvF5au28x8H/scene.splinecode"
```

Or test the URL in your browser first to see which one loads! 🚀

