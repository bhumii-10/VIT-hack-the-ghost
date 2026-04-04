-- ============================================================
-- REQUIRED DATABASE MIGRATION FOR LOCATION FEATURES
-- ============================================================
-- 
-- Run this SQL in your Supabase SQL Editor to add missing columns:
-- 
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project: wmjqgcgamnbbqkbooovb
-- 3. Go to SQL Editor (left sidebar)
-- 4. Paste and run the SQL below
-- 5. Refresh your SankatSaathi app
-- ============================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_location_accuracy FLOAT,
ADD COLUMN IF NOT EXISTS last_location_timestamp TIMESTAMP WITH TIME ZONE;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'last_location%'
ORDER BY column_name;