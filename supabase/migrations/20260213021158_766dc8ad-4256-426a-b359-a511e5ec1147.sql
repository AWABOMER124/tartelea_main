-- Enable realtime for rooms table so live status updates are pushed to all clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;