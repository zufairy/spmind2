#!/bin/bash
# Setup script for Wordnik wordlist on Mac/Linux
# This downloads and converts the Wordnik wordlist for Word Bomb

echo ""
echo "================================================"
echo " Word Bomb - Wordnik Wordlist Setup"
echo "================================================"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ ERROR: curl is not installed"
    echo ""
    echo "Please install curl or download manually from:"
    echo "https://github.com/wordnik/wordlist/blob/main/wordlist-20210729.txt"
    echo ""
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/3] Downloading Wordnik wordlist..."
curl -o wordlist-20210729.txt https://raw.githubusercontent.com/wordnik/wordlist/main/wordlist-20210729.txt
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to download wordlist"
    exit 1
fi
echo "     ✅ Downloaded successfully!"
echo ""

echo "[2/3] Converting to JSON format..."
node scripts/convert-wordnik-wordlist.js
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Conversion failed"
    exit 1
fi
echo ""

echo "[3/3] Cleaning up..."
rm wordlist-20210729.txt
echo "     ✅ Deleted temporary file"
echo ""

echo "================================================"
echo " ✅ SUCCESS! Wordnik wordlist is ready!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Restart your app (npm start -- --reset-cache)"
echo "  2. Open Word Bomb game"
echo "  3. Check console for: \"✅ Using external wordlist\""
echo ""
echo "The wordlist is saved in: assets/wordlist.json"
echo ""

