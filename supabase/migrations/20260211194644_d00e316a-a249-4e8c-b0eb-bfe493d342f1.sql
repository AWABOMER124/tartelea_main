
-- Add parent_id to comments for nested replies
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Secure views: recreate with security_invoker and require authentication
-- Drop and recreate profiles_public view
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker=on) AS
  SELECT id, full_name, avatar_url, bio, country, experience_years,
         is_public_profile, is_sudan_awareness_member, specializations, created_at
  FROM public.profiles;

-- Drop and recreate course_ratings_public view
DROP VIEW IF EXISTS public.course_ratings_public;
CREATE VIEW public.course_ratings_public WITH (security_invoker=on) AS
  SELECT course_id, rating, created_at
  FROM public.course_ratings;

-- Drop and recreate course_subscriptions_public view  
DROP VIEW IF EXISTS public.course_subscriptions_public;
CREATE VIEW public.course_subscriptions_public WITH (security_invoker=on) AS
  SELECT course_id, COUNT(*) as subscriber_count
  FROM public.course_subscriptions
  GROUP BY course_id;

-- Ensure profiles table has proper RLS for authenticated read
-- (profiles likely already has RLS, but ensure select policy exists for authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Ensure course_ratings has RLS enabled and authenticated select
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_ratings' AND policyname = 'Authenticated users can view ratings'
  ) THEN
    CREATE POLICY "Authenticated users can view ratings"
      ON public.course_ratings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Ensure course_subscriptions has RLS enabled and authenticated select
ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_subscriptions' AND policyname = 'Authenticated users can view subscriptions'
  ) THEN
    CREATE POLICY "Authenticated users can view subscriptions"
      ON public.course_subscriptions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
