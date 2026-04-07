
-- ============================
-- 1. Fix mass notification triggers - add LIMIT 500
-- ============================

-- Replace workshop notification function with LIMIT
CREATE OR REPLACE FUNCTION public.notify_workshop_subscribers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    host_name TEXT;
BEGIN
    IF NEW.is_approved = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_approved IS DISTINCT FROM NEW.is_approved)) THEN
        SELECT full_name INTO host_name
        FROM public.profiles WHERE id = NEW.host_id;
        
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            p.id,
            'new_workshop',
            'ورشة عمل جديدة',
            COALESCE(host_name, 'مدرب') || ' سيقدم ورشة "' || NEW.title || '" في ' || TO_CHAR(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI')
        FROM public.profiles p
        WHERE p.id != NEW.host_id
        LIMIT 500;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Replace room notification function with LIMIT
CREATE OR REPLACE FUNCTION public.notify_room_subscribers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    host_name TEXT;
BEGIN
    IF NEW.is_approved = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_approved IS DISTINCT FROM NEW.is_approved)) THEN
        SELECT full_name INTO host_name
        FROM public.profiles WHERE id = NEW.host_id;
        
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            p.id,
            'new_room',
            'غرفة جديدة',
            COALESCE(host_name, 'مدرب') || ' سيفتح غرفة "' || NEW.title || '" في ' || TO_CHAR(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI')
        FROM public.profiles p
        WHERE p.id != NEW.host_id
        LIMIT 500;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================
-- 2. Secure chat-attachments bucket
-- ============================

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;

-- Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
);
