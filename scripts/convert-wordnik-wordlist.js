// Script to convert Wordnik wordlist to JSON format for Word Bomb game
// Usage: node scripts/convert-wordnik-wordlist.js

const fs = require('fs');
const path = require('path');

console.log('📦 Converting Wordnik wordlist to JSON...\n');

// Input and output paths
const inputFile = 'wordlist-20210729.txt';
const outputFile = path.join('assets', 'wordlist.json');

try {
  // Read the text file
  const text = fs.readFileSync(inputFile, 'utf-8');
  
  // Convert to array, clean, and filter
  const words = text
    .split('\n')
    .map(word => {
      // Remove quotes and whitespace
      return word.trim().replace(/^["']|["']$/g, '').toLowerCase();
    })
    .filter(word => {
      // Only include words that:
      // 1. Are at least 3 characters (minimum for Word Bomb)
      // 2. Are at most 15 characters (reasonable maximum)
      // 3. Only contain letters (no numbers, hyphens, etc.)
      return word.length >= 3 && 
             word.length <= 15 && 
             /^[a-z]+$/.test(word);
    });

  // Remove duplicates
  const uniqueWords = [...new Set(words)];
  
  // Sort alphabetically (optional, but nice)
  uniqueWords.sort();

  // Create assets directory if it doesn't exist
  const assetsDir = path.dirname(outputFile);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(uniqueWords, null, 2));

  console.log('✅ Success!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Original words: ${words.length}`);
  console.log(`   - After deduplication: ${uniqueWords.length}`);
  console.log(`   - Output file: ${outputFile}`);
  console.log(`   - File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB\n`);
  
  // Show some sample words
  console.log('🎮 Sample words from the list:');
  const samples = uniqueWords.filter(w => w.includes('er')).slice(0, 10);
  console.log(`   ${samples.join(', ')}...\n`);
  
  console.log('✨ Wordlist is ready! Restart your app to use it.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. You downloaded wordlist-20210729.txt');
  console.log('   2. The file is in the same directory as this script');
  console.log('   3. You have write permissions');
  process.exit(1);
}

