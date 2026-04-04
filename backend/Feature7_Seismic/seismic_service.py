"""
Seismic Service - Core seismic monitoring functionality
"""

import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio

class SeismicService:
    def __init__(self):
        self.usgs_base_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0"
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
    
    async def get_earthquake_data(self, timeframe: str = "day") -> Dict:
        """Fetch earthquake data from USGS"""
        cache_key = f"earthquakes_{timeframe}"
        
        # Check cache
        if cache_key in self.cache:
            cached_time, data = self.cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_duration):
                return data
        
        try:
            url = f"{self.usgs_base_url}/summary/significant_{timeframe}.geojson"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.cache[cache_key] = (datetime.now(), data)
                return data
            else:
                return {"features": [], "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            return {"features": [], "error": str(e)}
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        # Simplified distance calculation
        lat_diff = abs(lat1 - lat2)
        lon_diff = abs(lon1 - lon2)
        return ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111  # Rough km conversion
    
    def assess_earthquake_impact(self, magnitude: float, distance: float) -> Dict:
        """Assess potential impact of earthquake"""
        if magnitude >= 7.0:
            if distance < 50:
                impact = "SEVERE"
                description = "Major structural damage expected"
            elif distance < 200:
                impact = "HIGH"
                description = "Significant damage possible"
            else:
                impact = "MODERATE"
                description = "Minor to moderate damage possible"
        elif magnitude >= 6.0:
            if distance < 30:
                impact = "HIGH"
                description = "Significant damage possible"
            elif distance < 100:
                impact = "MODERATE"
                description = "Minor to moderate damage possible"
            else:
                impact = "LOW"
                description = "Minimal damage expected"
        elif magnitude >= 5.0:
            if distance < 20:
                impact = "MODERATE"
                description = "Minor damage possible"
            else:
                impact = "LOW"
                description = "Minimal impact expected"
        else:
            impact = "MINIMAL"
            description = "No significant impact expected"
        
        return {
            "impact_level": impact,
            "description": description,
            "magnitude": magnitude,
            "distance_km": distance
        }
    
    def get_safety_recommendations(self, impact_level: str) -> List[str]:
        """Get safety recommendations based on impact level"""
        recommendations = {
            "SEVERE": [
                "Evacuate damaged buildings immediately",
                "Stay away from damaged structures",
                "Check for gas leaks and electrical damage",
                "Contact emergency services if needed",
                "Prepare for strong aftershocks"
            ],
            "HIGH": [
                "Check building for structural damage",
                "Be prepared to evacuate if necessary",
                "Turn off gas and electricity if damage suspected",
                "Stay alert for aftershocks",
                "Keep emergency supplies ready"
            ],
            "MODERATE": [
                "Inspect your surroundings for damage",
                "Be cautious of falling objects",
                "Stay informed about aftershocks",
                "Check emergency supplies",
                "Follow local emergency guidelines"
            ],
            "LOW": [
                "Stay alert for aftershocks",
                "Check for minor damage",
                "Keep emergency kit accessible",
                "Monitor official updates"
            ],
            "MINIMAL": [
                "Stay informed about seismic activity",
                "Review earthquake preparedness plans",
                "Check emergency supplies"
            ]
        }
        
        return recommendations.get(impact_level, recommendations["MINIMAL"])

# Global service instance
seismic_service = SeismicService()