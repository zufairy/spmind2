-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    school VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    birth_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('general', 'homework', 'study', 'personal')),
    color VARCHAR(20) NOT NULL CHECK (color IN ('yellow', 'pink', 'green', 'blue', 'purple')),
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sticky notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR(20) NOT NULL CHECK (color IN ('yellow', 'pink', 'green', 'blue', 'purple')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('task', 'creative', 'technical', 'educational', 'inspirational')),
    completed BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recording sessions table
CREATE TABLE IF NOT EXISTS recording_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_uri TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in milliseconds
    transcript TEXT,
    summary TEXT,
    subjects TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sticky notes for recording sessions
CREATE TABLE IF NOT EXISTS session_sticky_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES recording_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip')),
    color VARCHAR(20) NOT NULL CHECK (color IN ('yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    completed BOOLEAN DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table for recording sessions
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES recording_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_name VARCHAR(255) NOT NULL,
    participant_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_user_id ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_note_id ON sticky_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_type ON sticky_notes(type);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_tags ON sticky_notes USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_recording_sessions_user_id ON recording_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_created_at ON recording_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_session_sticky_notes_session_id ON session_sticky_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_sticky_notes_user_id ON session_sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_sticky_notes_type ON session_sticky_notes(type);

CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sticky_notes_updated_at BEFORE UPDATE ON sticky_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recording_sessions_updated_at BEFORE UPDATE ON recording_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_sticky_notes_updated_at BEFORE UPDATE ON session_sticky_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow user registration (INSERT) for authenticated users
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Sticky notes policies
CREATE POLICY "Users can view own sticky notes" ON sticky_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sticky notes" ON sticky_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky notes" ON sticky_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky notes" ON sticky_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Recording sessions policies
CREATE POLICY "Users can view own recording sessions" ON recording_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recording sessions" ON recording_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recording sessions" ON recording_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recording sessions" ON recording_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Session sticky notes policies
CREATE POLICY "Users can view own session sticky notes" ON session_sticky_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session sticky notes" ON session_sticky_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session sticky notes" ON session_sticky_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session sticky notes" ON session_sticky_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Session participants policies
CREATE POLICY "Users can view own session participants" ON session_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session participants" ON session_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session participants" ON session_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session participants" ON session_participants
    FOR DELETE USING (auth.uid() = user_id);
