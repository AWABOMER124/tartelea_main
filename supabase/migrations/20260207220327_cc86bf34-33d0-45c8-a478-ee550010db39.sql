-- Create messages table for direct messaging
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view own messages"
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY "Users can update received messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete own sent messages
CREATE POLICY "Users can delete own messages"
ON public.direct_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create trainer services table
CREATE TABLE public.trainer_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('private_session', 'consultation', 'mentorship', 'review', 'custom')),
    duration_minutes INTEGER DEFAULT 60,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trainer_services ENABLE ROW LEVEL SECURITY;

-- Everyone can view active services
CREATE POLICY "Everyone can view active services"
ON public.trainer_services FOR SELECT
USING (is_active = true OR auth.uid() = trainer_id);

-- Trainers can create their services
CREATE POLICY "Trainers can create services"
ON public.trainer_services FOR INSERT
WITH CHECK (auth.uid() = trainer_id AND has_role(auth.uid(), 'trainer'));

-- Trainers can update own services
CREATE POLICY "Trainers can update own services"
ON public.trainer_services FOR UPDATE
USING (auth.uid() = trainer_id);

-- Trainers can delete own services
CREATE POLICY "Trainers can delete own services"
ON public.trainer_services FOR DELETE
USING (auth.uid() = trainer_id);

-- Create service bookings table
CREATE TABLE public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.trainer_services(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Students and trainers can view their bookings
CREATE POLICY "Users can view own bookings"
ON public.service_bookings FOR SELECT
USING (auth.uid() = student_id OR auth.uid() = trainer_id);

-- Students can create bookings
CREATE POLICY "Students can create bookings"
ON public.service_bookings FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Both can update booking status
CREATE POLICY "Users can update own bookings"
ON public.service_bookings FOR UPDATE
USING (auth.uid() = student_id OR auth.uid() = trainer_id);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);