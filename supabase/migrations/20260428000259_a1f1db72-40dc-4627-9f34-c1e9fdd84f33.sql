
CREATE OR REPLACE FUNCTION public.update_game_session(
  p_id uuid,
  p_outcome text DEFAULT NULL,
  p_finished_at timestamptz DEFAULT NULL,
  p_elapsed_seconds integer DEFAULT NULL,
  p_penalty_seconds integer DEFAULT NULL,
  p_solved_count integer DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_sessions
  SET
    outcome = COALESCE(p_outcome, outcome),
    finished_at = COALESCE(p_finished_at, finished_at),
    elapsed_seconds = COALESCE(p_elapsed_seconds, elapsed_seconds),
    penalty_seconds = COALESCE(p_penalty_seconds, penalty_seconds),
    solved_count = COALESCE(p_solved_count, solved_count)
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_game_session(uuid, text, timestamptz, integer, integer, integer) TO anon, authenticated;
