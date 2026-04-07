-- Create course ratings table
CREATE TABLE public.course_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Everyone can view ratings
CREATE POLICY "Everyone can view ratings"
ON public.course_ratings FOR SELECT
USING (true);

-- Users can rate courses
CREATE POLICY "Users can rate courses"
ON public.course_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
ON public.course_ratings FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
ON public.course_ratings FOR DELETE
USING (auth.uid() = user_id);

-- Create course comments table
CREATE TABLE public.course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    body TEXT NOT NULL,
    parent_id UUID REFERENCES public.course_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Everyone can view course comments"
ON public.course_comments FOR SELECT
USING (true);

-- Users can create comments
CREATE POLICY "Users can create course comments"
ON public.course_comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own course comments"
ON public.course_comments FOR UPDATE
USING (auth.uid() = author_id);

-- Users can delete their own comments or admins
CREATE POLICY "Users can delete own course comments"
ON public.course_comments FOR DELETE
USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Add views count to trainer_courses
ALTER TABLE public.trainer_courses ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Function to get average rating
CREATE OR REPLACE FUNCTION public.get_course_avg_rating(course_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
    FROM public.course_ratings
    WHERE course_id = course_uuid
$$;

-- Function to get rating count
CREATE OR REPLACE FUNCTION public.get_course_rating_count(course_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.course_ratings
    WHERE course_id = course_uuid
$$;