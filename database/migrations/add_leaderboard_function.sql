-- Create a function to get leaderboard data (bypasses RLS)
-- This is safe because we're only exposing public leaderboard information

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_leaderboard(integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  points integer,
  avatar_url text,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.full_name::text,
    u.username::text,
    COALESCE(u.points, 0) as points,
    u.avatar_url::text,
    ROW_NUMBER() OVER (ORDER BY COALESCE(u.points, 0) DESC) as rank
  FROM public.users u
  WHERE u.onboarding_completed = true
  ORDER BY COALESCE(u.points, 0) DESC
  LIMIT limit_count;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon;

COMMENT ON FUNCTION public.get_leaderboard IS 'Get top users by points for leaderboard (bypasses RLS)';

