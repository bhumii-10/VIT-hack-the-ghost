"""
Supabase client for AI-Assisted Resource Recommendation
"""

import os
from supabase import create_client, Client
from typing import List, Dict, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class RecommendationDatabase:
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
    
    def get_incident(self, incident_id: str) -> Optional[Dict]:
        """Get incident details by ID"""
        try:
            response = self.supabase.table('incidents').select('*').eq('incident_id', incident_id).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching incident {incident_id}: {e}")
            return None
    
    def get_available_resources(self) -> List[Dict]:
        """Get all available resources"""
        try:
            response = self.supabase.table('resources').select('*').eq('availability_status', 'available').execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error fetching resources: {e}")
            return []
    
    def log_recommendation(self, audit_data: Dict) -> bool:
        """Log recommendation to audit table"""
        try:
            # Ensure we have the resource_recommendations table
            response = self.supabase.table('resource_recommendations').insert(audit_data).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error logging recommendation: {e}")
            # Try to create the table if it doesn't exist
            try:
                self._create_recommendations_table()
                response = self.supabase.table('resource_recommendations').insert(audit_data).execute()
                return True
            except Exception as e2:
                logger.error(f"Error creating table and logging: {e2}")
                return False
    
    def update_resource_status(self, resource_id: str, status: str) -> bool:
        """Update resource availability status"""
        try:
            response = self.supabase.table('resources').update({
                'availability_status': status,
                'last_used_at': datetime.now().isoformat()
            }).eq('resource_id', resource_id).execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating resource status: {e}")
            return False
    
    def get_recommendation_history(self, incident_id: str) -> List[Dict]:
        """Get recommendation history for an incident"""
        try:
            response = self.supabase.table('resource_recommendations').select('*').eq('incident_id', incident_id).order('timestamp', desc=True).execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error fetching recommendation history: {e}")
            return []
    
    def _create_recommendations_table(self):
        """Create resource_recommendations table if it doesn't exist"""
        # This would typically be done via Supabase dashboard or migration
        # For now, we'll just log that the table needs to be created
        logger.info("resource_recommendations table needs to be created in Supabase")
        
        # SQL for creating the table (to be run in Supabase SQL editor):
        sql = """
        CREATE TABLE IF NOT EXISTS resource_recommendations (
            id SERIAL PRIMARY KEY,
            incident_id TEXT NOT NULL,
            resource_id TEXT NOT NULL,
            rank INTEGER NOT NULL,
            reasoning TEXT NOT NULL,
            confidence FLOAT NOT NULL,
            approved_by_admin TEXT,
            admin_action TEXT,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_resource_recommendations_incident_id ON resource_recommendations(incident_id);
        CREATE INDEX IF NOT EXISTS idx_resource_recommendations_timestamp ON resource_recommendations(timestamp);
        """
        
        logger.info(f"Run this SQL in Supabase to create the table:\n{sql}")
    
    def ensure_resources_table_exists(self):
        """Ensure resources table exists with required columns"""
        # This is for reference - should be created in Supabase
        sql = """
        CREATE TABLE IF NOT EXISTS resources (
            id SERIAL PRIMARY KEY,
            resource_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            availability_status TEXT DEFAULT 'available',
            capacity INTEGER DEFAULT 1,
            last_used_at TIMESTAMP WITH TIME ZONE,
            contact_info TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert sample resources if table is empty
        INSERT INTO resources (resource_id, name, resource_type, latitude, longitude, availability_status, capacity, contact_info)
        VALUES 
            ('AMB_001', 'Ambulance Unit Alpha', 'medical', 28.6139, 77.2090, 'available', 2, '+91-9876543210'),
            ('FIRE_001', 'Fire Engine Delta', 'rescue', 28.7041, 77.1025, 'available', 6, '+91-9876543211'),
            ('RESCUE_001', 'Rescue Team Bravo', 'rescue', 28.5355, 77.3910, 'available', 8, '+91-9876543212'),
            ('SHELTER_001', 'Community Center Shelter', 'shelter', 28.4595, 77.0266, 'available', 500, '+91-9876543213'),
            ('TRANSPORT_001', 'Evacuation Bus Fleet', 'transport', 28.6692, 77.4538, 'available', 50, '+91-9876543214')
        ON CONFLICT (resource_id) DO NOTHING;
        """
        
        logger.info(f"Run this SQL in Supabase to ensure resources table:\n{sql}")
    
    def get_system_stats(self) -> Dict:
        """Get system statistics for dashboard"""
        try:
            # Get total resources
            resources_response = self.supabase.table('resources').select('*', count='exact').execute()
            total_resources = resources_response.count or 0
            
            # Get available resources
            available_response = self.supabase.table('resources').select('*', count='exact').eq('availability_status', 'available').execute()
            available_resources = available_response.count or 0
            
            # Get recent recommendations
            recent_response = self.supabase.table('resource_recommendations').select('*', count='exact').gte('timestamp', datetime.now().replace(hour=0, minute=0, second=0).isoformat()).execute()
            recent_recommendations = recent_response.count or 0
            
            return {
                'total_resources': total_resources,
                'available_resources': available_resources,
                'deployed_resources': total_resources - available_resources,
                'recent_recommendations': recent_recommendations,
                'system_status': 'operational'
            }
            
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {
                'total_resources': 0,
                'available_resources': 0,
                'deployed_resources': 0,
                'recent_recommendations': 0,
                'system_status': 'error'
            }