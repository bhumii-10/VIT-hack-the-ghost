-- =============================================
-- 🚀 ENABLE REALTIME FOR CHAT & DASHBOARD 🚀
-- =============================================

-- In Supabase, Realtime is disabled by default for Security.
-- We must explicitly add our tables to the 'supabase_realtime' publication.

BEGIN;
  -- 1. Enable Realtime for the incidents table (for dashboard updates)
  ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
  
  -- 2. Enable Realtime for the incident_messages table (for chat)
  ALTER PUBLICATION supabase_realtime ADD TABLE incident_messages;
  
  -- 3. Enable Realtime for incident_rooms (optional but good for new rooms)
  ALTER PUBLICATION supabase_realtime ADD TABLE incident_rooms;
COMMIT;

-- Verify
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
