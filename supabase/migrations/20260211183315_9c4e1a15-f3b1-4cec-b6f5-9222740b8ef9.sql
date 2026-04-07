
-- Create course group chat messages table
CREATE TABLE public.course_chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only course subscribers can read messages
CREATE POLICY "Course subscribers can read chat messages"
ON public.course_chat_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.course_subscriptions cs
        WHERE cs.course_id = course_chat_messages.course_id
        AND cs.user_id = auth.uid()
    )
);

-- Only course subscribers can send messages
CREATE POLICY "Course subscribers can send chat messages"
ON public.course_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.course_subscriptions cs
        WHERE cs.course_id = course_chat_messages.course_id
        AND cs.user_id = auth.uid()
    )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own chat messages"
ON public.course_chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trainers can also read/manage chat in their courses
CREATE POLICY "Trainers can read their course chat"
ON public.course_chat_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trainer_courses tc
        WHERE tc.id = course_chat_messages.course_id
        AND tc.trainer_id = auth.uid()
    )
);

CREATE POLICY "Trainers can delete messages in their courses"
ON public.course_chat_messages
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trainer_courses tc
        WHERE tc.id = course_chat_messages.course_id
        AND tc.trainer_id = auth.uid()
    )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_chat_messages;
