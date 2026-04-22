ALTER PUBLICATION supabase_realtime ADD TABLE public.narrations;
ALTER TABLE public.narrations REPLICA IDENTITY FULL;