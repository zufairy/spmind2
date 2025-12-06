# Setup Scripts

This directory contains setup and utility scripts for the Word Bomb game.

## Available Scripts

### setup-wordnik.bat / setup-wordnik.sh

Automatically downloads and sets up the Wordnik wordlist for Word Bomb game.

**Windows**:
```bash
scripts\setup-wordnik.bat
```

**Mac/Linux**:
```bash
chmod +x scripts/setup-wordnik.sh
./scripts/setup-wordnik.sh
```

**What it does**:
1. Downloads the Wordnik wordlist from GitHub
2. Converts it to JSON format
3. Places it in `assets/wordlist.json`
4. Cleans up temporary files

### convert-wordnik-wordlist.js

Node.js script to convert the Wordnik text wordlist to JSON format.

**Usage**:
```bash
node scripts/convert-wordnik-wordlist.js
```

**Requirements**:
- `wordlist-20210729.txt` must be in the project root
- Node.js installed

**Output**:
- `assets/wordlist.json` - Ready to use in the app

## Requirements

- **Node.js**: Required for conversion scripts
- **curl**: Required for download scripts (comes with Windows 10+)

## After Setup

1. **Restart your app**:
   ```bash
   npm start -- --reset-cache
   ```

2. **Verify it's working**:
   - Open Word Bomb game
   - Check console for: "✅ Using external wordlist for Word Bomb"

3. **Test words**:
   - Try common words like "fire", "water", "master"
   - All should be recognized!

## Customization

To modify which words are included, edit `convert-wordnik-wordlist.js`:

```javascript
.filter(word => {
  return word.length >= 3 &&    // Minimum length
         word.length <= 15 &&   // Maximum length
         /^[a-z]+$/.test(word); // Only letters
});
```

## Troubleshooting

**Script won't run**:
- Make sure you're in the project root directory
- Check Node.js is installed: `node --version`

**Download fails**:
- Check your internet connection
- Download manually from GitHub and place in project root

**Conversion fails**:
- Make sure `wordlist-20210729.txt` exists
- Check the file isn't corrupted (should be text, one word per line)

## Documentation

For detailed setup instructions, see:
- `data/WORDNIK_SETUP.md` - Wordnik-specific guide
- `data/WORDLIST_SETUP.md` - General wordlist guide

