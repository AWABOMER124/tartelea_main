-- Function to notify workshop participants when a recording is available
CREATE OR REPLACE FUNCTION public.notify_recording_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    workshop_title TEXT;
    host_name TEXT;
BEGIN
    -- Only notify when recording becomes available
    IF NEW.is_available = true AND (OLD.is_available IS NULL OR OLD.is_available = false) THEN
        -- Get workshop title and host name
        SELECT w.title, p.full_name INTO workshop_title, host_name
        FROM public.workshops w
        JOIN public.profiles p ON w.host_id = p.id
        WHERE w.id = NEW.workshop_id;
        
        -- Notify all workshop participants
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            wp.user_id,
            'recording_available',
            'تسجيل ورشة متاح',
            'تسجيل ورشة "' || COALESCE(workshop_title, 'ورشة') || '" أصبح متاحاً للمشاهدة'
        FROM public.workshop_participants wp
        WHERE wp.workshop_id = NEW.workshop_id;
        
        -- Also notify the host
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT 
            w.host_id,
            'recording_available',
            'تم رفع التسجيل',
            'تسجيل ورشتك "' || COALESCE(workshop_title, 'ورشة') || '" أصبح متاحاً للمشاهدة'
        FROM public.workshops w
        WHERE w.id = NEW.workshop_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for recording notifications
DROP TRIGGER IF EXISTS trigger_notify_recording_available ON public.workshop_recordings;
CREATE TRIGGER trigger_notify_recording_available
    AFTER INSERT OR UPDATE ON public.workshop_recordings
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_recording_available();

-- Add cloudflare_uid column to workshop_recordings for tracking
ALTER TABLE public.workshop_recordings 
ADD COLUMN IF NOT EXISTS cloudflare_uid TEXT;

-- Add cloudflare_live_input_uid to workshops for live streaming
ALTER TABLE public.workshops 
ADD COLUMN IF NOT EXISTS cloudflare_live_input_uid TEXT;