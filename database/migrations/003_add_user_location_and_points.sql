-- Add location fields to users table for leaderboard filtering
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Malaysia',
ADD COLUMN IF NOT EXISTS region VARCHAR(100); -- e.g., 'Selangor', 'Kuala Lumpur', etc.

-- Add index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_points ON public.users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);
CREATE INDEX IF NOT EXISTS idx_users_state ON public.users(state);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users(country);

-- Create points_history table to track all point gains
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('daily_brain_boost', 'word_bomb', 'quiz', 'homework_help', 'study_session', 'achievement', 'bonus', 'other')),
  source_id UUID, -- Reference to the specific game/session that earned points
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for points history queries
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON public.points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_source ON public.points_history(source);

-- Create table to track daily brain boost completions
CREATE TABLE IF NOT EXISTS public.daily_brain_boost_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quiz', 'flashcard', 'memory', 'speed')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for daily brain boost queries
CREATE INDEX IF NOT EXISTS idx_daily_brain_boost_user_id ON public.daily_brain_boost_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_brain_boost_created_at ON public.daily_brain_boost_sessions(created_at DESC);

-- Create table to track game scores and points
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('word_bomb', 'silat_master', 'spell_bird', 'other')),
  game_id TEXT, -- Reference to specific game instance (e.g., word_bomb_games.id)
  score INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  rank INTEGER, -- Player's rank in that specific game
  total_players INTEGER, -- Total players in that game
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for game scores queries
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON public.game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON public.game_scores(created_at DESC);

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.add_points_to_user CASCADE;

-- Function to add points to user
CREATE FUNCTION public.add_points_to_user(
  p_user_id UUID,
  p_points INTEGER,
  p_source VARCHAR(50),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  new_total_points INTEGER,
  points_added INTEGER
) AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  -- Add points to user
  UPDATE public.users 
  SET 
    points = points + p_points,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points INTO v_new_total;
  
  -- Record in points history
  INSERT INTO public.points_history (user_id, points_earned, source, source_id, description)
  VALUES (p_user_id, p_points, p_source, p_source_id, p_description);
  
  -- Return results
  RETURN QUERY SELECT v_new_total, p_points;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_leaderboard CASCADE;

-- Function to get leaderboard by region/state/country
CREATE FUNCTION public.get_leaderboard(
  p_filter_type VARCHAR(20) DEFAULT 'region', -- 'region', 'state', 'country', 'global'
  p_filter_value VARCHAR(100) DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  username VARCHAR,
  points INTEGER,
  avatar_url TEXT,
  region VARCHAR,
  state VARCHAR,
  country VARCHAR,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.username,
    u.points,
    u.avatar_url,
    u.region,
    u.state,
    u.country,
    ROW_NUMBER() OVER (ORDER BY u.points DESC, u.created_at ASC) as rank
  FROM public.users u
  WHERE 
    CASE 
      WHEN p_filter_type = 'region' AND p_filter_value IS NOT NULL THEN u.region = p_filter_value
      WHEN p_filter_type = 'state' AND p_filter_value IS NOT NULL THEN u.state = p_filter_value
      WHEN p_filter_type = 'country' AND p_filter_value IS NOT NULL THEN u.country = p_filter_value
      ELSE TRUE -- global, no filter
    END
  ORDER BY u.points DESC, u.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.complete_daily_brain_boost CASCADE;

-- Function to record daily brain boost completion and award points
CREATE FUNCTION public.complete_daily_brain_boost(
  p_user_id UUID,
  p_mode VARCHAR(50),
  p_score INTEGER,
  p_questions_answered INTEGER,
  p_correct_answers INTEGER,
  p_time_spent_seconds INTEGER
)
RETURNS TABLE (
  session_id UUID,
  points_earned INTEGER,
  new_total_points INTEGER
) AS $$
DECLARE
  v_session_id UUID;
  v_points_earned INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Calculate points based on score (0-100 points)
  v_points_earned := p_score;
  
  -- Bonus points for perfect score
  IF p_score = 100 THEN
    v_points_earned := v_points_earned + 50; -- 150 total for perfect
  END IF;
  
  -- Create session record
  INSERT INTO public.daily_brain_boost_sessions (
    user_id, mode, score, questions_answered, correct_answers, time_spent_seconds, points_earned, completed
  )
  VALUES (
    p_user_id, p_mode, p_score, p_questions_answered, p_correct_answers, p_time_spent_seconds, v_points_earned, true
  )
  RETURNING id INTO v_session_id;
  
  -- Add points to user
  SELECT new_total_points INTO v_new_total
  FROM public.add_points_to_user(
    p_user_id,
    v_points_earned,
    'daily_brain_boost',
    v_session_id,
    format('Daily Brain Boost - %s mode: %s points', p_mode, p_score)
  );
  
  -- Return results
  RETURN QUERY SELECT v_session_id, v_points_earned, v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.complete_game CASCADE;

-- Function to record game completion and award points
CREATE FUNCTION public.complete_game(
  p_user_id UUID,
  p_game_type VARCHAR(50),
  p_game_id TEXT,
  p_score INTEGER,
  p_rank INTEGER DEFAULT NULL,
  p_total_players INTEGER DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL
)
RETURNS TABLE (
  score_id UUID,
  points_earned INTEGER,
  new_total_points INTEGER
) AS $$
DECLARE
  v_score_id UUID;
  v_points_earned INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Calculate points based on game performance
  v_points_earned := p_score;
  
  -- Bonus points based on rank
  IF p_rank IS NOT NULL AND p_total_players IS NOT NULL THEN
    IF p_rank = 1 THEN
      v_points_earned := v_points_earned + 100; -- Winner bonus
    ELSIF p_rank = 2 THEN
      v_points_earned := v_points_earned + 50; -- Runner-up bonus
    ELSIF p_rank = 3 THEN
      v_points_earned := v_points_earned + 25; -- Third place bonus
    END IF;
  END IF;
  
  -- Create game score record
  INSERT INTO public.game_scores (
    user_id, game_type, game_id, score, points_earned, rank, total_players, duration_seconds, completed
  )
  VALUES (
    p_user_id, p_game_type, p_game_id, p_score, v_points_earned, p_rank, p_total_players, p_duration_seconds, true
  )
  RETURNING id INTO v_score_id;
  
  -- Add points to user
  SELECT new_total_points INTO v_new_total
  FROM public.add_points_to_user(
    p_user_id,
    v_points_earned,
    p_game_type,
    v_score_id,
    format('Game: %s - Score: %s', p_game_type, p_score)
  );
  
  -- Return results
  RETURN QUERY SELECT v_score_id, v_points_earned, v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_region CASCADE;

-- Function to get user's current region for default filtering
CREATE FUNCTION public.get_user_region(p_user_id UUID)
RETURNS TABLE (
  region VARCHAR,
  state VARCHAR,
  country VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.region, u.state, u.country
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample location data for testing (optional - comment out if not needed)
-- UPDATE public.users SET 
--   region = 'Kuala Lumpur',
--   state = 'Kuala Lumpur', 
--   country = 'Malaysia'
-- WHERE region IS NULL;

COMMENT ON TABLE public.points_history IS 'Tracks all point gains and losses for users';
COMMENT ON TABLE public.daily_brain_boost_sessions IS 'Records daily brain boost game sessions';
COMMENT ON TABLE public.game_scores IS 'Records game scores and points earned from mini-games';
COMMENT ON FUNCTION public.add_points_to_user IS 'Adds points to a user and records in history';
COMMENT ON FUNCTION public.get_leaderboard IS 'Gets leaderboard filtered by region/state/country or global';
COMMENT ON FUNCTION public.complete_daily_brain_boost IS 'Completes a daily brain boost session and awards points';
COMMENT ON FUNCTION public.complete_game IS 'Completes a game and awards points based on performance';

