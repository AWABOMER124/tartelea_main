-- Create a trainer_courses table to allow trainers to upload their courses
CREATE TABLE IF NOT EXISTS public.trainer_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type public.content_type NOT NULL DEFAULT 'video',
    category public.content_category NOT NULL,
    depth_level public.depth_level NOT NULL DEFAULT 'beginner',
    url TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trainer_courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved courses
CREATE POLICY "Everyone can view approved courses"
ON public.trainer_courses
FOR SELECT
USING (is_approved = true OR auth.uid() = trainer_id);

-- Trainers can create their own courses
CREATE POLICY "Trainers can create courses"
ON public.trainer_courses
FOR INSERT
WITH CHECK (
    auth.uid() = trainer_id AND 
    public.has_role(auth.uid(), 'trainer')
);

-- Trainers can update their own courses
CREATE POLICY "Trainers can update own courses"
ON public.trainer_courses
FOR UPDATE
USING (auth.uid() = trainer_id);

-- Trainers can delete their own courses
CREATE POLICY "Trainers can delete own courses"
ON public.trainer_courses
FOR DELETE
USING (auth.uid() = trainer_id);

-- Admins/Moderators can manage all courses
CREATE POLICY "Admins can manage all trainer courses"
ON public.trainer_courses
FOR ALL
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'moderator')
);