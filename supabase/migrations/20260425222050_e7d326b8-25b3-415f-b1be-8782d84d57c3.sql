-- Grant table privileges to anon/authenticated so RLS policies can apply.
-- Policies exist (INSERT/UPDATE allowed) but underlying GRANTs were missing,
-- causing all client inserts to fail with RLS violations.
GRANT INSERT, UPDATE ON TABLE public.game_sessions TO anon, authenticated;

-- Also ensure narrations and puzzle_overrides are reachable for the anon role
-- used by the public client. (Safe no-op if already granted.)
GRANT SELECT, INSERT, UPDATE ON TABLE public.narrations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.puzzle_overrides TO anon, authenticated;