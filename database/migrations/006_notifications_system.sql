-- Notifications System
-- Tracks user notifications for level ups, achievements, and other events

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN ('level_up', 'achievement', 'streak', 'milestone', 'system')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  icon VARCHAR(50), -- Icon identifier (e.g., 'trophy', 'star', 'fire')
  icon_color VARCHAR(20), -- Hex color for icon
  
  -- Related data
  related_id UUID, -- ID of related achievement, level, etc.
  related_type VARCHAR(50), -- Type of related entity
  
  -- Status
  read BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Index for quick queries
  CONSTRAINT notifications_user_created_idx_key UNIQUE (user_id, created_at, id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(user_id, type);

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_icon VARCHAR DEFAULT NULL,
  p_icon_color VARCHAR DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    icon,
    icon_color,
    related_id,
    related_type
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_icon,
    p_icon_color,
    p_related_id,
    p_related_type
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET 
    read = true,
    read_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET 
    read = true,
    read_at = NOW()
  WHERE user_id = p_user_id
    AND read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  icon VARCHAR,
  icon_color VARCHAR,
  related_id UUID,
  related_type VARCHAR,
  read BOOLEAN,
  clicked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  time_ago TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.icon,
    n.icon_color,
    n.related_id,
    n.related_type,
    n.read,
    n.clicked,
    n.created_at,
    CASE
      WHEN AGE(NOW(), n.created_at) < INTERVAL '1 minute' THEN 'Just now'
      WHEN AGE(NOW(), n.created_at) < INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM AGE(NOW(), n.created_at))::TEXT || ' minutes ago'
      WHEN AGE(NOW(), n.created_at) < INTERVAL '24 hours' THEN EXTRACT(HOUR FROM AGE(NOW(), n.created_at))::TEXT || ' hours ago'
      WHEN AGE(NOW(), n.created_at) < INTERVAL '7 days' THEN EXTRACT(DAY FROM AGE(NOW(), n.created_at))::TEXT || ' days ago'
      ELSE TO_CHAR(n.created_at, 'Mon DD, YYYY')
    END as time_ago
  FROM public.notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = p_user_id
    AND read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check level from points
CREATE OR REPLACE FUNCTION public.get_level_from_points(p_points INTEGER)
RETURNS TABLE (
  level INTEGER,
  level_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE
      WHEN p_points < 100 THEN 1
      WHEN p_points < 250 THEN 2
      WHEN p_points < 500 THEN 3
      WHEN p_points < 1000 THEN 4
      WHEN p_points < 2000 THEN 5
      WHEN p_points < 3500 THEN 6
      WHEN p_points < 5000 THEN 7
      WHEN p_points < 7500 THEN 8
      WHEN p_points < 10000 THEN 9
      ELSE 10
    END as level,
    CASE
      WHEN p_points < 100 THEN 'Beginner'
      WHEN p_points < 250 THEN 'Learner'
      WHEN p_points < 500 THEN 'Explorer'
      WHEN p_points < 1000 THEN 'Ambitious'
      WHEN p_points < 2000 THEN 'Achiever'
      WHEN p_points < 3500 THEN 'Scholar'
      WHEN p_points < 5000 THEN 'Expert'
      WHEN p_points < 7500 THEN 'Master'
      WHEN p_points < 10000 THEN 'Virtuoso'
      ELSE 'Legend'
    END as level_name;
END;
$$ LANGUAGE plpgsql;

-- Drop the old function first (since we're changing the return type)
DROP FUNCTION IF EXISTS public.complete_brain_boost_session(UUID, INTEGER, INTEGER, INTEGER, INTEGER);

-- Update the complete_brain_boost_session function to create notifications
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
  achievement_name VARCHAR,
  level_up BOOLEAN,
  new_level INTEGER,
  new_level_name VARCHAR
) AS $$
DECLARE
  v_points INTEGER;
  v_user_id UUID;
  v_subject VARCHAR;
  v_achievement RECORD;
  v_old_points INTEGER;
  v_new_points INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_old_level_name VARCHAR;
  v_new_level_name VARCHAR;
  v_level_up BOOLEAN := false;
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
  
  -- Get current points before update
  SELECT points INTO v_old_points
  FROM public.users
  WHERE id = v_user_id;
  
  -- Get old level
  SELECT * INTO v_old_level, v_old_level_name
  FROM public.get_level_from_points(v_old_points);
  
  -- Add points to user
  UPDATE public.users
  SET points = points + v_points
  WHERE id = v_user_id
  RETURNING points INTO v_new_points;
  
  -- Get new level
  SELECT * INTO v_new_level, v_new_level_name
  FROM public.get_level_from_points(v_new_points);
  
  -- Check if level up occurred
  IF v_new_level > v_old_level THEN
    v_level_up := true;
    
    -- Create level up notification
    PERFORM public.create_notification(
      v_user_id,
      'level_up',
      'Level Up! 🎉',
      'Congratulations! You reached Level ' || v_new_level || ' - ' || v_new_level_name || '!',
      'trophy',
      '#FFD700',
      NULL,
      'level'
    );
  END IF;
  
  -- Check and update achievements if subject is provided
  IF v_subject IS NOT NULL THEN
    SELECT * INTO v_achievement
    FROM public.update_achievement_progress(v_user_id, v_subject);
    
    -- Create achievement notification if newly unlocked
    IF v_achievement.achievement_unlocked = true THEN
      PERFORM public.create_notification(
        v_user_id,
        'achievement',
        'Achievement Unlocked! 🏆',
        'You earned "' || v_achievement.achievement_name || '"! Keep up the great work!',
        'award',
        '#00FF00',
        NULL,
        'achievement'
      );
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    p_session_id, 
    v_points,
    COALESCE(v_achievement.achievement_unlocked, false),
    COALESCE(v_achievement.achievement_name, ''),
    v_level_up,
    v_new_level,
    v_new_level_name;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Delete old notifications (keep last 100 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.notifications
    ) subquery
    WHERE rn > 100
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.notifications IS 'Stores user notifications for events like level ups and achievements';
COMMENT ON FUNCTION public.create_notification IS 'Creates a new notification for a user';
COMMENT ON FUNCTION public.mark_notification_read IS 'Marks a notification as read';
COMMENT ON FUNCTION public.get_user_notifications IS 'Gets notifications for a user with time ago text';
COMMENT ON FUNCTION public.get_unread_notification_count IS 'Gets count of unread notifications for a user';

