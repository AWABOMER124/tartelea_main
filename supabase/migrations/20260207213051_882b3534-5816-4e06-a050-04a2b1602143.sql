-- Fix function search_path for get_course_avg_rating
CREATE OR REPLACE FUNCTION public.get_course_avg_rating(course_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
    FROM public.course_ratings
    WHERE course_id = course_uuid
$$;

-- Fix function search_path for get_course_rating_count
CREATE OR REPLACE FUNCTION public.get_course_rating_count(course_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.course_ratings
    WHERE course_id = course_uuid
$$;