# Using the Wordnik Wordlist for Word Bomb

The [Wordnik Wordlist](https://github.com/wordnik/wordlist) is an open-source wordlist specifically designed for word games, making it perfect for Word Bomb!

## Quick Setup (3 Minutes)

### Option A: Automatic Setup (Easiest) ⚡

**Windows**:
```bash
scripts\setup-wordnik.bat
```

**Mac/Linux**:
```bash
chmod +x scripts/setup-wordnik.sh
./scripts/setup-wordnik.sh
```

That's it! The script will:
- ✅ Download the Wordnik wordlist
- ✅ Convert it to JSON format
- ✅ Place it in `assets/wordlist.json`
- ✅ Clean up temporary files

Then restart your app and Word Bomb will automatically use the Wordnik wordlist.

### Option B: Manual Setup

1. **Download manually**:
   - Go to: https://github.com/wordnik/wordlist/blob/main/wordlist-20210729.txt
   - Click "Raw" button
   - Save as `wordlist-20210729.txt`

2. **Convert to JSON** (using Node.js):
   ```javascript
   const fs = require('fs');
   
   const text = fs.readFileSync('wordlist-20210729.txt', 'utf-8');
   const words = text
     .split('\n')
     .map(w => w.trim().toLowerCase())
     .filter(w => w.length >= 3 && w.length <= 15 && /^[a-z]+$/.test(w));
   
   fs.writeFileSync('assets/wordlist.json', JSON.stringify([...new Set(words)]));
   console.log(`✅ Converted ${words.length} words!`);
   ```
   
   Save as `convert.js` and run: `node convert.js`

3. **Move the file**:
   ```bash
   mv wordlist.json assets/
   ```

4. **Restart your app**

## What You'll Get

- ✅ **Comprehensive**: Thousands of valid English words
- ✅ **Game-Ready**: Specifically curated for word games
- ✅ **MIT Licensed**: Free to use in your game
- ✅ **Maintained**: Regularly updated by Wordnik
- ✅ **Quality**: Excludes offensive terms and proper nouns

## Verify It's Working

1. Open Word Bomb in your app
2. Check the console logs:
   - ✅ Should see: **"✅ Using external wordlist for Word Bomb"**
3. Try entering common words like:
   - "fire", "water", "master", "treasure"
   - All should be accepted!

## Customization

Want to modify the wordlist? Edit `scripts/convert-wordnik-wordlist.js`:

```javascript
// Change minimum word length
word.length >= 4  // Only 4+ letter words

// Change maximum word length  
word.length <= 12  // Max 12 letters

// Add custom filtering
!word.includes('q')  // Exclude words with 'q'
```

Then re-run the conversion script.

## Support Wordnik

Wordnik is a 501(c)3 nonprofit organization. If you find this wordlist useful, consider donating at: https://bit.ly/donatenik

## Troubleshooting

### "No external wordlist found"
- Make sure `wordlist.json` is in the `assets/` folder
- Check it's valid JSON (array format)
- Restart Metro bundler: `npm start -- --reset-cache`

### "curl: command not found"
Download manually from the GitHub link above

### Words still not recognized
- Check the word is in `assets/wordlist.json`
- Make sure all words are lowercase
- Clear app cache and restart

## Alternative: Direct GitHub Link

You can also fetch directly from GitHub (requires internet):

```typescript
// In data/loadWordlist.ts
export async function loadWordnikWordlist() {
  const url = 'https://raw.githubusercontent.com/wordnik/wordlist/main/wordlist-20210729.txt';
  return await loadWordlistFromURL(url);
}
```

Note: This requires an internet connection each time the app starts.

## File Locations

- **Download**: `wordlist-20210729.txt` (root directory)
- **Converted**: `assets/wordlist.json` (used by app)
- **Script**: `scripts/convert-wordnik-wordlist.js`

## Next Steps

After setup, you can:
1. Delete `wordlist-20210729.txt` (original text file)
2. Keep `assets/wordlist.json` (this is what the app uses)
3. The built-in 5000+ word dictionary is kept as fallback

Enjoy your comprehensive word game dictionary! 🎮📚

