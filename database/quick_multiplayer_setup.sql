-- Quick Multiplayer Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Create multiplayer_rooms table
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'park',
  background TEXT NOT NULL DEFAULT '#87CEEB',
  background_image TEXT,
  icon TEXT,
  tiles JSONB NOT NULL DEFAULT '[]',
  players JSONB NOT NULL DEFAULT '[]',
  decorations JSONB NOT NULL DEFAULT '[]',
  max_players INTEGER NOT NULL DEFAULT 10,
  current_players INTEGER NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'emote')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_theme ON multiplayer_rooms(theme);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_current_players ON multiplayer_rooms(current_players);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_created_at ON multiplayer_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multiplayer_rooms
CREATE POLICY "Anyone can view public rooms" ON multiplayer_rooms
  FOR SELECT USING (NOT is_private);

CREATE POLICY "Anyone can create rooms" ON multiplayer_rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Room creators can update their rooms" ON multiplayer_rooms
  FOR UPDATE USING (true);

CREATE POLICY "Room creators can delete their rooms" ON multiplayer_rooms
  FOR DELETE USING (true);

-- RLS Policies for chat_messages
CREATE POLICY "Anyone can view messages in public rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM multiplayer_rooms 
      WHERE id = room_id AND NOT is_private
    )
  );

CREATE POLICY "Anyone can send messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_multiplayer_rooms_updated_at 
  BEFORE UPDATE ON multiplayer_rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default rooms
INSERT INTO multiplayer_rooms (id, name, theme, background, max_players, is_private) VALUES
('english_room_park', 'English Park Room', 'park', '#87CEEB', 20, false),
('malay_room_park', 'Malay Park Room', 'park', '#87CEEB', 20, false),
('english_room_cafe', 'English Cafe Room', 'cafe', '#D2B48C', 15, false),
('malay_room_cafe', 'Malay Cafe Room', 'cafe', '#D2B48C', 15, false),
('english_room_arcade', 'English Arcade Room', 'arcade', '#9370DB', 10, false),
('malay_room_arcade', 'Malay Arcade Room', 'arcade', '#9370DB', 10, false)
ON CONFLICT (id) DO NOTHING;
