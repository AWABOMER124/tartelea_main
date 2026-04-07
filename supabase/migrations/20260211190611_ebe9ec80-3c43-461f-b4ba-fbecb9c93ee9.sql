
-- 1. Fix comments: require authentication
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by authenticated users"
ON public.comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Fix course_comments: require authentication
DROP POLICY IF EXISTS "Everyone can view course comments" ON public.course_comments;
CREATE POLICY "Course comments viewable by authenticated users"
ON public.course_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Fix reactions: require authentication
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Reactions viewable by authenticated users"
ON public.reactions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Fix certificates: require authentication
DROP POLICY IF EXISTS "Everyone can view certificates" ON public.certificates;
CREATE POLICY "Certificates viewable by authenticated users"
ON public.certificates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Fix service_reviews: require authentication
DROP POLICY IF EXISTS "Anyone can view service reviews" ON public.service_reviews;
CREATE POLICY "Service reviews viewable by authenticated users"
ON public.service_reviews FOR SELECT
USING (auth.uid() IS NOT NULL);
