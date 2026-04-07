-- Create storage bucket for workshop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-images', 'workshop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_url column to workshops table
ALTER TABLE public.workshops 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage policies for workshop images
CREATE POLICY "Anyone can view workshop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'workshop-images');

CREATE POLICY "Authenticated users can upload workshop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'workshop-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own workshop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'workshop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own workshop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'workshop-images' AND auth.uid()::text = (storage.foldername(name))[1]);