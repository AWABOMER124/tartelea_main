
-- Recreate profiles_public view with security_invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, full_name, avatar_url, bio, country, experience_years,
         is_public_profile, is_sudan_awareness_member, specializations, created_at
  FROM public.profiles
  WHERE is_public_profile = true;

-- Recreate course_ratings_public view with security_invoker
DROP VIEW IF EXISTS public.course_ratings_public;
CREATE VIEW public.course_ratings_public
WITH (security_invoker=on) AS
  SELECT course_id, rating, created_at
  FROM public.course_ratings;

-- Recreate course_subscriptions_public view with security_invoker
DROP VIEW IF EXISTS public.course_subscriptions_public;
CREATE VIEW public.course_subscriptions_public
WITH (security_invoker=on) AS
  SELECT course_id, count(*) AS subscriber_count
  FROM public.course_subscriptions
  GROUP BY course_id;

-- Add a public SELECT policy for course_ratings so authenticated users can see all ratings (needed for public display)
CREATE POLICY "Authenticated users can view all ratings"
ON public.course_ratings FOR SELECT TO authenticated
USING (true);

-- Add a public SELECT policy for course_subscriptions counts
CREATE POLICY "Authenticated users can view subscription counts"
ON public.course_subscriptions FOR SELECT TO authenticated
USING (true);
