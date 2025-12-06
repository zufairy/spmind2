-- Fix users table schema for proper onboarding flow
-- This makes fields optional until onboarding is completed

-- First, alter the existing constraints to make fields nullable
ALTER TABLE public.users 
  ALTER COLUMN school DROP NOT NULL,
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN birth_date DROP NOT NULL;

-- Update the age CHECK constraint to allow NULL or valid ages
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_age_check;

ALTER TABLE public.users 
  ADD CONSTRAINT users_age_check CHECK (age IS NULL OR (age > 0 AND age < 150));

-- Add username column if it doesn't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS username character varying UNIQUE;

-- Add onboarding-related columns if they don't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS preferred_language character varying DEFAULT 'english' CHECK (preferred_language IN ('english', 'malay', 'mixed'));

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS current_school character varying;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS study_hours_per_day integer DEFAULT 2 CHECK (study_hours_per_day >= 0 AND study_hours_per_day <= 12);

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS weak_subjects text[] DEFAULT '{}';

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS strong_subjects text[] DEFAULT '{}';

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS academic_goals text;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS study_preferences jsonb DEFAULT '{}';

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}';

-- Create index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- Update RLS policies to allow users to insert their own profile with minimal data
-- Drop the old INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new INSERT policy that's more flexible
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Make sure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether the user has completed the onboarding process';
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language for the app';
COMMENT ON COLUMN public.users.weak_subjects IS 'Array of subjects the user finds challenging';
COMMENT ON COLUMN public.users.strong_subjects IS 'Array of subjects the user is confident in';
