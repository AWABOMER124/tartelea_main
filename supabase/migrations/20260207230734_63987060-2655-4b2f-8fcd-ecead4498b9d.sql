-- Fix security issue 1: Profiles table public exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: Only authenticated users can view profiles, or profiles marked as public
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  OR is_public_profile = true
);

-- Also allow users to always see their own profile
CREATE POLICY "Users can always view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix security issue 2: Course ratings user exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view ratings" ON public.course_ratings;

-- Create new policy: Only authenticated users can view ratings
CREATE POLICY "Authenticated users can view ratings"
ON public.course_ratings
FOR SELECT
USING (auth.uid() IS NOT NULL);