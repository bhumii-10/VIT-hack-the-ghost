-- ==========================================
-- 🚀 EMERGENCY BROADCAST & AUTO-CHAT UPDATE
-- ==========================================

-- 1. Update Profiles for Broadcasting
ALTER TABLE profiles 
ADD COLUMN is_broadcasting BOOLEAN DEFAULT FALSE,
ADD COLUMN last_latitude FLOAT8,
ADD COLUMN last_longitude FLOAT8;

-- 2. Update Incident Rooms for Auto-Closing
ALTER TABLE incident_rooms 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 3. Trigger to Auto-Close Chat Room when Incident is Resolved/Closed
CREATE OR REPLACE FUNCTION public.handle_incident_status_change() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') THEN
    UPDATE incident_rooms 
    SET is_active = FALSE 
    WHERE incident_id = NEW.id;
  ELSIF NEW.status IN ('pending', 'verified', 'dispatched') THEN
    UPDATE incident_rooms 
    SET is_active = TRUE 
    WHERE incident_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_incident_status_update ON incidents;
CREATE TRIGGER on_incident_status_update
  AFTER UPDATE OF status ON incidents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_incident_status_change();

-- 4. Enable Realtime for Profiles & Incident Rooms
-- Note: You might need to do this via Supabase Dashboard -> Database -> Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE incident_rooms;
