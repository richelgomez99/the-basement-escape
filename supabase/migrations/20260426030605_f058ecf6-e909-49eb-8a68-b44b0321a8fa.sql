UPDATE public.game_sessions
SET outcome = 'failure',
    finished_at = COALESCE(finished_at, started_at + interval '1 hour')
WHERE outcome = 'in_progress'
  AND started_at < now() - interval '1 hour';