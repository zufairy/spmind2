-- Brain Boost History Database Structure
-- Tracks daily brain boost sessions with detailed information

-- Create or update the daily_brain_boost_sessions table
CREATE TABLE IF NOT EXISTS public.brain_boost_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME NOT NULL DEFAULT CURRENT_TIME,
  duration_seconds INTEGER NOT NULL DEFAULT 0, -- Total time spent in seconds
  duration_minutes INTEGER GENERATED ALWAYS AS (duration_seconds / 60) STORED, -- Auto-calculated
  
  -- Mode and content
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quiz', 'flashcard', 'memory', 'speed', 'practice')),
  subject VARCHAR(100), -- e.g., 'Mathematics', 'Science', 'English'
  topics TEXT[], -- Array of topics covered, e.g., ['Algebra', 'Quadratic Equations']
  
  -- Quiz performance
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score_percentage INTEGER DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  
  -- Additional metrics
  streak_day INTEGER DEFAULT 1, -- Which day of streak this was
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  points_earned INTEGER DEFAULT 0,
  
  -- Status
  completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_user_id ON public.brain_boost_history(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_session_date ON public.brain_boost_history(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_user_date ON public.brain_boost_history(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_brain_boost_history_mode ON public.brain_boost_history(mode);

-- Function to create a new brain boost session
CREATE OR REPLACE FUNCTION public.create_brain_boost_session(
  p_user_id UUID,
  p_mode VARCHAR(50),
  p_subject VARCHAR(100) DEFAULT NULL,
  p_topics TEXT[] DEFAULT NULL,
  p_difficulty VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_streak_day INTEGER;
BEGIN
  -- Calculate current streak day
  SELECT COALESCE(MAX(streak_day), 0) + 1 INTO v_streak_day
  FROM public.brain_boost_history
  WHERE user_id = p_user_id
    AND session_date >= CURRENT_DATE - INTERVAL '1 day';
  
  -- Create new session
  INSERT INTO public.brain_boost_history (
    user_id, mode, subject, topics, difficulty_level, streak_day, completed
  )
  VALUES (
    p_user_id, p_mode, p_subject, p_topics, p_difficulty, v_streak_day, false
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete a brain boost session
CREATE OR REPLACE FUNCTION public.complete_brain_boost_session(
  p_session_id UUID,
  p_duration_seconds INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_score_percentage INTEGER
)
RETURNS TABLE (
  session_id UUID,
  points_earned INTEGER
) AS $$
DECLARE
  v_points INTEGER;
  v_user_id UUID;
BEGIN
  -- Calculate points (base score + bonuses)
  v_points := p_score_percentage; -- Base points
  
  -- Perfect score bonus
  IF p_score_percentage = 100 THEN
    v_points := v_points + 50;
  ELSIF p_score_percentage >= 90 THEN
    v_points := v_points + 25;
  ELSIF p_score_percentage >= 80 THEN
    v_points := v_points + 10;
  END IF;
  
  -- Update session with completion data
  UPDATE public.brain_boost_history
  SET 
    duration_seconds = p_duration_seconds,
    total_questions = p_total_questions,
    correct_answers = p_correct_answers,
    wrong_answers = p_total_questions - p_correct_answers,
    score_percentage = p_score_percentage,
    points_earned = v_points,
    completed = true,
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING user_id INTO v_user_id;
  
  -- Add points to user
  UPDATE public.users
  SET points = points + v_points
  WHERE id = v_user_id;
  
  RETURN QUERY SELECT p_session_id, v_points;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's brain boost history
CREATE OR REPLACE FUNCTION public.get_brain_boost_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  session_date DATE,
  session_time TIME,
  duration_minutes INTEGER,
  mode VARCHAR,
  subject VARCHAR,
  topics TEXT[],
  score_percentage INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER,
  points_earned INTEGER,
  streak_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.id,
    bh.session_date,
    bh.session_time,
    bh.duration_minutes,
    bh.mode,
    bh.subject,
    bh.topics,
    bh.score_percentage,
    bh.total_questions,
    bh.correct_answers,
    bh.points_earned,
    bh.streak_day,
    bh.created_at
  FROM public.brain_boost_history bh
  WHERE bh.user_id = p_user_id
    AND bh.completed = true
  ORDER BY bh.session_date DESC, bh.session_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get brain boost statistics
CREATE OR REPLACE FUNCTION public.get_brain_boost_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_time_minutes BIGINT,
  average_score NUMERIC,
  perfect_scores BIGINT,
  current_streak INTEGER,
  total_points_earned BIGINT,
  favorite_subject VARCHAR,
  total_questions_answered BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_sessions,
    SUM(duration_minutes)::BIGINT as total_time_minutes,
    ROUND(AVG(score_percentage), 1) as average_score,
    COUNT(CASE WHEN score_percentage = 100 THEN 1 END)::BIGINT as perfect_scores,
    MAX(streak_day)::INTEGER as current_streak,
    SUM(points_earned)::BIGINT as total_points_earned,
    (
      SELECT subject 
      FROM public.brain_boost_history 
      WHERE user_id = p_user_id AND subject IS NOT NULL
      GROUP BY subject 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as favorite_subject,
    SUM(total_questions)::BIGINT as total_questions_answered
  FROM public.brain_boost_history
  WHERE user_id = p_user_id
    AND completed = true;
END;
$$ LANGUAGE plpgsql;

-- Add sample data (optional - for testing)
-- INSERT INTO public.brain_boost_history (user_id, mode, subject, topics, total_questions, correct_answers, score_percentage, duration_seconds, points_earned, completed)
-- SELECT 
--   id,
--   (ARRAY['quiz', 'flashcard', 'memory'])[FLOOR(RANDOM() * 3 + 1)],
--   (ARRAY['Mathematics', 'Science', 'English'])[FLOOR(RANDOM() * 3 + 1)],
--   ARRAY['Topic 1', 'Topic 2'],
--   10,
--   FLOOR(RANDOM() * 10 + 1)::INTEGER,
--   FLOOR(RANDOM() * 100 + 1)::INTEGER,
--   FLOOR(RANDOM() * 600 + 180)::INTEGER,
--   FLOOR(RANDOM() * 150 + 50)::INTEGER,
--   true
-- FROM public.users
-- LIMIT 5;

COMMENT ON TABLE public.brain_boost_history IS 'Tracks all daily brain boost sessions with detailed metrics';
COMMENT ON FUNCTION public.create_brain_boost_session IS 'Creates a new brain boost session';
COMMENT ON FUNCTION public.complete_brain_boost_session IS 'Completes a session and awards points';
COMMENT ON FUNCTION public.get_brain_boost_history IS 'Gets user brain boost history';
COMMENT ON FUNCTION public.get_brain_boost_stats IS 'Gets aggregated statistics for user brain boost activity';

