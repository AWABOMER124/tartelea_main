
-- Remove duplicate triggers
DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
DROP TRIGGER IF EXISTS on_new_reaction ON public.reactions;

-- Check and remove duplicates on other tables too
DROP TRIGGER IF EXISTS on_new_course_comment ON public.course_comments;
DROP TRIGGER IF EXISTS on_new_subscription ON public.course_subscriptions;
DROP TRIGGER IF EXISTS on_new_chat_message ON public.course_chat_messages;
DROP TRIGGER IF EXISTS on_new_direct_message ON public.direct_messages;
DROP TRIGGER IF EXISTS on_new_booking ON public.service_bookings;
DROP TRIGGER IF EXISTS on_new_workshop ON public.workshops;
DROP TRIGGER IF EXISTS on_new_room ON public.rooms;
DROP TRIGGER IF EXISTS on_new_recording ON public.workshop_recordings;
DROP TRIGGER IF EXISTS on_course_progress ON public.course_progress;

-- Clean duplicate notifications
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.type = b.type
  AND a.created_at = b.created_at
  AND a.message = b.message;
