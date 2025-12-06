-- Add onboarding fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username character varying UNIQUE,
ADD COLUMN IF NOT EXISTS preferred_language character varying DEFAULT 'english' CHECK (preferred_language IN ('english', 'malay', 'mixed')),
ADD COLUMN IF NOT EXISTS current_school character varying,
ADD COLUMN IF NOT EXISTS study_hours_per_day integer DEFAULT 2 CHECK (study_hours_per_day >= 0 AND study_hours_per_day <= 12),
ADD COLUMN IF NOT EXISTS weak_subjects text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS strong_subjects text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS study_preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}';

-- Create onboarding sessions table to track AI onboarding conversations
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  session_step integer NOT NULL DEFAULT 1,
  step_name character varying NOT NULL,
  ai_message text NOT NULL,
  user_response text,
  step_data jsonb DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onboarding_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT onboarding_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);


