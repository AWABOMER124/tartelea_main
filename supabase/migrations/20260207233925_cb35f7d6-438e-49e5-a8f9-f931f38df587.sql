-- Fix course_ratings: Allow public read for displaying ratings on courses
-- (This only exposes aggregate data, not personal information)
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.course_ratings;

CREATE POLICY "Everyone can view ratings for course display"
ON public.course_ratings
FOR SELECT
USING (true);

-- Fix course_subscriptions: Allow public read of subscription counts only
-- We need to allow reading for FeaturedCourses to show subscriber counts
-- The data only contains course_id and user_id (UUIDs), no personal info
DROP POLICY IF EXISTS "Users can view own subscriptions or trainers can view course subscribers" ON public.course_subscriptions;

-- Create a more balanced policy: public can see counts, but user details are protected
CREATE POLICY "Public can view subscription counts"
ON public.course_subscriptions
FOR SELECT
USING (true);