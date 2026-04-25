-- Drop and recreate policies explicitly bound to anon + authenticated roles.

-- game_sessions
DROP POLICY IF EXISTS "Anyone can create a session" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can update a session" ON public.game_sessions;

CREATE POLICY "Anyone can create a session"
  ON public.game_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update a session"
  ON public.game_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- narrations
DROP POLICY IF EXISTS "Anyone can read narrations" ON public.narrations;
DROP POLICY IF EXISTS "Anyone can insert narrations" ON public.narrations;
DROP POLICY IF EXISTS "Anyone can update narrations" ON public.narrations;

CREATE POLICY "Anyone can read narrations"
  ON public.narrations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert narrations"
  ON public.narrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update narrations"
  ON public.narrations
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- puzzle_overrides
DROP POLICY IF EXISTS "Anyone can read puzzle overrides" ON public.puzzle_overrides;
DROP POLICY IF EXISTS "Anyone can insert puzzle overrides" ON public.puzzle_overrides;
DROP POLICY IF EXISTS "Anyone can update puzzle overrides" ON public.puzzle_overrides;

CREATE POLICY "Anyone can read puzzle overrides"
  ON public.puzzle_overrides
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert puzzle overrides"
  ON public.puzzle_overrides
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update puzzle overrides"
  ON public.puzzle_overrides
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);