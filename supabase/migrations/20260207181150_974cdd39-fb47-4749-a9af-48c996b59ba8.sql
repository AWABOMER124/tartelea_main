-- Create course progress table
CREATE TABLE public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
ON public.course_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.course_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON public.course_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create certificates table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.trainer_courses(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Everyone can view certificates (for verification)
CREATE POLICY "Everyone can view certificates"
ON public.certificates FOR SELECT
USING (true);

-- System inserts certificates (via trigger when progress = 100)
CREATE POLICY "System can insert certificates"
ON public.certificates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cert_num TEXT;
BEGIN
    cert_num := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
    RETURN cert_num;
END;
$$;

-- Function to issue certificate when progress reaches 100%
CREATE OR REPLACE FUNCTION public.issue_certificate_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if progress is 100% and no certificate exists
    IF NEW.progress_percent = 100 AND NEW.completed_at IS NULL THEN
        -- Set completed_at
        NEW.completed_at := NOW();
        
        -- Insert certificate if not exists
        INSERT INTO public.certificates (user_id, course_id, certificate_number)
        VALUES (NEW.user_id, NEW.course_id, public.generate_certificate_number())
        ON CONFLICT (user_id, course_id) DO NOTHING;
        
        -- Create notification for user
        INSERT INTO public.notifications (user_id, type, title, message, related_course_id)
        SELECT 
            NEW.user_id,
            'certificate_issued',
            'تهانينا! حصلت على شهادة',
            'لقد أكملت دورة "' || tc.title || '" بنجاح وحصلت على شهادة إتمام.',
            NEW.course_id
        FROM public.trainer_courses tc
        WHERE tc.id = NEW.course_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for certificate issuance
CREATE TRIGGER on_progress_complete
BEFORE UPDATE ON public.course_progress
FOR EACH ROW
EXECUTE FUNCTION public.issue_certificate_on_completion();

-- Function to notify course trainer on new comment
CREATE OR REPLACE FUNCTION public.notify_on_course_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    course_trainer_id UUID;
    course_title TEXT;
    commenter_name TEXT;
BEGIN
    -- Get course trainer and title
    SELECT trainer_id, title INTO course_trainer_id, course_title
    FROM public.trainer_courses WHERE id = NEW.course_id;
    
    -- Get commenter name
    SELECT full_name INTO commenter_name
    FROM public.profiles WHERE id = NEW.author_id;
    
    -- Don't notify if trainer comments on own course
    IF course_trainer_id != NEW.author_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_course_id, actor_id)
        VALUES (
            course_trainer_id,
            'course_comment',
            'تعليق جديد على دورتك',
            COALESCE(commenter_name, 'مستخدم') || ' علق على دورتك: ' || course_title,
            NEW.course_id,
            NEW.author_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for course comment notifications
CREATE TRIGGER on_new_course_comment
AFTER INSERT ON public.course_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_course_comment();