# Google OAuth Setup Guide

## Overview
This guide will help you set up Google OAuth authentication for your Genius app.

## Prerequisites
- Google Cloud Console account
- Your app's bundle identifier/package name

## Quick Setup Checklist
- [ ] Create Google Cloud Project
- [ ] Configure OAuth Consent Screen (with scopes)
- [ ] Create OAuth 2.0 Client ID
- [ ] Configure Supabase Google Provider
- [ ] Test the authentication flow

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

## Step 2: Configure OAuth Consent Screen

**⚠️ CRITICAL**: This step MUST be completed before creating OAuth credentials!

1. In Google Cloud Console, go to **"APIs & Services" > "OAuth consent screen"**
2. Choose **"External"** user type (unless you have Google Workspace)
3. Fill in the required fields:
   - **App name**: "Genius App"
   - **User support email**: your email
   - **Developer contact information**: your email
4. Click **"SAVE AND CONTINUE"**
5. **IMPORTANT**: In the "Scopes" section:
   - Click **"ADD OR REMOVE SCOPES"**
   - Search and add these scopes:
     - `../auth/userinfo.email` (View your email address)
     - `../auth/userinfo.profile` (View your basic profile info)
     - `openid` (Associate you with your personal info on Google)
   - Click **"UPDATE"**
6. Click **"SAVE AND CONTINUE"**
7. Add test users if needed (for development)
8. Click **"SAVE AND CONTINUE"** to finish
9. **For production**: You'll need to submit your app for verification

**Note**: You should now see "OAuth consent screen configured" status in your project.

## Step 3: Create OAuth 2.0 Credentials

**IMPORTANT**: You must complete Step 2 (OAuth Consent Screen) before creating credentials!

1. Go to "APIs & Services" > "Credentials"
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth 2.0 Client IDs"**
4. Choose **"Web application"** for the application type
5. Give it a name like "Genius App OAuth Client"
6. Add authorized redirect URIs:
   - **For development with Expo**: `https://auth.expo.io/@your-expo-username/geniusapp`
   - **For Supabase**: `https://dzothjxrsbrxezqzkesx.supabase.co/auth/v1/callback`
   - **For your app scheme**: `geniusapp://auth`
7. Click **"CREATE"**
8. **Copy the Client ID** and **Client Secret** (you'll need both)

## Step 4: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable "Google" provider
4. Add your Google OAuth Client ID and Client Secret
5. Set redirect URL: `https://your-supabase-project.supabase.co/auth/v1/callback`

## Step 5: Update Your App Configuration

1. Replace `YOUR_GOOGLE_CLIENT_ID` in `services/authService.ts` with your actual Client ID
2. Update your app.json with the correct scheme:

```json
{
  "expo": {
    "scheme": "geniusapp",
    "platforms": ["ios", "android", "web"]
  }
}
```

## Step 6: Test the Integration

1. Run your app in development mode
2. Tap the "Continue with Google" button
3. **Expected behavior**: You should see Google's consent screen asking for permissions
4. Complete the OAuth flow
5. Verify that the user is logged in and redirected to the home screen

### Debugging Steps:
If the consent screen doesn't appear:
1. Check your browser's developer console for any errors
2. Verify your Google Cloud Console OAuth consent screen configuration
3. Make sure you've added the required scopes (`openid`, `profile`, `email`)
4. Try logging out of Google in your browser and testing again
5. Test with a different Google account

## Troubleshooting

### Common Issues:
1. **Invalid redirect URI**: Make sure the redirect URI in Google Console matches your app's scheme
2. **OAuth consent screen not verified**: For production, you'll need to verify your app with Google
3. **Client ID not found**: Double-check that you've replaced the placeholder Client ID
4. **No consent screen appearing**: 
   - Make sure you've added the required scopes in Google Console
   - Check that your OAuth consent screen is properly configured
   - Ensure you're not already logged in with the same Google account
   - Try using an incognito/private browser window
5. **"This app isn't verified" warning**: This is normal for development. Click "Advanced" then "Go to [App Name] (unsafe)"

### Development vs Production:
- For development: Use Expo's auth proxy (`https://auth.expo.io/@username/project`)
- For production: Use your own domain with proper SSL certificate

## Security Notes:
- Never commit your Client Secret to version control
- Use environment variables for sensitive configuration
- Always use HTTPS in production
- Regularly rotate your OAuth credentials

## Next Steps:
After successful setup, users will be able to:
1. Sign in with their Google account
2. Automatically create a user profile in your database
3. Access all app features without manual registration
