-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL, -- 'reaction', 'comment', 'course_approved', 'new_subscriber'
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    related_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    related_course_id UUID REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    actor_id UUID, -- who triggered the notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create course subscriptions table
CREATE TABLE public.course_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS on course_subscriptions
ALTER TABLE public.course_subscriptions ENABLE ROW LEVEL SECURITY;

-- Everyone can view subscription counts
CREATE POLICY "Everyone can view subscriptions"
ON public.course_subscriptions FOR SELECT
USING (true);

-- Users can subscribe to courses
CREATE POLICY "Users can subscribe to courses"
ON public.course_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsubscribe from courses
CREATE POLICY "Users can unsubscribe"
ON public.course_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Function to create notification on new reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_author_id UUID;
    post_title TEXT;
    actor_name TEXT;
BEGIN
    -- Get post author and title
    SELECT author_id, title INTO post_author_id, post_title
    FROM public.posts WHERE id = NEW.post_id;
    
    -- Get actor name
    SELECT full_name INTO actor_name
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Don't notify if user reacts to own post
    IF post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_post_id, actor_id)
        VALUES (
            post_author_id,
            'reaction',
            'إعجاب جديد',
            COALESCE(actor_name, 'مستخدم') || ' أعجب بمنشورك: ' || post_title,
            NEW.post_id,
            NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for reactions
CREATE TRIGGER on_new_reaction
AFTER INSERT ON public.reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_reaction();

-- Function to create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    post_author_id UUID;
    post_title TEXT;
    actor_name TEXT;
BEGIN
    -- Get post author and title
    SELECT author_id, title INTO post_author_id, post_title
    FROM public.posts WHERE id = NEW.post_id;
    
    -- Get actor name
    SELECT full_name INTO actor_name
    FROM public.profiles WHERE id = NEW.author_id;
    
    -- Don't notify if user comments on own post
    IF post_author_id != NEW.author_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_post_id, actor_id)
        VALUES (
            post_author_id,
            'comment',
            'تعليق جديد',
            COALESCE(actor_name, 'مستخدم') || ' علق على منشورك: ' || post_title,
            NEW.post_id,
            NEW.author_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_new_comment
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- Function to create notification on course subscription
CREATE OR REPLACE FUNCTION public.notify_on_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    course_trainer_id UUID;
    course_title TEXT;
    subscriber_name TEXT;
BEGIN
    -- Get course trainer and title
    SELECT trainer_id, title INTO course_trainer_id, course_title
    FROM public.trainer_courses WHERE id = NEW.course_id;
    
    -- Get subscriber name
    SELECT full_name INTO subscriber_name
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Notify trainer of new subscriber
    IF course_trainer_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_course_id, actor_id)
        VALUES (
            course_trainer_id,
            'new_subscriber',
            'مشترك جديد',
            COALESCE(subscriber_name, 'مستخدم') || ' اشترك في دورتك: ' || course_title,
            NEW.course_id,
            NEW.user_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for subscriptions
CREATE TRIGGER on_new_subscription
AFTER INSERT ON public.course_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_subscription();