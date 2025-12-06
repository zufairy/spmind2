-- Enable Realtime for Multiplayer Tables
-- Run this in your Supabase SQL Editor to enable real-time updates

-- Enable Realtime for multiplayer_rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;

-- Enable Realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verify Realtime is enabled (optional - check the results)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
