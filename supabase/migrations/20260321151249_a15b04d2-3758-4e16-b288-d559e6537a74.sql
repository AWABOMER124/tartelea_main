
-- Add image_url column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url text;

-- Create room-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can view room images
CREATE POLICY "Anyone can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Storage policy: authenticated users can upload room images
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'room-images' AND auth.uid() IS NOT NULL);

-- Storage policy: users can delete their own room images
CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
USING (bucket_id = 'room-images' AND auth.uid() IS NOT NULL);
