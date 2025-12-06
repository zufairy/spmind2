-- Word Bomb Game Tables
-- These tables store the state of Word Bomb multiplayer games

-- Create word_bomb_games table
CREATE TABLE IF NOT EXISTS word_bomb_games (
  id TEXT PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_state TEXT NOT NULL CHECK (game_state IN ('lobby', 'countdown', 'playing', 'finished')) DEFAULT 'lobby',
  current_letters TEXT,
  current_player_id TEXT,
  time_left INTEGER DEFAULT 15,
  max_players INTEGER DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 4),
  round_number INTEGER DEFAULT 0,
  used_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  winner_id TEXT,
  countdown INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_word_bomb_games_room_code ON word_bomb_games(room_code);
CREATE INDEX IF NOT EXISTS idx_word_bomb_games_game_state ON word_bomb_games(game_state);
CREATE INDEX IF NOT EXISTS idx_word_bomb_games_host_id ON word_bomb_games(host_id);
CREATE INDEX IF NOT EXISTS idx_word_bomb_games_created_at ON word_bomb_games(created_at DESC);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_word_bomb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_word_bomb_updated_at ON word_bomb_games;
CREATE TRIGGER trigger_update_word_bomb_updated_at
  BEFORE UPDATE ON word_bomb_games
  FOR EACH ROW
  EXECUTE FUNCTION update_word_bomb_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE word_bomb_games ENABLE ROW LEVEL SECURITY;

-- Create policies for word_bomb_games
-- Allow anyone to create a game
CREATE POLICY "Anyone can create a game"
  ON word_bomb_games
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read games
CREATE POLICY "Anyone can view games"
  ON word_bomb_games
  FOR SELECT
  USING (true);

-- Allow players in the game to update it
CREATE POLICY "Players can update their game"
  ON word_bomb_games
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow host to delete the game
CREATE POLICY "Host can delete game"
  ON word_bomb_games
  FOR DELETE
  USING (auth.uid()::text = host_id);

-- Create a function to clean up old games (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_word_bomb_games()
RETURNS void AS $$
BEGIN
  -- Delete games older than 24 hours that are finished, in lobby, or stuck in countdown
  DELETE FROM word_bomb_games
  WHERE (game_state = 'finished' OR game_state = 'lobby' OR game_state = 'countdown')
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE word_bomb_games IS 'Stores Word Bomb multiplayer game sessions';
COMMENT ON COLUMN word_bomb_games.id IS 'Unique game identifier';
COMMENT ON COLUMN word_bomb_games.room_code IS 'Short code players use to join the game';
COMMENT ON COLUMN word_bomb_games.host_id IS 'User ID of the player who created the game';
COMMENT ON COLUMN word_bomb_games.players IS 'JSON array of player objects with their stats';
COMMENT ON COLUMN word_bomb_games.game_state IS 'Current state: lobby, countdown, playing, or finished';
COMMENT ON COLUMN word_bomb_games.current_letters IS 'The letter combination players must use';
COMMENT ON COLUMN word_bomb_games.current_player_id IS 'ID of player whose turn it is';
COMMENT ON COLUMN word_bomb_games.time_left IS 'Seconds remaining in current round';
COMMENT ON COLUMN word_bomb_games.max_players IS 'Maximum number of players (2-4)';
COMMENT ON COLUMN word_bomb_games.round_number IS 'Current round number';
COMMENT ON COLUMN word_bomb_games.used_words IS 'JSON array of words already used in this game';
COMMENT ON COLUMN word_bomb_games.winner_id IS 'ID of the winning player (when game is finished)';
COMMENT ON COLUMN word_bomb_games.countdown IS 'Countdown timer before game starts (0 when not counting down)';
