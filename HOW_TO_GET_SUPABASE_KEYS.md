# How to Get Your Supabase Keys

## Important Note
The keys you provided (`sb_publishable_...` and `sb_secret_...`) don't match Supabase's standard format. Supabase uses JWT tokens that start with `eyJ...`.

## How to Get the Correct Keys

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (the one with URL: `https://dzothjxrsbrxezqzkesx.supabase.co`)
3. **Navigate to**: Settings → API
4. **You'll see**:
   - **Project URL**: `https://dzothjxrsbrxezqzkesx.supabase.co` ✅ (This matches!)
   - **anon public** key: This is a JWT token starting with `eyJ...` - **THIS IS WHAT WE NEED**
   - **service_role** key: Also a JWT token (secret, don't use in client code)

## What We Need

For the app, we need the **anon public** key (the one starting with `eyJ...`).

**DO NOT use** the service_role key in the client - it's secret and should only be used server-side.

## Update the Configuration

Once you have the anon key from Supabase Dashboard, I'll update it in `services/supabase.ts`.

