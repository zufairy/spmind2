# .env File Setup Guide

## 📍 Where is the .env file?

The `.env` file **doesn't exist yet** - you need to create it!

### Location
The `.env` file should be in the **root directory** of your project:
```
/Users/admin/geniusapp/.env
```

## ✅ How to Create It

### Option 1: Copy the Template (Recommended)
1. Copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update with your actual values

### Option 2: Create Manually
1. Create a new file named `.env` in the root directory
2. Copy the contents from `.env.example`
3. Fill in your actual API keys

## 🔑 Required Environment Variables

### 1. Supabase Anon Key (Required)
```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **How to get it**: Supabase Dashboard → Settings → API → anon public
- **Format**: JWT token starting with `eyJ...`
- **Current value**: Already set in code as fallback, but best practice is to use .env

### 2. OpenAI API Key (Required)
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
```
- **How to get it**: https://platform.openai.com/api-keys
- **Current value**: Already set in `config/api.ts` as fallback

### 3. ElevenLabs API Key (Optional)
```env
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_key_here
```
- **How to get it**: https://elevenlabs.io/app/settings/api-keys
- **Only needed** if using ElevenLabs text-to-speech

## 📝 Important Notes

### Expo Environment Variables
- **Prefix required**: All environment variables **must** start with `EXPO_PUBLIC_` to be accessible in the app
- **No quotes needed**: Don't wrap values in quotes (unless the value itself contains spaces)
- **Restart required**: After changing `.env`, restart your Expo development server

### Security
- ✅ `.env` is already in `.gitignore` - it won't be committed to git
- ✅ `.env.example` is a template - safe to commit (no real keys)
- ⚠️ **Never commit** `.env` with real API keys!

## 🔄 How It Works

The code checks environment variables first, then falls back to hardcoded values:

1. **First**: Checks `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. **Then**: Falls back to hardcoded value in `services/supabase.ts`

Same for OpenAI key:
1. **First**: Checks `process.env.EXPO_PUBLIC_OPENAI_API_KEY`
2. **Then**: Falls back to value in `config/api.ts`

## ✅ Quick Setup

Run these commands:

```bash
# 1. Copy the template
cp .env.example .env

# 2. Edit the file (replace with your actual keys)
# Use any text editor or:
nano .env
# or
code .env  # if using VS Code

# 3. Restart Expo
npx expo start --clear
```

## 🧪 Verify It's Working

After creating `.env` and restarting Expo, check the console logs. You should see:
- ✅ "API key loaded successfully"
- ✅ "API Key source: environment variable" (not "config file")

If you see "config file" instead of "environment variable", the `.env` file isn't being read. Make sure:
1. File is named exactly `.env` (not `.env.local` or `.env.development`)
2. Variables start with `EXPO_PUBLIC_`
3. You restarted the Expo server

## 📁 File Structure

```
geniusapp/
├── .env              ← Create this file (gitignored)
├── .env.example      ← Template (safe to commit)
├── .gitignore        ← Already ignores .env
├── config/
│   └── api.ts        ← Fallback values here
└── services/
    └── supabase.ts   ← Fallback values here
```

