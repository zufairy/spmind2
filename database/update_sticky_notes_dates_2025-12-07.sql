-- Update all session_sticky_notes to have dates incrementing by 1 day starting from today
-- This script updates both created_at and updated_at, with each note getting a date 1 day later than the previous

WITH numbered_notes AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 as day_offset
  FROM public.session_sticky_notes
)
UPDATE public.session_sticky_notes ssn
SET 
  created_at = NOW() + nn.day_offset * INTERVAL '1 day',
  updated_at = NOW() + nn.day_offset * INTERVAL '1 day'
FROM numbered_notes nn
WHERE ssn.id = nn.id;

-- Verify the update - shows dates incrementing
SELECT 
  id,
  title,
  created_at,
  updated_at,
  ROW_NUMBER() OVER (ORDER BY created_at) as day_offset
FROM public.session_sticky_notes
ORDER BY created_at
LIMIT 20;

-- Summary
SELECT 
  COUNT(*) as total_notes,
  MIN(created_at) as earliest_date,
  MAX(created_at) as latest_date,
  COUNT(DISTINCT DATE(created_at)) as unique_dates
FROM public.session_sticky_notes;

