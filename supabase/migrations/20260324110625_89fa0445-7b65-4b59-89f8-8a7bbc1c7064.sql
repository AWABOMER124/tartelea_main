
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  author_id UUID NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (is_published = true);

-- Admins and trainers can create posts
CREATE POLICY "Admins and trainers can create blog posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer')
  )
);

-- Authors can update own posts
CREATE POLICY "Authors can update own blog posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- Admins can delete
CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR auth.uid() = author_id);
