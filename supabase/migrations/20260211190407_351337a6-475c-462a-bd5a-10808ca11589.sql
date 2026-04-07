
-- Drop the existing public SELECT policy on workshops
DROP POLICY IF EXISTS "Everyone can view approved workshops" ON public.workshops;

-- Create a new policy restricting SELECT to authenticated users only
CREATE POLICY "Authenticated users can view approved workshops"
ON public.workshops
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND ((is_approved = true) OR (auth.uid() = host_id)));
