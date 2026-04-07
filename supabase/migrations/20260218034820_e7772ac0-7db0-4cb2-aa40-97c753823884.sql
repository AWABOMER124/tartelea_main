
-- Add unique constraint for room_roles upsert (room_id, user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_roles_room_id_user_id_key'
  ) THEN
    ALTER TABLE public.room_roles ADD CONSTRAINT room_roles_room_id_user_id_key UNIQUE (room_id, user_id);
  END IF;
END $$;
