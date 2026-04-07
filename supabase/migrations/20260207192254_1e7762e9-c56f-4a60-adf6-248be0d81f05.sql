-- Create workshops table
CREATE TABLE public.workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    host_id UUID NOT NULL,
    category public.content_category NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    is_live BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    host_id UUID NOT NULL,
    category public.content_category NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    is_live BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    price DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workshop participants table
CREATE TABLE public.workshop_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(workshop_id, user_id)
);

-- Create room participants table
CREATE TABLE public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Workshops policies
CREATE POLICY "Everyone can view approved workshops" ON public.workshops
    FOR SELECT USING (is_approved = true OR auth.uid() = host_id);

CREATE POLICY "Trainers and moderators can create workshops" ON public.workshops
    FOR INSERT WITH CHECK (
        auth.uid() = host_id AND 
        (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
    );

CREATE POLICY "Hosts can update own workshops" ON public.workshops
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own workshops" ON public.workshops
    FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Admins can manage all workshops" ON public.workshops
    FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Rooms policies
CREATE POLICY "Everyone can view approved rooms" ON public.rooms
    FOR SELECT USING (is_approved = true OR auth.uid() = host_id);

CREATE POLICY "Trainers and moderators can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (
        auth.uid() = host_id AND 
        (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
    );

CREATE POLICY "Hosts can update own rooms" ON public.rooms
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own rooms" ON public.rooms
    FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Admins can manage all rooms" ON public.rooms
    FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Workshop participants policies
CREATE POLICY "Everyone can view workshop participants" ON public.workshop_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join workshops" ON public.workshop_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave workshops" ON public.workshop_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Room participants policies
CREATE POLICY "Everyone can view room participants" ON public.room_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON public.room_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to notify on workshop creation
CREATE OR REPLACE FUNCTION public.notify_workshop_subscribers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    host_name TEXT;
BEGIN
    IF NEW.is_approved = true THEN
        -- Get host name
        SELECT full_name INTO host_name
        FROM public.profiles WHERE id = NEW.host_id;
        
        -- Notify all users about new workshop
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            p.id,
            'new_workshop',
            'ورشة عمل جديدة',
            COALESCE(host_name, 'مدرب') || ' سيقدم ورشة "' || NEW.title || '" في ' || TO_CHAR(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI')
        FROM public.profiles p
        WHERE p.id != NEW.host_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create function to notify on room creation
CREATE OR REPLACE FUNCTION public.notify_room_subscribers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    host_name TEXT;
BEGIN
    IF NEW.is_approved = true THEN
        -- Get host name
        SELECT full_name INTO host_name
        FROM public.profiles WHERE id = NEW.host_id;
        
        -- Notify all users about new room
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            p.id,
            'new_room',
            'غرفة جديدة',
            COALESCE(host_name, 'مدرب') || ' سيفتح غرفة "' || NEW.title || '" في ' || TO_CHAR(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI')
        FROM public.profiles p
        WHERE p.id != NEW.host_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER notify_on_workshop_approval
    AFTER INSERT OR UPDATE OF is_approved ON public.workshops
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_workshop_subscribers();

CREATE TRIGGER notify_on_room_approval
    AFTER INSERT OR UPDATE OF is_approved ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_room_subscribers();

-- Update timestamp trigger
CREATE TRIGGER update_workshops_updated_at
    BEFORE UPDATE ON public.workshops
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at();