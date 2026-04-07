-- Create trigger function for new message notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    sender_name TEXT;
BEGIN
    -- Get sender name
    SELECT full_name INTO sender_name
    FROM public.profiles WHERE id = NEW.sender_id;
    
    -- Create notification for the receiver
    INSERT INTO public.notifications (user_id, type, title, message, actor_id)
    VALUES (
        NEW.receiver_id,
        'new_message',
        'رسالة جديدة',
        COALESCE(sender_name, 'مستخدم') || ' أرسل لك رسالة',
        NEW.sender_id
    );
    
    RETURN NEW;
END;
$function$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.direct_messages;
CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- Create trigger function for booking notifications
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    student_name TEXT;
    service_title TEXT;
    trainer_name TEXT;
BEGIN
    -- Get student name
    SELECT full_name INTO student_name
    FROM public.profiles WHERE id = NEW.student_id;
    
    -- Get service title
    SELECT title INTO service_title
    FROM public.trainer_services WHERE id = NEW.service_id;
    
    -- Get trainer name
    SELECT full_name INTO trainer_name
    FROM public.profiles WHERE id = NEW.trainer_id;
    
    IF TG_OP = 'INSERT' THEN
        -- Notify trainer of new booking
        INSERT INTO public.notifications (user_id, type, title, message, actor_id)
        VALUES (
            NEW.trainer_id,
            'new_booking',
            'حجز جديد',
            COALESCE(student_name, 'طالب') || ' حجز خدمة: ' || COALESCE(service_title, 'خدمة'),
            NEW.student_id
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Notify student of status change
        INSERT INTO public.notifications (user_id, type, title, message, actor_id)
        VALUES (
            NEW.student_id,
            'booking_update',
            CASE 
                WHEN NEW.status = 'confirmed' THEN 'تم تأكيد الحجز'
                WHEN NEW.status = 'cancelled' THEN 'تم إلغاء الحجز'
                WHEN NEW.status = 'completed' THEN 'تم إكمال الجلسة'
                ELSE 'تحديث الحجز'
            END,
            CASE 
                WHEN NEW.status = 'confirmed' THEN COALESCE(trainer_name, 'المدرب') || ' أكد حجزك لخدمة: ' || COALESCE(service_title, 'خدمة')
                WHEN NEW.status = 'cancelled' THEN 'تم إلغاء حجزك لخدمة: ' || COALESCE(service_title, 'خدمة')
                WHEN NEW.status = 'completed' THEN 'تم إكمال جلستك مع ' || COALESCE(trainer_name, 'المدرب')
                ELSE 'تم تحديث حالة حجزك'
            END,
            NEW.trainer_id
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create triggers for bookings
DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.service_bookings;
CREATE TRIGGER trigger_notify_new_booking
AFTER INSERT ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking();

DROP TRIGGER IF EXISTS trigger_notify_booking_update ON public.service_bookings;
CREATE TRIGGER trigger_notify_booking_update
AFTER UPDATE ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking();