
-- Drop the existing public SELECT policy on posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

-- Create a new policy restricting SELECT to authenticated users only
CREATE POLICY "Posts are viewable by authenticated users"
ON public.posts
FOR SELECT
USING (auth.uid() IS NOT NULL);
