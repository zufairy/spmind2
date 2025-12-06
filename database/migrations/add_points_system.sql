-- Add points system to users table
-- Points can be earned through various activities in the app

-- Add points column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Add index for points (useful for leaderboards later)
CREATE INDEX IF NOT EXISTS idx_users_points ON public.users(points DESC);

-- Add constraint to ensure points are never negative
ALTER TABLE public.users
ADD CONSTRAINT points_non_negative CHECK (points >= 0);

-- Comment on the column
COMMENT ON COLUMN public.users.points IS 'Points earned by the user through various activities';

-- Optional: Create a function to add points (ensures atomic operations)
CREATE OR REPLACE FUNCTION public.add_points_to_user(user_id_param uuid, points_to_add integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_points integer;
BEGIN
  -- Update and return new points total
  UPDATE public.users
  SET points = points + points_to_add
  WHERE id = user_id_param
  RETURNING points INTO new_points;
  
  RETURN new_points;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_points_to_user(uuid, integer) TO authenticated;

COMMENT ON FUNCTION public.add_points_to_user IS 'Safely add points to a user account (can be positive or negative for deductions)';

