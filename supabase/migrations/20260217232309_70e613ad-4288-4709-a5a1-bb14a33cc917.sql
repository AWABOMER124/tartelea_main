
-- Create room_recordings table
CREATE TABLE public.room_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  recording_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_recordings ENABLE ROW LEVEL SECURITY;

-- Anyone can view available recordings
CREATE POLICY "Anyone can view available room recordings"
  ON public.room_recordings FOR SELECT
  USING (is_available = true);

-- Hosts can manage recordings of their rooms
CREATE POLICY "Hosts can manage room recordings"
  ON public.room_recordings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.rooms r WHERE r.id = room_recordings.room_id AND r.host_id = auth.uid()
  ));

-- Admins can manage all recordings
CREATE POLICY "Admins can manage all room recordings"
  ON public.room_recordings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for room_recordings
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_recordings;

-- Create storage bucket for room recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-recordings', 'room-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for room recordings
CREATE POLICY "Room recordings are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-recordings');

CREATE POLICY "Authenticated users can upload room recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'room-recordings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Hosts can delete room recordings"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'room-recordings' AND auth.uid() IS NOT NULL);
