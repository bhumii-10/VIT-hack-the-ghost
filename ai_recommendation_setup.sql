-- AI-Assisted Resource Recommendation Database Setup
-- Run this in Supabase SQL Editor

-- Create resource_recommendations table for audit logging
CREATE TABLE IF NOT EXISTS resource_recommendations (
    id SERIAL PRIMARY KEY,
    incident_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    approved_by_admin TEXT,
    admin_action TEXT CHECK (admin_action IN ('approved', 'rejected', 'ignored')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_recommendations_incident_id ON resource_recommendations(incident_id);
CREATE INDEX IF NOT EXISTS idx_resource_recommendations_timestamp ON resource_recommendations(timestamp);
CREATE INDEX IF NOT EXISTS idx_resource_recommendations_admin_action ON resource_recommendations(admin_action);

-- Ensure resources table exists with required columns
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    resource_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('medical', 'rescue', 'transport', 'shelter', 'supplies')),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'maintenance', 'unavailable')),
    capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
    last_used_at TIMESTAMP WITH TIME ZONE,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for resources table
CREATE INDEX IF NOT EXISTS idx_resources_availability_status ON resources(availability_status);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources(latitude, longitude);

-- Insert sample resources if table is empty
INSERT INTO resources (resource_id, name, resource_type, latitude, longitude, availability_status, capacity, contact_info)
VALUES 
    ('AMB_001', 'Ambulance Unit Alpha', 'medical', 28.6139, 77.2090, 'available', 2, '+91-9876543210'),
    ('AMB_002', 'Ambulance Unit Beta', 'medical', 28.7041, 77.1025, 'available', 2, '+91-9876543211'),
    ('FIRE_001', 'Fire Engine Delta', 'rescue', 28.5355, 77.3910, 'available', 6, '+91-9876543212'),
    ('FIRE_002', 'Fire Engine Gamma', 'rescue', 28.4595, 77.0266, 'available', 6, '+91-9876543213'),
    ('RESCUE_001', 'Rescue Team Bravo', 'rescue', 28.6692, 77.4538, 'available', 8, '+91-9876543214'),
    ('RESCUE_002', 'Rescue Team Charlie', 'rescue', 28.5245, 77.1855, 'available', 8, '+91-9876543215'),
    ('SHELTER_001', 'Community Center Shelter', 'shelter', 28.6129, 77.2295, 'available', 500, '+91-9876543216'),
    ('SHELTER_002', 'School Shelter Alpha', 'shelter', 28.6517, 77.2219, 'available', 300, '+91-9876543217'),
    ('TRANSPORT_001', 'Evacuation Bus Fleet A', 'transport', 28.6304, 77.2177, 'available', 50, '+91-9876543218'),
    ('TRANSPORT_002', 'Evacuation Bus Fleet B', 'transport', 28.5562, 77.1000, 'available', 45, '+91-9876543219'),
    ('SUPPLY_001', 'Emergency Food Supplies A', 'supplies', 28.6448, 77.2167, 'available', 1000, '+91-9876543220'),
    ('SUPPLY_002', 'Emergency Medical Supplies', 'supplies', 28.6289, 77.2065, 'available', 800, '+91-9876543221')
ON CONFLICT (resource_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for resources table
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE resource_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
CREATE POLICY "Allow authenticated users to read resource_recommendations" ON resource_recommendations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert resource_recommendations" ON resource_recommendations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read resources" ON resources
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update resources" ON resources
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT, INSERT ON resource_recommendations TO authenticated;
GRANT SELECT, UPDATE ON resources TO authenticated;
GRANT USAGE ON SEQUENCE resource_recommendations_id_seq TO authenticated;

-- Verification queries
SELECT 'Resources table created successfully' as status, count(*) as resource_count FROM resources;
SELECT 'Recommendations table created successfully' as status FROM resource_recommendations LIMIT 1;