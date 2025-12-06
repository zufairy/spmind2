-- Add new profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Ambitious',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comment for documentation
COMMENT ON COLUMN users.username IS 'Unique username for the user (Twitter/X style)';
COMMENT ON COLUMN users.bio IS 'User bio/status text';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture in storage';

