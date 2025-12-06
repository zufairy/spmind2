-- Database schema extension for AI learning progress tracking
-- Extends existing schema with user progress and AI session logging

-- Table to track user learning progress aligned with KSSR/KSSM syllabus
CREATE TABLE public.user_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  subject character varying NOT NULL,
  topic character varying NOT NULL,
  level character varying NOT NULL CHECK (level::text = ANY (ARRAY['KSSR'::character varying, 'KSSM'::character varying]::text[])),
  grade character varying NOT NULL CHECK (grade::text = ANY (ARRAY['1'::character varying, '2'::character varying, '3'::character varying, '4'::character varying, '5'::character varying, '6'::character varying, 'Form 1'::character varying, 'Form 2'::character varying, 'Form 3'::character varying, 'Form 4'::character varying, 'Form 5'::character varying]::text[])),
  last_score integer CHECK (last_score >= 0 AND last_score <= 100),
  total_attempts integer DEFAULT 0,
  mastery_level character varying NOT NULL DEFAULT 'beginner' CHECK (mastery_level::text = ANY (ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'master'::character varying]::text[])),
  last_session_id uuid,
  last_studied_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_progress_last_session_id_fkey FOREIGN KEY (last_session_id) REFERENCES public.recording_sessions(id) ON DELETE SET NULL,
  CONSTRAINT user_progress_user_subject_topic_unique UNIQUE (user_id, subject, topic)
);

-- Table to log AI interactions and responses
CREATE TABLE public.ai_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  session_id uuid,
  subject character varying NOT NULL,
  topic character varying,
  question text NOT NULL,
  ai_answer text NOT NULL,
  question_type character varying NOT NULL CHECK (question_type::text = ANY (ARRAY['homework'::character varying, 'study'::character varying, 'quiz'::character varying, 'explanation'::character varying, 'practice'::character varying, 'general'::character varying]::text[])),
  difficulty_level character varying NOT NULL CHECK (difficulty_level::text = ANY (ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying]::text[])),
  syllabus_alignment character varying NOT NULL CHECK (syllabus_alignment::text = ANY (ARRAY['KSSR'::character varying, 'KSSM'::character varying, 'both'::character varying]::text[])),
  grade_level character varying,
  language_used character varying NOT NULL CHECK (language_used::text = ANY (ARRAY['english'::character varying, 'malay'::character varying, 'mixed'::character varying]::text[])),
  response_time_ms integer,
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  is_helpful boolean,
  tags text[] DEFAULT '{}'::text[],   -- ✅ fixed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT ai_sessions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.recording_sessions(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_subject_topic ON public.user_progress(subject, topic);
CREATE INDEX idx_user_progress_last_studied_at ON public.user_progress(last_studied_at);

CREATE INDEX idx_ai_sessions_user_id ON public.ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_subject ON public.ai_sessions(subject);
CREATE INDEX idx_ai_sessions_created_at ON public.ai_sessions(created_at);
CREATE INDEX idx_ai_sessions_question_type ON public.ai_sessions(question_type);

-- Add comments for documentation
COMMENT ON TABLE public.user_progress IS 'Tracks individual user learning progress aligned with KSSR/KSSM syllabus';
COMMENT ON TABLE public.ai_sessions IS 'Logs all AI interactions and responses for learning analytics';

COMMENT ON COLUMN public.user_progress.mastery_level IS 'Current mastery level: beginner, intermediate, advanced, master';
COMMENT ON COLUMN public.user_progress.last_score IS 'Last recorded score (0-100) for this subject/topic';
COMMENT ON COLUMN public.user_progress.total_attempts IS 'Total number of attempts for this subject/topic';

COMMENT ON COLUMN public.ai_sessions.question_type IS 'Type of question asked: homework, study, quiz, explanation, practice, general';
COMMENT ON COLUMN public.ai_sessions.difficulty_level IS 'Perceived difficulty: easy, medium, hard';
COMMENT ON COLUMN public.ai_sessions.syllabus_alignment IS 'Which syllabus this interaction aligns with: KSSR, KSSM, or both';
COMMENT ON COLUMN public.ai_sessions.language_used IS 'Language used in the interaction: english, malay, or mixed';
COMMENT ON COLUMN public.ai_sessions.response_time_ms IS 'AI response time in milliseconds';
COMMENT ON COLUMN public.ai_sessions.user_rating IS 'User rating of AI response (1-5 stars)';
COMMENT ON COLUMN public.ai_sessions.is_helpful IS 'Whether the user found the response helpful';
