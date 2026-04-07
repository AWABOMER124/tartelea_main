-- Create live chat messages table for workshops
CREATE TABLE public.workshop_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create live chat messages table for rooms
CREATE TABLE public.room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workshop recordings table
CREATE TABLE public.workshop_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    recording_url TEXT,
    duration_seconds INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_available BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.workshop_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_recordings ENABLE ROW LEVEL SECURITY;

-- Workshop messages policies
CREATE POLICY "Participants can view workshop messages" ON public.workshop_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workshop_participants wp 
            WHERE wp.workshop_id = workshop_messages.workshop_id 
            AND wp.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM public.workshops w 
            WHERE w.id = workshop_messages.workshop_id 
            AND w.host_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send workshop messages" ON public.workshop_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (
                SELECT 1 FROM public.workshop_participants wp 
                WHERE wp.workshop_id = workshop_messages.workshop_id 
                AND wp.user_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM public.workshops w 
                WHERE w.id = workshop_messages.workshop_id 
                AND w.host_id = auth.uid()
            )
        )
    );

-- Room messages policies
CREATE POLICY "Participants can view room messages" ON public.room_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_participants rp 
            WHERE rp.room_id = room_messages.room_id 
            AND rp.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM public.rooms r 
            WHERE r.id = room_messages.room_id 
            AND r.host_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send room messages" ON public.room_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (
                SELECT 1 FROM public.room_participants rp 
                WHERE rp.room_id = room_messages.room_id 
                AND rp.user_id = auth.uid()
            ) OR 
            EXISTS (
                SELECT 1 FROM public.rooms r 
                WHERE r.id = room_messages.room_id 
                AND r.host_id = auth.uid()
            )
        )
    );

-- Workshop recordings policies
CREATE POLICY "Anyone can view available recordings" ON public.workshop_recordings
    FOR SELECT USING (is_available = true);

CREATE POLICY "Hosts can manage recordings" ON public.workshop_recordings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workshops w 
            WHERE w.id = workshop_recordings.workshop_id 
            AND w.host_id = auth.uid()
        )
    );

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;