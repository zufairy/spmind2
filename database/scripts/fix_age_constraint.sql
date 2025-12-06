-- Fix age constraint to allow NULL or 0 (for users during onboarding)
-- This allows age to be 0 temporarily during onboarding until properly calculated

-- Drop the existing constraint
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_age_check;

-- Add new constraint that allows NULL or age >= 0 (including 0)
ALTER TABLE public.users 
  ADD CONSTRAINT users_age_check CHECK (age IS NULL OR (age >= 0 AND age < 150));

-- Also make age column nullable if it isn't already
ALTER TABLE public.users 
  ALTER COLUMN age DROP NOT NULL;

