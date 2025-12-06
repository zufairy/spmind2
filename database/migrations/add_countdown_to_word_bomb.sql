-- Migration: Add countdown column and update game_state constraint
-- Date: 2025-01-07
-- Description: Adds countdown support for synchronized game start across all players

-- Add countdown column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'word_bomb_games' AND column_name = 'countdown'
  ) THEN
    ALTER TABLE word_bomb_games ADD COLUMN countdown INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update the game_state constraint to include 'countdown'
ALTER TABLE word_bomb_games DROP CONSTRAINT IF EXISTS word_bomb_games_game_state_check;
ALTER TABLE word_bomb_games ADD CONSTRAINT word_bomb_games_game_state_check 
  CHECK (game_state IN ('lobby', 'countdown', 'playing', 'finished'));

-- Update comments
COMMENT ON COLUMN word_bomb_games.game_state IS 'Current state: lobby, countdown, playing, or finished';
COMMENT ON COLUMN word_bomb_games.countdown IS 'Countdown timer before game starts (0 when not counting down)';

