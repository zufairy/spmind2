-- Add selected_sprite column to users table for saving sprite preference

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS selected_sprite integer DEFAULT 1 
  CHECK (selected_sprite >= 1 AND selected_sprite <= 9);

COMMENT ON COLUMN public.users.selected_sprite IS 'User preferred sprite/character (1-9)';

