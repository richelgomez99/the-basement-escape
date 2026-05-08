ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS leader_name text,
  ADD COLUMN IF NOT EXISTS leader_email text;