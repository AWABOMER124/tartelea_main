-- ========================================
-- 1. FIX: course_subscriptions - Create public view and restrict base table
-- ========================================
CREATE VIEW public.course_subscriptions_public
WITH (security_invoker=on) AS
  SELECT course_id, COUNT(*) as subscriber_count
  FROM public.course_subscriptions
  GROUP BY course_id;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view subscription counts" ON public.course_subscriptions;

-- Create new policy: users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.course_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant SELECT on the public view
GRANT SELECT ON public.course_subscriptions_public TO anon, authenticated;

-- ========================================
-- 2. FIX: workshop_participants - Require authentication to view
-- ========================================
DROP POLICY IF EXISTS "Everyone can view workshop participants" ON public.workshop_participants;

CREATE POLICY "Authenticated users can view workshop participants" 
ON public.workshop_participants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- 3. FIX: room_participants - Require authentication to view
-- ========================================
DROP POLICY IF EXISTS "Everyone can view room participants" ON public.room_participants;

CREATE POLICY "Authenticated users can view room participants" 
ON public.room_participants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- 4. FIX: certificates - Restrict INSERT to system only (via trigger)
-- ========================================
DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;

-- Only allow inserts through the trigger (no direct user inserts)
CREATE POLICY "No direct certificate creation" 
ON public.certificates 
FOR INSERT 
WITH CHECK (false);

-- ========================================
-- 5. FIX: notifications - Restrict INSERT to system functions only
-- ========================================
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Use a more restrictive policy - notifications should only come from triggers
CREATE POLICY "System creates notifications via triggers" 
ON public.notifications 
FOR INSERT 
WITH CHECK (false);

-- ========================================
-- 6. FIX: profiles - Fix privacy settings to work correctly
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Only allow viewing profiles that are public OR belong to the user
CREATE POLICY "Users can view public profiles or own profile" 
ON public.profiles 
FOR SELECT 
USING (is_public_profile = true OR auth.uid() = id);

-- ========================================
-- 7. FIX: direct_messages - Restrict UPDATE to only is_read field
-- ========================================
DROP POLICY IF EXISTS "Users can update received messages" ON public.direct_messages;

-- Create a function to validate the update
CREATE OR REPLACE FUNCTION public.validate_message_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updating is_read field
  IF NEW.message != OLD.message OR NEW.sender_id != OLD.sender_id OR NEW.receiver_id != OLD.receiver_id THEN
    RAISE EXCEPTION 'Only is_read field can be updated';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce field restriction
DROP TRIGGER IF EXISTS validate_message_update_trigger ON public.direct_messages;
CREATE TRIGGER validate_message_update_trigger
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_update();

-- Re-create the update policy
CREATE POLICY "Receivers can mark messages as read" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- ========================================
-- 8. FIX: Allow message deletion in workshop_messages and room_messages
-- ========================================
CREATE POLICY "Users can delete own workshop messages" 
ON public.workshop_messages 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own room messages" 
ON public.room_messages 
FOR DELETE 
USING (auth.uid() = user_id);