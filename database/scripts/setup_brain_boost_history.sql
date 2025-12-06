    `-- Setup Brain Boost History with Sample Data
-- Run this in Supabase SQL Editor

-- Create the table (from migration 004)
CREATE TABLE IF NOT EXISTS public.brain_boost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME NOT NULL DEFAULT CURRENT_TIME,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER GENERATED ALWAYS AS (duration_seconds / 60) STORED,
  
  -- Mode and content
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quiz', 'flashcard', 'memory', 'speed', 'practice')),
  subject VARCHAR(100),
  topics TEXT[],
  
  -- Quiz performance
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score_percentage INTEGER DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  
  -- Additional metrics
  streak_day INTEGER DEFAULT 1,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  points_earned INTEGER DEFAULT 0,
  
  -- Status
  completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_user_id ON public.brain_boost_history(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_session_date ON public.brain_boost_history(session_date DESC);

-- Insert sample data for current user (replace with your user ID)
-- Get your user ID first
SELECT id, full_name FROM public.users LIMIT 1;

-- Then insert sample sessions for that user (update the user_id below)
INSERT INTO public.brain_boost_history (
  user_id,
  session_date,
  session_time,
  duration_seconds,
  mode,
  subject,
  topics,
  total_questions,
  correct_answers,
  wrong_answers,
  score_percentage,
  difficulty_level,
  points_earned,
  streak_day,
  completed
) VALUES
  -- Session 1: Perfect score today
  (
    (SELECT id FROM public.users LIMIT 1),
    CURRENT_DATE,
    '14:30:00',
    450,
    'quiz',
    'Mathematics',
    ARRAY['Algebra', 'Quadratic Equations'],
    10,
    10,
    0,
    100,
    'medium',
    150,
    5,
    true
  ),
  -- Session 2: Good score yesterday
  (
    (SELECT id FROM public.users LIMIT 1),
    CURRENT_DATE - INTERVAL '1 day',
    '16:45:00',
    360,
    'quiz',
    'Science',
    ARRAY['Photosynthesis', 'Plant Biology'],
    12,
    10,
    2,
    83,
    'medium',
    93,
    4,
    true
  ),
  -- Session 3: Flashcard session 2 days ago
  (
    (SELECT id FROM public.users LIMIT 1),
    CURRENT_DATE - INTERVAL '2 days',
    '15:20:00',
    300,
    'flashcard',
    'English',
    ARRAY['Grammar', 'Vocabulary'],
    15,
    13,
    2,
    87,
    'easy',
    97,
    3,
    true
  ),
  -- Session 4: Memory game 3 days ago
  (
    (SELECT id FROM public.users LIMIT 1),
    CURRENT_DATE - INTERVAL '3 days',
    '17:10:00',
    420,
    'memory',
    'Bahasa Melayu',
    ARRAY['Tatabahasa', 'Karangan'],
    8,
    7,
    1,
    88,
    'medium',
    98,
    2,
    true
  ),
  -- Session 5: Quiz 4 days ago
  (
    (SELECT id FROM public.users LIMIT 1),
    CURRENT_DATE - INTERVAL '4 days',
    '14:00:00',
    540,
    'quiz',
    'Mathematics',
    ARRAY['Geometry', 'Trigonometry'],
    10,
    9,
    1,
    90,
    'hard',
    115,
    1,
    true
  );

-- Verify the data
SELECT 
  session_date,
  mode,
  subject,
  score_percentage,
  duration_minutes,
  points_earned,
  streak_day
FROM public.brain_boost_history
ORDER BY session_date DESC;

-- Check statistics
SELECT 
  COUNT(*) as total_sessions,
  SUM(duration_minutes) as total_minutes,
  ROUND(AVG(score_percentage), 1) as avg_score,
  SUM(points_earned) as total_points,
  MAX(streak_day) as current_streak
FROM public.brain_boost_history
WHERE user_id = (SELECT id FROM public.users LIMIT 1);

-- 🎉 Done! Now check the Brain Boost History page in your app!

