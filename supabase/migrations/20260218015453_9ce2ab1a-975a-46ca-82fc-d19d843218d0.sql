
-- Community post reports table
CREATE TABLE public.post_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.post_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.post_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" ON public.post_reports FOR ALL
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Prevent duplicate reports
CREATE UNIQUE INDEX idx_post_reports_unique ON public.post_reports(post_id, reporter_id) WHERE status = 'pending';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reports;
