-- Streak tracking table for Daily Brain Boost
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date DATE,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_session ON user_streaks(last_session_date);

-- Enable RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own streak
CREATE POLICY "Users can view own streak"
    ON user_streaks FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own streak
CREATE POLICY "Users can insert own streak"
    ON user_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own streak
CREATE POLICY "Users can update own streak"
    ON user_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_streak RECORD;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_new_streak INTEGER;
    v_result JSON;
BEGIN
    -- Get current streak record
    SELECT * INTO v_streak
    FROM user_streaks
    WHERE user_id = p_user_id;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_session_date, total_sessions)
        VALUES (p_user_id, 1, 1, v_today, 1)
        RETURNING current_streak, longest_streak, total_sessions INTO v_streak;
        
        RETURN json_build_object(
            'current_streak', 1,
            'longest_streak', 1,
            'total_sessions', 1,
            'streak_activated', true
        );
    END IF;
    
    -- Check if already completed today
    IF v_streak.last_session_date = v_today THEN
        RETURN json_build_object(
            'current_streak', v_streak.current_streak,
            'longest_streak', v_streak.longest_streak,
            'total_sessions', v_streak.total_sessions,
            'streak_activated', false,
            'message', 'Already completed today'
        );
    END IF;
    
    -- Check if streak continues (yesterday) or breaks (older)
    IF v_streak.last_session_date = v_yesterday THEN
        -- Streak continues!
        v_new_streak := v_streak.current_streak + 1;
    ELSE
        -- Streak broken, start over
        v_new_streak := 1;
    END IF;
    
    -- Update streak record
    UPDATE user_streaks
    SET 
        current_streak = v_new_streak,
        longest_streak = GREATEST(longest_streak, v_new_streak),
        last_session_date = v_today,
        total_sessions = total_sessions + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING current_streak, longest_streak, total_sessions INTO v_streak;
    
    RETURN json_build_object(
        'current_streak', v_streak.current_streak,
        'longest_streak', v_streak.longest_streak,
        'total_sessions', v_streak.total_sessions,
        'streak_activated', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

