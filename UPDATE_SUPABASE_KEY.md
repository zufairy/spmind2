# Update Supabase API Key

## ⚠️ Important: Get the Correct Key Format

The keys you provided (`sb_publishable_...`) **do not match Supabase's format**. Supabase uses **JWT tokens** that start with `eyJ...`.

## How to Get Your Supabase Anon Key

### Step 1: Go to Supabase Dashboard
1. Visit: https://app.supabase.com
2. Log in to your account
3. Select your project (URL: `https://dzothjxrsbrxezqzkesx.supabase.co`)

### Step 2: Navigate to API Settings
1. Click **Settings** (gear icon in left sidebar)
2. Click **API** under Project Settings

### Step 3: Find Your Keys
You'll see:
- **Project URL**: `https://dzothjxrsbrxezqzkesx.supabase.co` ✅
- **anon public** key: A long JWT token starting with `eyJ...` ← **THIS IS WHAT WE NEED**
- **service_role** key: Another JWT token (DO NOT use this in client code - it's secret!)

### Step 4: Copy the Anon Key
- Copy the **anon public** key (it will be a long string starting with `eyJ...`)
- It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 5: Update the Configuration
Once you have the correct anon key, I'll update it in `services/supabase.ts`.

## Current Configuration

**URL**: ✅ Correct - `https://dzothjxrsbrxezqzkesx.supabase.co`
**Anon Key**: Needs to be updated with the correct JWT token from your dashboard

## If Your Project Was Paused

If Supabase paused your project and you reactivated it:
- The URL should remain the same ✅
- **BUT** you may need to get a fresh anon key from Settings → API
- Old keys might expire after project pause

## Next Steps

1. Get the anon key from Supabase Dashboard → Settings → API
2. Share it with me (it should start with `eyJ...`)
3. I'll update `services/supabase.ts` with the correct key
4. The connection should work!

