-- Create service reviews table
CREATE TABLE public.service_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.trainer_services(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    trainer_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for service reviews
CREATE POLICY "Anyone can view service reviews"
ON public.service_reviews FOR SELECT
USING (true);

CREATE POLICY "Students can create reviews for their completed bookings"
ON public.service_reviews FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own reviews"
ON public.service_reviews FOR UPDATE
USING (auth.uid() = student_id);

-- Create trainer availability table
CREATE TABLE public.trainer_availability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainer_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainer availability
CREATE POLICY "Anyone can view trainer availability"
ON public.trainer_availability FOR SELECT
USING (true);

CREATE POLICY "Trainers can manage their own availability"
ON public.trainer_availability FOR ALL
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

-- Create blocked dates table for trainers
CREATE TABLE public.trainer_blocked_dates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trainer_id UUID NOT NULL,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trainer_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.trainer_blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked dates
CREATE POLICY "Anyone can view blocked dates"
ON public.trainer_blocked_dates FOR SELECT
USING (true);

CREATE POLICY "Trainers can manage their blocked dates"
ON public.trainer_blocked_dates FOR ALL
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

-- Function to get average service rating
CREATE OR REPLACE FUNCTION public.get_service_avg_rating(service_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0)
    FROM public.service_reviews
    WHERE service_id = service_uuid
$$;

-- Function to get service review count
CREATE OR REPLACE FUNCTION public.get_service_review_count(service_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.service_reviews
    WHERE service_id = service_uuid
$$;