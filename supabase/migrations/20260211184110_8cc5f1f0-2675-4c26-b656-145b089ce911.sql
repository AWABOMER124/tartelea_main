
-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachment columns to course_chat_messages
ALTER TABLE public.course_chat_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Create notification function for chat messages
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    course_title TEXT;
    sender_name TEXT;
    sub RECORD;
BEGIN
    SELECT title INTO course_title FROM public.trainer_courses WHERE id = NEW.course_id;
    SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.user_id;

    -- Notify all subscribers except the sender
    FOR sub IN
        SELECT user_id FROM public.course_subscriptions
        WHERE course_id = NEW.course_id AND user_id != NEW.user_id
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, related_course_id, actor_id)
        VALUES (
            sub.user_id,
            'chat_message',
            'رسالة جديدة في مجموعة الدردشة',
            COALESCE(sender_name, 'مستخدم') || ' أرسل رسالة في: ' || course_title,
            NEW.course_id,
            NEW.user_id
        );
    END LOOP;

    -- Also notify the trainer if not the sender
    DECLARE
        trainer UUID;
    BEGIN
        SELECT trainer_id INTO trainer FROM public.trainer_courses WHERE id = NEW.course_id;
        IF trainer IS NOT NULL AND trainer != NEW.user_id THEN
            -- Check trainer is not already a subscriber
            IF NOT EXISTS (SELECT 1 FROM public.course_subscriptions WHERE course_id = NEW.course_id AND user_id = trainer) THEN
                INSERT INTO public.notifications (user_id, type, title, message, related_course_id, actor_id)
                VALUES (
                    trainer,
                    'chat_message',
                    'رسالة جديدة في دردشة دورتك',
                    COALESCE(sender_name, 'مستخدم') || ' أرسل رسالة في: ' || course_title,
                    NEW.course_id,
                    NEW.user_id
                );
            END IF;
        END IF;
    END;

    RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER on_new_chat_message
AFTER INSERT ON public.course_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_chat_message();
