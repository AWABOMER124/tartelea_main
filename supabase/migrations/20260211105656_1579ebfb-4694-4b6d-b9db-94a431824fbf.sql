
-- Admin pinned content for home tickers
CREATE TABLE public.pinned_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'course', 'workshop')),
  content_id UUID NOT NULL,
  ticker_position TEXT NOT NULL CHECK (ticker_position IN ('trending', 'latest')),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  pinned_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pinned_content ENABLE ROW LEVEL SECURITY;

-- Everyone can read pinned content
CREATE POLICY "Anyone can view pinned content"
ON public.pinned_content FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert pinned content"
ON public.pinned_content FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pinned content"
ON public.pinned_content FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pinned content"
ON public.pinned_content FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
