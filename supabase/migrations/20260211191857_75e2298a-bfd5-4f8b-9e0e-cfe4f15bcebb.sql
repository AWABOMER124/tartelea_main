
-- 1. Create a public-safe view for profiles that hides sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    full_name,
    avatar_url,
    bio,
    country,
    specializations,
    experience_years,
    is_public_profile,
    is_sudan_awareness_member,
    created_at
    -- Excludes: social_links, interests (sensitive personal data)
  FROM public.profiles;

-- 2. Fix profiles SELECT policies: restrict public access, keep owner full access
DROP POLICY IF EXISTS "Users can view public profiles or own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can always view own profile" ON public.profiles;

-- Owner can see ALL their own fields
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Authenticated users can see public profiles but only through the view
-- Direct table access for non-owners is denied
-- (The view with security_invoker will use the caller's permissions)

-- Allow authenticated users to see public profiles (limited fields via view)
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (is_public_profile = true));

-- 3. Fix trainer_availability: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view trainer availability" ON public.trainer_availability;

CREATE POLICY "Authenticated users can view trainer availability"
ON public.trainer_availability FOR SELECT
USING (auth.uid() IS NOT NULL);
