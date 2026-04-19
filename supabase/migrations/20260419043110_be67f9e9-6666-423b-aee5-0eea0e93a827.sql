
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-round', 'music-round', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Music round audio is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-round');

CREATE POLICY "Anyone can upload music round audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music-round');

CREATE POLICY "Anyone can update music round audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'music-round');

CREATE POLICY "Anyone can delete music round audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'music-round');
