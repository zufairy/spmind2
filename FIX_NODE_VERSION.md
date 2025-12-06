# Fix Node.js Version Issue

## The Problem
Node.js v24.7.0 has experimental TypeScript support that conflicts with Expo. This causes the error:
```
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is currently unsupported for files under node_modules
```

## The Solution: Downgrade to Node.js v20 LTS

### Step 1: Download Node.js v20 LTS
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download **Node.js v20.18.0 LTS** (not the latest v24)
3. Run the installer and follow the setup wizard

### Step 2: Verify Installation
Open a new terminal and run:
```bash
node --version
```
Should show: `v20.18.0`

### Step 3: Clean Install Dependencies
```bash
# Delete old dependencies
rm -rf node_modules package-lock.json

# Install fresh
npm install --legacy-peer-deps
```

### Step 4: Start the App
```bash
npm run dev
```

## Alternative: Use Node Version Manager (Advanced)

If you need to keep Node.js v24 for other projects:

### Install nvm-windows:
1. Download from: https://github.com/coreybutler/nvm-windows/releases
2. Install the latest `nvm-setup.exe`
3. Restart your computer

### Use Node.js v20:
```bash
# Install Node.js v20
nvm install 20.18.0

# Switch to v20
nvm use 20.18.0

# Set as default
nvm alias default 20.18.0

# Verify
node --version
```

## Why This Happens
- Node.js v24 introduced experimental TypeScript support
- Expo hasn't updated to support this yet
- Node.js v20 LTS is the recommended version for Expo projects
- This is a known compatibility issue, not a bug in your code

## After Fixing
Once you're on Node.js v20, the app will work perfectly on both Windows and Mac!
