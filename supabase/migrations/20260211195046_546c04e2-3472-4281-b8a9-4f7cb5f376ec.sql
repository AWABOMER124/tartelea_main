
-- Fix views to use security_invoker=on to avoid security definer warnings
-- But also ensure base tables allow authenticated read for the views to work

-- profiles_public: needs profiles to be readable for authenticated users
-- Re-add the policy but scoped to public profiles only
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated can view public profiles') THEN
    CREATE POLICY "Authenticated can view public profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (is_public_profile = true OR id = auth.uid());
  END IF;
END $$;

-- Drop and recreate views with security_invoker
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker=on) AS
  SELECT id, full_name, avatar_url, bio, country, experience_years,
         is_public_profile, is_sudan_awareness_member, specializations, created_at
  FROM public.profiles;

DROP VIEW IF EXISTS public.course_ratings_public;
CREATE VIEW public.course_ratings_public WITH (security_invoker=on) AS
  SELECT course_id, rating, created_at
  FROM public.course_ratings;

DROP VIEW IF EXISTS public.course_subscriptions_public;
CREATE VIEW public.course_subscriptions_public WITH (security_invoker=on) AS
  SELECT course_id, COUNT(*) as subscriber_count
  FROM public.course_subscriptions
  GROUP BY course_id;

-- course_ratings needs broader read for the view to work (aggregate data)
DROP POLICY IF EXISTS "Users can view own ratings" ON public.course_ratings;
CREATE POLICY "Authenticated can view all ratings"
  ON public.course_ratings FOR SELECT
  TO authenticated
  USING (true);

-- course_subscriptions needs broader read for the view
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.course_subscriptions;
CREATE POLICY "Authenticated can view all subscriptions"
  ON public.course_subscriptions FOR SELECT
  TO authenticated
  USING (true);
