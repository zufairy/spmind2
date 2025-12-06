# Storage Setup for Profile Images

## Supabase Storage Bucket Setup

To enable profile image uploads, you need to create a storage bucket in Supabase:

### 1. Create the Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create a bucket with the following settings:
   - **Name**: `user-avatars`
   - **Public**: ✓ (checked)
   - This allows public read access to profile images

### 2. Set up Storage Policies

After creating the bucket, set up the following policies:

#### Allow authenticated users to upload their own avatars:

```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Allow authenticated users to update their own avatars:

```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Allow public read access to all avatars:

```sql
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

## Database Migration

Run the migration to add the new profile fields:

```bash
# In Supabase SQL Editor, run:
# database/migrations/add_profile_fields.sql
```

Or manually execute:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Ambitious',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

## Testing

After setup, test the profile image upload feature:

1. Open the app and go to the Profile page
2. Click the edit button (pencil icon)
3. Click "Upload Photo"
4. Select an image from your device
5. Save the profile

The image should be uploaded to `user-avatars/avatars/{user_id}-{timestamp}.{ext}`

