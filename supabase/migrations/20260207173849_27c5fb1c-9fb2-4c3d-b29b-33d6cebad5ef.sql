-- Add 'trainer' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';

-- Add new content categories for the new initiatives  
ALTER TYPE public.content_category ADD VALUE IF NOT EXISTS 'arab_awareness';
ALTER TYPE public.content_category ADD VALUE IF NOT EXISTS 'islamic_awareness';

-- Add new post categories
ALTER TYPE public.post_category ADD VALUE IF NOT EXISTS 'arab_awareness';
ALTER TYPE public.post_category ADD VALUE IF NOT EXISTS 'islamic_awareness';