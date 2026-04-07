
-- Phase 1: Performance indexes + missing columns for rooms

-- 1. Add missing columns to rooms table
ALTER TABLE public.rooms 
  ADD COLUMN IF NOT EXISTS actual_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS peak_participants INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_participants_count INT DEFAULT 0;

-- 2. Performance indexes

-- Fast lookup for active/approved rooms
CREATE INDEX IF NOT EXISTS idx_rooms_approved_live 
  ON public.rooms(is_approved, is_live, scheduled_at DESC);

-- Active participants in a room
CREATE INDEX IF NOT EXISTS idx_room_participants_room 
  ON public.room_participants(room_id, user_id);

-- Pending hand raises
CREATE INDEX IF NOT EXISTS idx_hand_raises_pending 
  ON public.room_hand_raises(room_id, status) 
  WHERE status = 'pending';

-- Community feed (posts sorted by date)
CREATE INDEX IF NOT EXISTS idx_posts_created_desc 
  ON public.posts(created_at DESC);

-- Room messages by room
CREATE INDEX IF NOT EXISTS idx_room_messages_room 
  ON public.room_messages(room_id, created_at DESC);

-- Room roles lookup
CREATE INDEX IF NOT EXISTS idx_room_roles_lookup 
  ON public.room_roles(room_id, user_id);

-- Notifications unread
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(user_id, is_read, created_at DESC) 
  WHERE is_read = false;

-- Contents search (Arabic full-text)
CREATE INDEX IF NOT EXISTS idx_contents_title_search 
  ON public.contents USING GIN(to_tsvector('simple', title));

-- Trainer courses approved
CREATE INDEX IF NOT EXISTS idx_courses_approved 
  ON public.trainer_courses(is_approved, created_at DESC) 
  WHERE is_approved = true;

-- Workshops approved
CREATE INDEX IF NOT EXISTS idx_workshops_approved 
  ON public.workshops(is_approved, scheduled_at DESC) 
  WHERE is_approved = true;

-- Room recordings available
CREATE INDEX IF NOT EXISTS idx_recordings_available 
  ON public.room_recordings(room_id, is_available) 
  WHERE is_available = true;
