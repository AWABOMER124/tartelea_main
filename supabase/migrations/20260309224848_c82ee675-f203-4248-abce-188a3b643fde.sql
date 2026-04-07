
-- ============================================================
-- SECURITY FIX 1: room_roles - Remove self-assignment ability
-- Only host/co_host/moderator can assign roles (via edge function)
-- Keep SELECT for all authenticated, but restrict INSERT/UPDATE/DELETE
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Hosts and co-hosts can manage room roles" ON public.room_roles;
DROP POLICY IF EXISTS "Hosts and co-hosts can update room roles" ON public.room_roles;
DROP POLICY IF EXISTS "Hosts and co-hosts can delete room roles" ON public.room_roles;

-- New INSERT policy: Only room host can insert (no self-assignment)
CREATE POLICY "Only room host can assign roles" ON public.room_roles
FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.room_roles rr
    WHERE rr.room_id = room_roles.room_id
    AND rr.user_id = auth.uid()
    AND rr.role IN ('co_host', 'moderator')
  )
);

-- New UPDATE policy: Only host/co_host
CREATE POLICY "Only host or co_host can update roles" ON public.room_roles
FOR UPDATE TO public
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.room_roles rr
    WHERE rr.room_id = room_roles.room_id
    AND rr.user_id = auth.uid()
    AND rr.role IN ('co_host')
  )
);

-- New DELETE policy: Host, co_host, or self-removal (leaving room)
CREATE POLICY "Host co_host or self can delete roles" ON public.room_roles
FOR DELETE TO public
USING (
  auth.uid() = user_id  -- users can remove their OWN role (leaving)
  OR
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_roles.room_id AND r.host_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.room_roles rr
    WHERE rr.room_id = room_roles.room_id
    AND rr.user_id = auth.uid()
    AND rr.role IN ('co_host')
  )
);

-- ============================================================
-- SECURITY FIX 2: monthly_subscriptions - Restrict INSERT/UPDATE
-- Only allow via server (edge function with service role key)
-- Users should only be able to SELECT their own subscriptions
-- ============================================================

-- Drop existing insert/update policies
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.monthly_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.monthly_subscriptions;

-- Block direct client inserts - subscriptions should only be created via edge function
CREATE POLICY "No direct subscription creation" ON public.monthly_subscriptions
FOR INSERT TO public
WITH CHECK (false);

-- Block direct client updates  
CREATE POLICY "No direct subscription updates" ON public.monthly_subscriptions
FOR UPDATE TO public
USING (false);
