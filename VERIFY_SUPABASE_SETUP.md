# Verify Your Supabase Setup

## Current Configuration
- **URL**: ✅ `https://dzothjxrsbrxezqzkesx.supabase.co` (Verified - matches your URL)
- **Anon Key**: Currently using key from config (needs verification)

## Important: Key Format
Supabase uses **JWT tokens** that start with `eyJ...`

The keys you mentioned (`sb_publishable_...` and `sb_secret_...`) don't match Supabase format. These might be from:
- A different service
- An old format
- Wrong location in dashboard

## ✅ How to Get Your Correct Supabase Anon Key

1. **Go to**: https://app.supabase.com
2. **Login** and select your project
3. **Click**: Settings (⚙️ gear icon) → **API**
4. **Look for**: **anon public** key
   - It should be a **long JWT token** starting with `eyJhbGciOiJIUzI1NiIs...`
   - Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...` (very long)

5. **Copy** the entire anon public key

## 🔍 Verify Your Project Status

1. Check if your project is **active** (not paused)
2. If it was paused, you may need to:
   - Resume the project
   - Get fresh keys from Settings → API

## 📝 Update the Configuration

Once you have the correct anon key:
1. Share it with me (it should start with `eyJ...`)
2. I'll update `services/supabase.ts`
3. Test the connection

## 🔧 Quick Test

The app now automatically tests the connection when you open the registration page. Check the console logs for:
- ✅ Connection successful
- ❌ Connection failed (with specific error)

