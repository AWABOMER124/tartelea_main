
-- Attach notification triggers that exist as functions but are not connected

-- 1. Reaction notification trigger
CREATE TRIGGER on_reaction_created
AFTER INSERT ON public.reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_reaction();

-- 2. Comment notification trigger
CREATE TRIGGER on_comment_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- 3. Course comment notification trigger
CREATE TRIGGER on_course_comment_created
AFTER INSERT ON public.course_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_course_comment();

-- 4. Subscription notification trigger
CREATE TRIGGER on_subscription_created
AFTER INSERT ON public.course_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_subscription();

-- 5. Chat message notification trigger
CREATE TRIGGER on_chat_message_created
AFTER INSERT ON public.course_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_chat_message();

-- 6. Direct message notification trigger
CREATE TRIGGER on_direct_message_created
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- 7. Booking notification trigger
CREATE TRIGGER on_booking_change
AFTER INSERT OR UPDATE ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking();

-- 8. Workshop approval notification trigger
CREATE TRIGGER on_workshop_approved
AFTER INSERT OR UPDATE ON public.workshops
FOR EACH ROW
EXECUTE FUNCTION public.notify_workshop_subscribers();

-- 9. Room approval notification trigger
CREATE TRIGGER on_room_approved
AFTER INSERT OR UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.notify_room_subscribers();

-- 10. Recording available notification trigger
CREATE TRIGGER on_recording_available
AFTER INSERT OR UPDATE ON public.workshop_recordings
FOR EACH ROW
EXECUTE FUNCTION public.notify_recording_available();

-- 11. Certificate on completion trigger
CREATE TRIGGER on_progress_completion
BEFORE UPDATE ON public.course_progress
FOR EACH ROW
EXECUTE FUNCTION public.issue_certificate_on_completion();

-- 12. Subscription updated_at trigger
CREATE TRIGGER on_subscription_updated
BEFORE UPDATE ON public.monthly_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_updated_at();

-- 13. Validate message update trigger
CREATE TRIGGER on_message_update
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_update();
