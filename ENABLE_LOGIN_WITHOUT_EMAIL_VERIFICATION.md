# Enable Login Without Email Verification

To allow users to login without verifying their email, you have two options:

## Option 1: Disable Email Confirmation in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **Auth Providers** section
4. Click on **Email** provider
5. **Disable** the "Confirm email" toggle
6. Save changes

This is the simplest solution and will allow all users to login without email verification.

## Option 2: Auto-Confirm Emails with Database Trigger

If you prefer to keep email confirmation enabled but auto-confirm users on signup:

1. Go to Supabase Dashboard > SQL Editor
2. Run the SQL script: `database/scripts/auto_confirm_email_trigger.sql`
3. This creates a trigger that automatically confirms emails when users sign up

After running either option, users will be able to:
- ✅ Login immediately after registration
- ✅ Login without clicking email verification links
- ✅ Access the app without email confirmation delays

## Verification

To verify it's working:
1. Register a new account
2. Try to login immediately (without checking email)
3. You should be able to login successfully

## Notes

- **Option 1** is simpler and recommended for development/testing
- **Option 2** maintains email confirmation in settings but auto-confirms on signup
- Both options achieve the same result: users can login without manual email verification

