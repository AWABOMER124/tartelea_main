
-- Fix course_ratings: drop existing and recreate
DROP POLICY IF EXISTS "Users can view own ratings" ON public.course_ratings;
CREATE POLICY "Users can view own ratings"
  ON public.course_ratings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Fix course_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.course_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.course_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Recreate views without security_invoker for public aggregate access
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT id, full_name, avatar_url, bio, country, experience_years,
         is_public_profile, is_sudan_awareness_member, specializations, created_at
  FROM public.profiles;

DROP VIEW IF EXISTS public.course_ratings_public;
CREATE VIEW public.course_ratings_public AS
  SELECT course_id, rating, created_at
  FROM public.course_ratings;

DROP VIEW IF EXISTS public.course_subscriptions_public;
CREATE VIEW public.course_subscriptions_public AS
  SELECT course_id, COUNT(*) as subscriber_count
  FROM public.course_subscriptions
  GROUP BY course_id;
