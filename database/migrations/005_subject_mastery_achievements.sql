-- Subject Mastery Achievements System
-- Tracks achievements earned by completing brain boost sessions

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Achievement details
  achievement_type VARCHAR(50) NOT NULL, -- 'subject_mastery', 'streak', 'perfect_score', etc.
  achievement_name VARCHAR(100) NOT NULL, -- e.g., 'Math Master', 'BM Master'
  subject VARCHAR(100), -- For subject-specific achievements
  
  -- Progress tracking
  current_count INTEGER DEFAULT 0, -- Current progress (e.g., 7 out of 10 sessions)
  required_count INTEGER NOT NULL, -- Required to unlock (e.g., 10)
  earned BOOLEAN DEFAULT false,
  
  -- Metadata
  earned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one achievement per user per subject
  UNIQUE(user_id, achievement_type, subject)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON public.user_achievements(user_id, earned);
CREATE INDEX IF NOT EXISTS idx_user_achievements_subject ON public.user_achievements(user_id, subject);

-- Function to initialize subject mastery achievements for a user
CREATE OR REPLACE FUNCTION public.initialize_subject_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_subjects TEXT[] := ARRAY['Mathematics', 'Bahasa Melayu', 'English', 'Sejarah', 'Science'];
  v_subject TEXT;
BEGIN
  FOREACH v_subject IN ARRAY v_subjects
  LOOP
    INSERT INTO public.user_achievements (
      user_id,
      achievement_type,
      achievement_name,
      subject,
      current_count,
      required_count,
      earned
    )
    VALUES (
      p_user_id,
      'subject_mastery',
      v_subject || ' Master',
      v_subject,
      0,
      10,
      false
    )
    ON CONFLICT (user_id, achievement_type, subject) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION public.update_achievement_progress(
  p_user_id UUID,
  p_subject VARCHAR
)
RETURNS TABLE (
  achievement_unlocked BOOLEAN,
  achievement_name VARCHAR,
  subject VARCHAR
) AS $$
DECLARE
  v_session_count INTEGER;
  v_achievement_record RECORD;
BEGIN
  -- Initialize achievements if they don't exist
  PERFORM public.initialize_subject_achievements(p_user_id);
  
  -- Count completed sessions for this subject
  SELECT COUNT(*)::INTEGER INTO v_session_count
  FROM public.brain_boost_history
  WHERE user_id = p_user_id
    AND subject = p_subject
    AND completed = true;
  
  -- Update achievement progress
  UPDATE public.user_achievements
  SET 
    current_count = v_session_count,
    earned = (v_session_count >= required_count),
    earned_at = CASE 
      WHEN v_session_count >= required_count AND earned = false THEN NOW()
      ELSE earned_at
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND achievement_type = 'subject_mastery'
    AND subject = p_subject
  RETURNING earned, achievement_name, subject INTO v_achievement_record;
  
  -- Return achievement status
  RETURN QUERY
  SELECT 
    v_achievement_record.earned as achievement_unlocked,
    v_achievement_record.achievement_name,
    v_achievement_record.subject;
END;
$$ LANGUAGE plpgsql;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION public.get_user_achievements(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  achievement_type VARCHAR,
  achievement_name VARCHAR,
  subject VARCHAR,
  current_count INTEGER,
  required_count INTEGER,
  earned BOOLEAN,
  earned_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER
) AS $$
BEGIN
  -- Initialize achievements if they don't exist
  PERFORM public.initialize_subject_achievements(p_user_id);
  
  RETURN QUERY
  SELECT 
    ua.id,
    ua.achievement_type,
    ua.achievement_name,
    ua.subject,
    ua.current_count,
    ua.required_count,
    ua.earned,
    ua.earned_at,
    (ua.current_count * 100 / NULLIF(ua.required_count, 0))::INTEGER as progress_percentage
  FROM public.user_achievements ua
  WHERE ua.user_id = p_user_id
  ORDER BY 
    ua.earned DESC,
    ua.subject;
END;
$$ LANGUAGE plpgsql;

-- Update the complete_brain_boost_session function to check achievements
CREATE OR REPLACE FUNCTION public.complete_brain_boost_session(
  p_session_id UUID,
  p_duration_seconds INTEGER,
  p_total_questions INTEGER,
  p_correct_answers INTEGER,
  p_score_percentage INTEGER
)
RETURNS TABLE (
  session_id UUID,
  points_earned INTEGER,
  achievement_unlocked BOOLEAN,
  achievement_name VARCHAR
) AS $$
DECLARE
  v_points INTEGER;
  v_user_id UUID;
  v_subject VARCHAR;
  v_achievement RECORD;
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
  RETURNING user_id, subject INTO v_user_id, v_subject;
  
  -- Add points to user
  UPDATE public.users
  SET points = points + v_points
  WHERE id = v_user_id;
  
  -- Check and update achievements if subject is provided
  IF v_subject IS NOT NULL THEN
    SELECT * INTO v_achievement
    FROM public.update_achievement_progress(v_user_id, v_subject);
  END IF;
  
  RETURN QUERY SELECT 
    p_session_id, 
    v_points,
    COALESCE(v_achievement.achievement_unlocked, false),
    COALESCE(v_achievement.achievement_name, '');
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_achievements IS 'Tracks user achievements including subject mastery';
COMMENT ON FUNCTION public.initialize_subject_achievements IS 'Initializes subject mastery achievements for a user';
COMMENT ON FUNCTION public.update_achievement_progress IS 'Updates achievement progress after completing a session';
COMMENT ON FUNCTION public.get_user_achievements IS 'Gets all achievements for a user with progress';

