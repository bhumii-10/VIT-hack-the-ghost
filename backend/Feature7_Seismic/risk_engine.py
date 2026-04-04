"""
Seismic Risk Engine - Advanced risk assessment and prediction
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json

class SeismicRiskEngine:
    def __init__(self):
        # Seismic zones for India (simplified)
        self.seismic_zones = {
            "Zone V": {"risk_multiplier": 1.0, "description": "Very High Damage Risk Zone"},
            "Zone IV": {"risk_multiplier": 0.8, "description": "High Damage Risk Zone"},
            "Zone III": {"risk_multiplier": 0.6, "description": "Moderate Damage Risk Zone"},
            "Zone II": {"risk_multiplier": 0.4, "description": "Low Damage Risk Zone"},
            "Zone I": {"risk_multiplier": 0.2, "description": "Very Low Damage Risk Zone"}
        }
        
        # Major fault lines (simplified coordinates)
        self.major_faults = [
            {"name": "Himalayan Frontal Thrust", "lat": 30.0, "lon": 78.0, "activity": "high"},
            {"name": "Narmada-Tapti Fault", "lat": 22.0, "lon": 76.0, "activity": "moderate"},
            {"name": "Godavari Fault", "lat": 18.0, "lon": 80.0, "activity": "low"},
            {"name": "West Coast Fault", "lat": 15.0, "lon": 74.0, "activity": "moderate"}
        ]
    
    def determine_seismic_zone(self, latitude: float, longitude: float) -> str:
        """Determine seismic zone based on coordinates"""
        # Simplified zone determination for India
        if 28 <= latitude <= 35 and 75 <= longitude <= 85:  # Himalayan region
            return "Zone V"
        elif 23 <= latitude <= 28 and 70 <= longitude <= 85:  # Northern plains
            return "Zone IV"
        elif 15 <= latitude <= 23 and 70 <= longitude <= 85:  # Central India
            return "Zone III"
        elif 8 <= latitude <= 15 and 70 <= longitude <= 85:   # Southern India
            return "Zone II"
        else:
            return "Zone III"  # Default moderate zone
    
    def calculate_fault_proximity_risk(self, latitude: float, longitude: float) -> Dict:
        """Calculate risk based on proximity to major fault lines"""
        min_distance = float('inf')
        nearest_fault = None
        
        for fault in self.major_faults:
            # Simple distance calculation
            distance = ((latitude - fault['lat'])**2 + (longitude - fault['lon'])**2)**0.5 * 111
            if distance < min_distance:
                min_distance = distance
                nearest_fault = fault
        
        # Risk decreases with distance
        if min_distance < 50:
            proximity_risk = 0.9
            risk_level = "HIGH"
        elif min_distance < 100:
            proximity_risk = 0.7
            risk_level = "MODERATE"
        elif min_distance < 200:
            proximity_risk = 0.5
            risk_level = "LOW"
        else:
            proximity_risk = 0.3
            risk_level = "MINIMAL"
        
        return {
            "proximity_risk": proximity_risk,
            "risk_level": risk_level,
            "nearest_fault": nearest_fault['name'] if nearest_fault else "Unknown",
            "distance_km": round(min_distance, 1),
            "fault_activity": nearest_fault['activity'] if nearest_fault else "unknown"
        }
    
    def assess_geological_stability(self, latitude: float, longitude: float) -> Dict:
        """Assess geological stability of the region"""
        # Simplified geological assessment
        zone = self.determine_seismic_zone(latitude, longitude)
        zone_data = self.seismic_zones[zone]
        
        # Factors affecting stability
        factors = {
            "rock_type": "sedimentary",  # Simplified
            "soil_liquefaction_risk": "low",
            "slope_stability": "stable",
            "groundwater_level": "normal"
        }
        
        # Adjust based on location
        if "Zone V" in zone or "Zone IV" in zone:
            factors["soil_liquefaction_risk"] = "moderate"
            if latitude > 30:  # Himalayan region
                factors["slope_stability"] = "unstable"
                factors["rock_type"] = "metamorphic"
        
        stability_score = 1.0 - zone_data["risk_multiplier"]
        
        return {
            "stability_score": stability_score,
            "seismic_zone": zone,
            "zone_description": zone_data["description"],
            "geological_factors": factors
        }
    
    def calculate_building_vulnerability(self, building_type: str = "modern") -> Dict:
        """Calculate building vulnerability to seismic activity"""
        vulnerability_matrix = {
            "modern": {"score": 0.2, "description": "Modern seismic-resistant construction"},
            "standard": {"score": 0.5, "description": "Standard construction with basic seismic provisions"},
            "old": {"score": 0.8, "description": "Older construction with minimal seismic provisions"},
            "unreinforced": {"score": 0.9, "description": "Unreinforced masonry or traditional construction"}
        }
        
        vulnerability = vulnerability_matrix.get(building_type, vulnerability_matrix["standard"])
        
        return {
            "vulnerability_score": vulnerability["score"],
            "building_type": building_type,
            "description": vulnerability["description"],
            "recommendations": self.get_building_recommendations(vulnerability["score"])
        }
    
    def get_building_recommendations(self, vulnerability_score: float) -> List[str]:
        """Get building safety recommendations based on vulnerability"""
        if vulnerability_score >= 0.8:
            return [
                "Consider structural retrofitting",
                "Conduct professional seismic assessment",
                "Prepare evacuation plans",
                "Secure heavy furniture and equipment",
                "Consider relocation if severely vulnerable"
            ]
        elif vulnerability_score >= 0.5:
            return [
                "Regular structural inspections recommended",
                "Secure heavy objects and furniture",
                "Install seismic safety devices",
                "Prepare emergency kits and plans"
            ]
        else:
            return [
                "Maintain regular building inspections",
                "Keep emergency supplies ready",
                "Practice earthquake safety drills"
            ]
    
    def comprehensive_risk_assessment(self, latitude: float, longitude: float, 
                                    building_type: str = "modern") -> Dict:
        """Perform comprehensive seismic risk assessment"""
        
        # Get all risk components
        zone_assessment = self.assess_geological_stability(latitude, longitude)
        fault_assessment = self.calculate_fault_proximity_risk(latitude, longitude)
        building_assessment = self.calculate_building_vulnerability(building_type)
        
        # Calculate overall risk score (0-100)
        zone_risk = self.seismic_zones[zone_assessment["seismic_zone"]]["risk_multiplier"]
        fault_risk = fault_assessment["proximity_risk"]
        building_risk = building_assessment["vulnerability_score"]
        
        # Weighted average
        overall_risk = (zone_risk * 0.4 + fault_risk * 0.3 + building_risk * 0.3) * 100
        
        # Determine risk level
        if overall_risk >= 70:
            risk_level = "CRITICAL"
            color = "red"
        elif overall_risk >= 50:
            risk_level = "HIGH"
            color = "orange"
        elif overall_risk >= 30:
            risk_level = "MODERATE"
            color = "yellow"
        else:
            risk_level = "LOW"
            color = "green"
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "overall_assessment": {
                "risk_score": round(overall_risk, 1),
                "risk_level": risk_level,
                "color": color
            },
            "detailed_analysis": {
                "seismic_zone": zone_assessment,
                "fault_proximity": fault_assessment,
                "building_vulnerability": building_assessment
            },
            "recommendations": self.get_comprehensive_recommendations(risk_level),
            "assessment_timestamp": datetime.now().isoformat()
        }
    
    def get_comprehensive_recommendations(self, risk_level: str) -> List[str]:
        """Get comprehensive recommendations based on overall risk level"""
        base_recommendations = [
            "Maintain emergency supply kit",
            "Know evacuation routes",
            "Practice earthquake safety drills",
            "Stay informed about seismic activity"
        ]
        
        risk_specific = {
            "CRITICAL": [
                "Consider immediate structural assessment",
                "Develop detailed evacuation plans",
                "Install seismic monitoring equipment",
                "Consider temporary relocation during high-risk periods"
            ],
            "HIGH": [
                "Schedule professional structural inspection",
                "Retrofit building if necessary",
                "Install earthquake early warning systems",
                "Secure all heavy objects and equipment"
            ],
            "MODERATE": [
                "Regular building maintenance and inspection",
                "Secure furniture and appliances",
                "Install basic safety equipment",
                "Stay updated on local seismic activity"
            ],
            "LOW": [
                "Basic earthquake preparedness",
                "Annual safety review",
                "Community awareness programs"
            ]
        }
        
        return base_recommendations + risk_specific.get(risk_level, [])

# Global risk engine instance
risk_engine = SeismicRiskEngine()