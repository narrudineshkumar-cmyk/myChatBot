-- ==============================================================================
-- NEXUS AI CHATBOT — SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard
-- 2. Open your Project -> SQL Editor
-- 3. Click "New Query", paste this SQL and click "Run"
-- ==============================================================================

-- 1. Table: chat_sessions (Stores conversation metadata)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model_key TEXT DEFAULT 'reasoning',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 2. Table: chat_messages (Stores messages for each conversation)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  thinking TEXT,
  think_duration TEXT,
  timestamp BIGINT NOT NULL,
  attachment JSONB
);

-- 3. Index for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Allow anonymous client access via Anon Key (read, write, update, delete)
DROP POLICY IF EXISTS "Anon Full Access Sessions" ON public.chat_sessions;
CREATE POLICY "Anon Full Access Sessions"
  ON public.chat_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Full Access Messages" ON public.chat_messages;
CREATE POLICY "Anon Full Access Messages"
  ON public.chat_messages
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Done! Your Supabase database is ready to sync with NEXUS AI.
