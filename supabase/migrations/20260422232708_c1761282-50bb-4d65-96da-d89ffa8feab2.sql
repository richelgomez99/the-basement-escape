CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  outcome text NOT NULL DEFAULT 'in_progress',
  elapsed_seconds integer,
  penalty_seconds integer NOT NULL DEFAULT 0,
  solved_count integer NOT NULL DEFAULT 0,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_sessions_outcome_check CHECK (outcome IN ('in_progress','victory','failure'))
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a new session (anonymous play).
CREATE POLICY "Anyone can create a session"
  ON public.game_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Anyone can update a session row (the client knows its own session id;
-- without SELECT they cannot enumerate other sessions, and without DELETE
-- they cannot remove anyone's row).
CREATE POLICY "Anyone can update a session"
  ON public.game_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- NO public SELECT policy. Only service-role (admin server functions)
-- can read this table.

CREATE INDEX idx_game_sessions_started_at ON public.game_sessions (started_at DESC);
CREATE INDEX idx_game_sessions_outcome ON public.game_sessions (outcome);

-- Reuse / create the standard updated_at trigger function.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();