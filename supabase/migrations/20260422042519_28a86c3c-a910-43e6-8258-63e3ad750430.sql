-- Narrations table: stores generated audio URLs keyed by content
CREATE TABLE public.narrations (
  key TEXT PRIMARY KEY,
  text_hash TEXT NOT NULL,
  text TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.narrations ENABLE ROW LEVEL SECURITY;

-- Public game: anyone can read/write (matches puzzle_overrides pattern)
CREATE POLICY "Anyone can read narrations" ON public.narrations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert narrations" ON public.narrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update narrations" ON public.narrations FOR UPDATE USING (true) WITH CHECK (true);

-- Storage bucket for narration MP3s
INSERT INTO storage.buckets (id, name, public) VALUES ('narrations', 'narrations', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read narration audio" ON storage.objects FOR SELECT USING (bucket_id = 'narrations');
CREATE POLICY "Anyone can upload narration audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'narrations');
CREATE POLICY "Anyone can update narration audio" ON storage.objects FOR UPDATE USING (bucket_id = 'narrations');