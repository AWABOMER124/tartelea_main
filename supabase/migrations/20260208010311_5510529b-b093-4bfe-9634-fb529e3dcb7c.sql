-- Create table to track daily chat usage
CREATE TABLE public.chat_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage"
ON public.chat_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage"
ON public.chat_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage"
ON public.chat_usage
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_chat_usage_user_date ON public.chat_usage(user_id, usage_date);

-- Function to increment chat usage and return remaining count
CREATE OR REPLACE FUNCTION public.increment_chat_usage(p_user_id UUID, p_daily_limit INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_count INTEGER;
    v_is_subscriber BOOLEAN;
    v_result JSON;
BEGIN
    -- Check if user has active subscription
    SELECT EXISTS (
        SELECT 1 FROM public.monthly_subscriptions
        WHERE user_id = p_user_id
        AND status = 'active'
        AND expires_at > now()
    ) INTO v_is_subscriber;
    
    -- If subscriber, allow unlimited
    IF v_is_subscriber THEN
        RETURN json_build_object(
            'allowed', true,
            'is_subscriber', true,
            'remaining', -1,
            'message_count', 0
        );
    END IF;
    
    -- Get or create usage record for today
    INSERT INTO public.chat_usage (user_id, usage_date, message_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        message_count = chat_usage.message_count + 1,
        updated_at = now()
    RETURNING message_count INTO v_current_count;
    
    -- Check if within limit
    IF v_current_count > p_daily_limit THEN
        -- Rollback the increment
        UPDATE public.chat_usage
        SET message_count = message_count - 1
        WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
        
        RETURN json_build_object(
            'allowed', false,
            'is_subscriber', false,
            'remaining', 0,
            'message_count', p_daily_limit
        );
    END IF;
    
    RETURN json_build_object(
        'allowed', true,
        'is_subscriber', false,
        'remaining', p_daily_limit - v_current_count,
        'message_count', v_current_count
    );
END;
$$;