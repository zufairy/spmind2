# Forgot Password Feature Setup

## Overview
The forgot password feature allows users to reset their password using either their **username** or **email**.

## Database Setup

### Step 1: Run the Migration
Execute the SQL migration to create the password reset lookup function:

```sql
-- Run this in your Supabase SQL Editor
-- File: database/migrations/add_password_reset_lookup.sql
```

This creates the `get_email_by_username()` function that allows the app to look up a user's email by their username during password reset.

### Step 2: Verify RPC Function
You can test the function in the Supabase SQL Editor:

```sql
-- Test the function
SELECT get_email_by_username('testuser');
```

## How It Works

1. User clicks "Forgot Password?" on the login page
2. They are redirected to `/auth/forgot-password`
3. User enters their **username** OR **email**
4. If username is entered:
   - App calls `get_email_by_username()` RPC function
   - Function returns the associated email address
5. Password reset email is sent to the email address
6. User receives email with reset link
7. User clicks link and resets password

## Security Features

- RPC function uses `SECURITY DEFINER` to bypass RLS safely
- Only returns email address, no other sensitive data
- Function is accessible to both anonymous and authenticated users
- No direct table access required

## Files Modified

- **Created**: `app/auth/forgot-password.tsx` - New forgot password page
- **Modified**: `app/auth/login.tsx` - Updated to redirect to forgot password page
- **Created**: `database/migrations/add_password_reset_lookup.sql` - RPC function

## User Flow

```
Login Page
    ↓
  Click "Forgot Password?"
    ↓
Forgot Password Page
    ↓
Enter Username/Email
    ↓
  Click "Send Reset Link"
    ↓
Check Email → Reset Password
```

## Testing

1. Go to login page
2. Click "Forgot Password?"
3. Enter a valid username (e.g., "testuser")
4. Click "Send Reset Link"
5. Check email for password reset link
6. Follow link to reset password

## Troubleshooting

**Console Error: "email address is invalid" (e.g., "h@g.com" is invalid)**
This means Supabase rejected the email format as invalid or suspicious.

Common causes:
- Email has very short domain (e.g., "h@g.com")
- Email looks like a test/fake address
- Email doesn't meet Supabase's validation rules

To fix, update the user's email to a valid format:
```sql
-- Check current email
SELECT username, email FROM users WHERE username = 'yourusername';

-- Update to a proper email address
UPDATE users 
SET email = 'valid.email@gmail.com'  -- Use a real email domain
WHERE username = 'yourusername';
```

**Valid email examples:**
- `user@gmail.com` ✅
- `test@outlook.com` ✅
- `student@yahoo.com` ✅

**Invalid email examples:**
- `h@g.com` ❌ (too short)
- `test@x.y` ❌ (suspicious)
- `fake@fake.fake` ❌ (invalid TLD)

**Error: "Username not found"**
- Username doesn't exist in database
- Check for typos
- Username is case-insensitive

**Error: "Failed to send reset email"**
- Check Supabase email configuration
- Verify RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'get_email_by_username';`
- Ensure user has valid email in database

**RPC function not found**
- Run the migration SQL in Supabase SQL Editor
- Grant proper permissions to anon/authenticated roles

**Testing with valid data**
Make sure your test user has both username AND email:
```sql
-- Verify test user
SELECT id, username, email FROM users WHERE username = 'testuser';

-- If email is missing, add it
UPDATE users 
SET email = 'test@example.com' 
WHERE username = 'testuser';
```

