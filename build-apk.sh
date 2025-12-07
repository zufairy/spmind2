#!/bin/bash

# Script to build Android APK using EAS Build
# This script will guide you through the build process

echo "🚀 Building Android APK with EAS Build..."
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing..."
    npm install -g eas-cli
fi

# Check if logged in
echo "📋 Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Please run: eas login"
    exit 1
fi

echo "✅ Logged in to EAS"
echo ""

# Remove android directory if it exists (for managed workflow)
if [ -d "android" ]; then
    echo "🗑️  Removing local android directory for managed workflow..."
    rm -rf android
fi

# Build the APK
echo "🔨 Starting build process..."
echo "📝 Note: You may be prompted to generate a new Android Keystore."
echo "   Answer 'y' (yes) if this is your first build."
echo ""

eas build --platform android --profile preview

echo ""
echo "✅ Build process completed!"
echo "📱 You can download your APK from: https://expo.dev/accounts/zufairy/projects/bolt-expo-nativewind/builds"
echo ""

