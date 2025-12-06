# How to Add an External Wordlist to Word Bomb

This guide shows you how to implement an open-source wordlist from GitHub into the Word Bomb game.

## Recommended Wordlists

### Option 1: Wordnik Wordlist (RECOMMENDED for Word Games) ⭐
- **URL**: https://github.com/wordnik/wordlist
- **Size**: Comprehensive but optimized for word games
- **Pros**: Specifically designed for word games, MIT licensed, maintained by Wordnik
- **File**: `wordlist-20210729.txt`
- **Setup Guide**: See `WORDNIK_SETUP.md` for detailed instructions

### Option 2: Google 10,000 Most Common English Words
- **URL**: https://github.com/first20hours/google-10000-english
- **Size**: ~10,000 words
- **Pros**: Fast, covers most common words, good for mobile performance
- **File**: `google-10000-english-no-swears.txt`

### Option 3: DWYL English Words (Most Comprehensive)
- **URL**: https://github.com/dwyl/english-words
- **Size**: ~370,000+ words
- **Pros**: Very comprehensive
- **Cons**: Large file size, may include obscure words
- **File**: `words_alpha.txt`

### Option 4: Scrabble/Word Game Dictionary
- **URL**: https://github.com/atebits/Words
- **Size**: ~170,000 words
- **Pros**: Perfect for word games, excludes proper nouns
- **File**: `en.txt`

## Setup Instructions

### Method 1: JSON Format (Recommended)

#### Step 1: Download and Convert the Wordlist

1. Download your chosen wordlist (e.g., `google-10000-english-no-swears.txt`)

2. Convert it to JSON format. Create a simple Node.js script or use this Python script:

```python
# convert_wordlist.py
import json

# Read the text file
with open('wordlist.txt', 'r') as f:
    words = [line.strip().lower() for line in f if len(line.strip()) >= 3]

# Write to JSON
with open('wordlist.json', 'w') as f:
    json.dump(words, f)

print(f"✅ Converted {len(words)} words to JSON")
```

Or use Node.js:

```javascript
// convert_wordlist.js
const fs = require('fs');

const text = fs.readFileSync('wordlist.txt', 'utf-8');
const words = text
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length >= 3);

fs.writeFileSync('wordlist.json', JSON.stringify(words, null, 2));
console.log(`✅ Converted ${words.length} words to JSON`);
```

#### Step 2: Add to Project

1. Create the assets directory if it doesn't exist:
   ```
   mkdir -p assets
   ```

2. Move `wordlist.json` to `assets/wordlist.json`

#### Step 3: It's Already Configured!

The code is already set up to automatically load `assets/wordlist.json` when the game starts. Just add the file and restart the app.

### Method 2: Direct Import (For Smaller Lists)

If you have a small wordlist (< 20k words), you can directly create a TypeScript file:

```typescript
// data/externalWords.ts
export const EXTERNAL_WORDLIST = [
  'word1',
  'word2',
  'word3',
  // ... more words
];
```

Then import it in `wordList.ts`:

```typescript
import { EXTERNAL_WORDLIST } from './externalWords';

// Add at the top of the file
EXTERNAL_WORDLIST.forEach(word => COMMON_WORDS.add(word));
```

## Recommended Setup for Production

### 1. Download Google 10K English Words

```bash
# Download the wordlist
curl -o google-10000.txt https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt
```

### 2. Filter and Clean (Optional)

```javascript
// clean_wordlist.js
const fs = require('fs');

const text = fs.readFileSync('google-10000.txt', 'utf-8');
const words = text
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => {
    // Only words 3-15 characters
    if (w.length < 3 || w.length > 15) return false;
    
    // Only alphabetic characters
    if (!/^[a-z]+$/.test(w)) return false;
    
    return true;
  });

// Remove duplicates
const uniqueWords = [...new Set(words)];

fs.writeFileSync('wordlist.json', JSON.stringify(uniqueWords, null, 2));
console.log(`✅ Cleaned ${uniqueWords.length} words`);
```

### 3. Add to Project

```bash
# Move to assets folder
mv wordlist.json assets/wordlist.json
```

### 4. Test

Restart your app and check the console:
- ✅ If successful: "✅ Using external wordlist for Word Bomb"
- ⚠️ If not found: "ℹ️ Using built-in dictionary for Word Bomb"

## Performance Tips

1. **For Mobile**: Use 10,000-20,000 words max for best performance
2. **Filter Words**: Remove words < 3 letters and > 15 letters
3. **JSON Format**: Faster to load than text files in React Native
4. **Caching**: The wordlist is loaded once and cached in memory

## Troubleshooting

### "No external wordlist found"
- Check that `wordlist.json` is in the `assets/` folder
- Make sure it's a valid JSON array: `["word1", "word2", ...]`
- Restart the Metro bundler

### "Wordlist must be an array"
- Verify the JSON format
- Should be: `["word", "another"]` not `{"word": true}`

### Words still not recognized
- Check the word is in your wordlist
- Ensure all words are lowercase in the JSON
- Clear app cache and restart

## Alternative: Use a Wordlist API

For the absolute latest and most comprehensive dictionary, you can use an API:

```typescript
// In data/wordList.ts
export async function isValidWordOnline(word: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

Note: This requires internet connection and may be slower.

## Current Status

- ✅ Code is ready to load external wordlists
- ✅ Falls back to built-in 5000+ word dictionary
- ✅ Auto-loads `assets/wordlist.json` if present
- 📝 You just need to add the JSON file!

