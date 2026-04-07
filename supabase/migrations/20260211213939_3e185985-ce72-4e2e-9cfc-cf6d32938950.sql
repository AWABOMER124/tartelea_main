
-- Add access_type column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN access_type text NOT NULL DEFAULT 'public' 
CHECK (access_type IN ('public', 'subscribers_only'));

-- Update RLS policy: subscribers_only rooms require active subscription check
-- We'll handle this in the application layer for flexibility
