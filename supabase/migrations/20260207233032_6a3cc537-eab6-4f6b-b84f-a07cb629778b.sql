-- Fix course_subscriptions exposure: Only allow users to see their own subscriptions
-- or trainers to see subscriptions for their courses

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view subscriptions" ON public.course_subscriptions;

-- Create more restrictive policy
CREATE POLICY "Users can view own subscriptions or trainers can view course subscribers"
ON public.course_subscriptions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.trainer_courses tc 
    WHERE tc.id = course_subscriptions.course_id 
    AND tc.trainer_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator')
);
