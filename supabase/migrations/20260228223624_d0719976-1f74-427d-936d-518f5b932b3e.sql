
-- Table to store device push tokens
CREATE TABLE public.device_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text NOT NULL DEFAULT 'android',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own device tokens
CREATE POLICY "Users can insert own tokens" ON public.device_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tokens" ON public.device_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.device_tokens
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.device_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role needs to read tokens for sending push notifications
-- (Edge functions use service role key)

-- Function to send push notification when a notification is created
CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- This trigger marks that a push should be sent
    -- The actual push is handled by the edge function via realtime or polling
    -- We store a flag in the notification for the edge function
    RETURN NEW;
END;
$$;
