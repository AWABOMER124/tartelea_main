-- Create a public view that only exposes course_id and rating (no user_id)
CREATE VIEW public.course_ratings_public
WITH (security_invoker=on) AS
  SELECT course_id, rating, created_at
  FROM public.course_ratings;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view ratings for course display" ON public.course_ratings;

-- Create new policy: users can only see their own ratings on the base table
CREATE POLICY "Users can view own ratings" 
ON public.course_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.course_ratings_public TO anon, authenticated;