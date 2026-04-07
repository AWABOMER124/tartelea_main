
-- Table for room roles (co-host, moderator, speaker, listener)
CREATE TABLE public.room_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'listener',
    assigned_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(room_id, user_id),
    CONSTRAINT valid_room_role CHECK (role IN ('host', 'co_host', 'moderator', 'speaker', 'listener'))
);

ALTER TABLE public.room_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view room roles"
ON public.room_roles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Hosts and co-hosts can manage room roles"
ON public.room_roles FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.rooms r WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.room_roles rr WHERE rr.room_id = room_roles.room_id AND rr.user_id = auth.uid() AND rr.role IN ('host', 'co_host')
    )
);

CREATE POLICY "Hosts and co-hosts can update room roles"
ON public.room_roles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.rooms r WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.room_roles rr WHERE rr.room_id = room_roles.room_id AND rr.user_id = auth.uid() AND rr.role IN ('host', 'co_host')
    )
);

CREATE POLICY "Hosts and co-hosts can delete room roles"
ON public.room_roles FOR DELETE
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.rooms r WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.room_roles rr WHERE rr.room_id = room_roles.room_id AND rr.user_id = auth.uid() AND rr.role IN ('host', 'co_host')
    )
);

-- Table for hand raise queue
CREATE TABLE public.room_hand_raises (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    UNIQUE(room_id, user_id),
    CONSTRAINT valid_hand_status CHECK (status IN ('pending', 'accepted', 'rejected'))
);

ALTER TABLE public.room_hand_raises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hand raises"
ON public.room_hand_raises FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can raise hand"
ON public.room_hand_raises FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw hand raise"
ON public.room_hand_raises FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can manage hand raises"
ON public.room_hand_raises FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.rooms r WHERE r.id = room_hand_raises.room_id AND r.host_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.room_roles rr WHERE rr.room_id = room_hand_raises.room_id AND rr.user_id = auth.uid() AND rr.role IN ('host', 'co_host', 'moderator')
    )
);

-- Table for room reports
CREATE TABLE public.room_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_report_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))
);

ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.room_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.room_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
ON public.room_reports FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Enable realtime for room_roles and hand_raises
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_hand_raises;
