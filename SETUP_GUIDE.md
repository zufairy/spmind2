# Backend Infrastructure Setup Guide

This guide will help you set up the complete backend infrastructure for your tutor app with user authentication, database, and dynamic note storage.

## Prerequisites

- Node.js and npm installed
- Expo CLI installed
- A Supabase account (free tier available)

## Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Note down your project URL and anon key

## Step 2: Configure Environment Variables

✅ **Already Configured!** Your Supabase credentials are already set up in `services/supabase.ts`.

**Current Configuration:**
- **Project URL**: `https://dzothjxrsbrxezqzkesx.supabase.co`
- **Anon Key**: Already configured and ready to use

If you need to change these credentials in the future, you can update the `services/supabase.ts` file directly.

## Step 3: Set up Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script to create all tables and policies

**Important**: If you encounter "row-level security policy" errors during user registration, you may need to update the RLS policy for the users table. Run this SQL command in your Supabase SQL Editor:

```sql
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new policy that allows user registration
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## Step 4: Install Additional Dependencies

```bash
npm install @react-native-async-storage/async-storage
```

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your authentication providers (email/password is enabled by default)
3. Set up email templates for verification and password reset

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the app - you should be redirected to login
3. Try creating a new account
4. Test logging in and accessing the notes section

## Database Schema Overview

### Users Table
- Stores user profile information (name, school, age, birth date)
- Linked to Supabase Auth users
- Row Level Security enabled
- **Note**: Grade level field has been removed for simplicity

### Notes Table
- Main notes with title, content, type, and tags
- User-specific with RLS policies
- Supports different note types (general, homework, study, personal)

### Sticky Notes Table
- Individual sticky notes linked to main notes
- Includes position data for UI layout
- Supports completion status and tags

### Recording Sessions Table
- Stores audio recordings and transcripts
- Linked to users and subjects
- Includes AI-generated sticky notes

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Secure user registration and login
- **Data Validation**: Input validation on both client and server
- **Secure Storage**: Passwords are hashed by Supabase Auth

## API Endpoints

The app uses Supabase's built-in REST API with the following main operations:

### Authentication
- `POST /auth/v1/signup` - User registration
- `POST /auth/v1/token` - User login
- `POST /auth/v1/logout` - User logout

### Notes
- `GET /rest/v1/notes` - Fetch user's notes
- `POST /rest/v1/notes` - Create new note
- `PUT /rest/v1/notes/:id` - Update note
- `DELETE /rest/v1/notes/:id` - Delete note

### Sticky Notes
- `GET /rest/v1/sticky_notes` - Fetch user's sticky notes
- `POST /rest/v1/sticky_notes` - Create new sticky note
- `PUT /rest/v1/sticky_notes/:id` - Update sticky note
- `DELETE /rest/v1/sticky_notes/:id` - Delete sticky note

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check your Supabase credentials
   - Verify email verification is configured
   - Check RLS policies are properly set

2. **Database Connection Issues**
   - Verify your Supabase project is active
   - Check network connectivity
   - Verify table names match the schema

3. **Permission Denied Errors**
   - Ensure RLS policies are enabled
   - Check user authentication status
   - Verify table permissions

### Debug Mode

Enable debug logging by adding this to your app:

```typescript
// In services/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'tutor-app',
    },
  },
});
```

## Production Considerations

1. **Environment Variables**: Use proper environment variable management
2. **Error Handling**: Implement comprehensive error handling
3. **Rate Limiting**: Consider implementing rate limiting for API calls
4. **Monitoring**: Set up logging and monitoring for production
5. **Backup**: Regular database backups
6. **SSL**: Ensure all connections use HTTPS

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the error logs in your Supabase dashboard
3. Verify your database schema matches the provided SQL
4. Test with a fresh Supabase project

## Next Steps

After setup, consider implementing:
- Real-time updates using Supabase subscriptions
- File uploads for audio recordings
- Advanced search functionality
- User profile management
- Social features and sharing
