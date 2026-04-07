
-- =============================================
-- 1. FIX profiles table: Remove overly permissive policies
-- =============================================

-- Drop the overly permissive policy that allows ALL authenticated users to see ALL profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
-- Drop redundant public policy  
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;
-- Drop the authenticated-role specific one that's also too broad
DROP POLICY IF EXISTS "Authenticated can view public profiles" ON public.profiles;
-- Drop own profile view (will recreate consolidated)
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;

-- Create clean, consolidated SELECT policies for profiles
-- Users can always see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Authenticated users can see public profiles only
CREATE POLICY "View public profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_public_profile = true);

-- Admins/trainers can view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- =============================================
-- 2. FIX profiles_public view: Only show public profiles
-- =============================================
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, bio, country, experience_years,
       is_public_profile, is_sudan_awareness_member, specializations, created_at
FROM public.profiles
WHERE is_public_profile = true;

-- =============================================
-- 3. FIX course_ratings: Remove duplicate/overly permissive policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view all ratings" ON public.course_ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.course_ratings;

-- Users can see their own ratings
CREATE POLICY "Users can view own ratings"
ON public.course_ratings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trainers can see ratings for their courses
CREATE POLICY "Trainers can view course ratings"
ON public.course_ratings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_courses tc
    WHERE tc.id = course_ratings.course_id
    AND tc.trainer_id = auth.uid()
  )
);

-- Admins can see all ratings
CREATE POLICY "Admins can view all ratings"
ON public.course_ratings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow viewing aggregate ratings (via the public view) - users subscribed to a course can see its ratings
CREATE POLICY "Subscribers can view course ratings"
ON public.course_ratings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_subscriptions cs
    WHERE cs.course_id = course_ratings.course_id
    AND cs.user_id = auth.uid()
  )
);

-- =============================================
-- 4. FIX course_subscriptions: Remove duplicate/overly permissive policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view all subscriptions" ON public.course_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.course_subscriptions;

-- Users can see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.course_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trainers can see subscriptions for their courses
CREATE POLICY "Trainers can view course subscriptions"
ON public.course_subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_courses tc
    WHERE tc.id = course_subscriptions.course_id
    AND tc.trainer_id = auth.uid()
  )
);

-- Admins can see all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.course_subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. FIX course_ratings_public view: restrict to authenticated
-- =============================================
CREATE OR REPLACE VIEW public.course_ratings_public
WITH (security_invoker = on) AS
SELECT course_id, rating, created_at
FROM public.course_ratings;

-- =============================================
-- 6. FIX course_subscriptions_public view: restrict to authenticated
-- =============================================
CREATE OR REPLACE VIEW public.course_subscriptions_public
WITH (security_invoker = on) AS
SELECT course_id, count(*) AS subscriber_count
FROM public.course_subscriptions
GROUP BY course_id;
