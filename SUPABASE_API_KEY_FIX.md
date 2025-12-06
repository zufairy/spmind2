# Supabase API Key Fix

## Problem
"No API key found in request" error when trying to login or use Supabase.

## Root Cause
The custom `fetch` function in `services/supabase.ts` was not properly preserving or setting the `apikey` header that Supabase requires for all requests.

## Solution

### 1. Fixed Header Preservation
- The custom `fetch` now properly preserves all existing headers
- Checks for API key in multiple case variations (`apikey`, `Apikey`, `APIKEY`)
- Always ensures both `apikey` and `Authorization` headers are set for Supabase requests

### 2. Guaranteed API Key Inclusion
For all requests to `supabase.co`:
- **apikey header**: Always set if missing
- **Authorization header**: Always set with `Bearer {anon_key}` if missing

### 3. What Changed
In `services/supabase.ts`, the `customFetch` function now:
- ✅ Preserves all existing headers
- ✅ Checks for API key in multiple formats
- ✅ Always adds `apikey` header for Supabase requests
- ✅ Always adds `Authorization: Bearer {key}` header for Supabase requests
- ✅ Properly handles Content-Type headers

## Testing

Try logging in again - the "No API key found in request" error should be resolved.

## Verification

The fix ensures that every request to Supabase includes:
1. `apikey` header with your anon key
2. `Authorization: Bearer {anon_key}` header

Both are required for Supabase authentication to work properly.

