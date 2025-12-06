// Helper to load external wordlist into Word Bomb game
// This allows you to use comprehensive wordlists from GitHub

import { loadWordlistFromJSON } from './wordList';

/**
 * Load a wordlist from a JSON file
 * 
 * Usage:
 * 1. Download a wordlist (e.g., from GitHub)
 * 2. Convert it to JSON array format: ["word1", "word2", ...]
 * 3. Place it in assets/wordlist.json
 * 4. Call this function when the game starts
 * 
 * Recommended wordlists:
 * - https://github.com/dwyl/english-words (370k+ words)
 * - https://github.com/first20hours/google-10000-english (10k most common)
 * - https://github.com/atebits/Words (for Scrabble/word games)
 */

// Example 1: Load from a JSON file in assets
export async function loadWordlistFromAssets() {
  try {
    // Option A: If you have a JSON file
    const wordlist = require('../assets/wordlist.json');
    
    if (Array.isArray(wordlist)) {
      loadWordlistFromJSON(wordlist);
      return true;
    } else {
      console.error('❌ Wordlist must be an array of strings');
      return false;
    }
  } catch (error) {
    console.warn('⚠️ No external wordlist found, using built-in dictionary');
    return false;
  }
}

// Example 2: Load from a text file (one word per line)
// Note: This requires a custom loader or converting the text file to JSON first
export function convertTextToJSON(textContent: string): string[] {
  return textContent
    .split('\n')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length >= 3); // Filter out short words
}

// Example 3: Fetch from a URL (requires internet)
export async function loadWordlistFromURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // If it's JSON
    try {
      const wordlist = JSON.parse(text);
      if (Array.isArray(wordlist)) {
        loadWordlistFromJSON(wordlist);
        return true;
      }
    } catch {
      // If it's a text file (one word per line)
      const wordlist = convertTextToJSON(text);
      loadWordlistFromJSON(wordlist);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to load wordlist from URL:', error);
    return false;
  }
}

/**
 * Recommended setup for production:
 * 
 * 1. Download a curated wordlist for word games
 * 2. Filter to only include:
 *    - Words between 3-15 letters
 *    - Common/appropriate words (remove profanity, proper nouns)
 *    - English dictionary words
 * 3. Convert to JSON array
 * 4. Load at app startup
 */

