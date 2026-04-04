"""
Core ranking logic for AI-Assisted Resource Recommendation
Uses structured data and relative ranking (no fixed thresholds)
"""

import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    def __init__(self):
        self.resource_type_compatibility = {
            'Fire': ['rescue', 'medical', 'transport'],
            'Flood': ['rescue', 'transport', 'shelter', 'supplies'],
            'Earthquake': ['rescue', 'medical', 'shelter', 'supplies'],
            'Medical Emergency': ['medical', 'transport'],
            'Accident': ['medical', 'rescue', 'transport'],
            'Landslide': ['rescue', 'transport', 'shelter'],
            'Cyclone': ['rescue', 'shelter', 'supplies', 'transport'],
            'Drought': ['supplies', 'transport'],
            'Other': ['rescue', 'medical', 'transport', 'supplies']
        }
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        try:
            R = 6371  # Earth's radius in kilometers
            
            lat1_rad = math.radians(lat1)
            lon1_rad = math.radians(lon1)
            lat2_rad = math.radians(lat2)
            lon2_rad = math.radians(lon2)
            
            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad
            
            a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            
            return R * c
        except Exception as e:
            logger.error(f"Distance calculation error: {e}")
            return float('inf')
    
    def get_compatible_resources(self, incident_type: str, resources: List[Dict]) -> List[Dict]:
        """Filter resources compatible with incident type"""
        compatible_types = self.resource_type_compatibility.get(incident_type, ['rescue', 'medical'])
        
        compatible_resources = []
        for resource in resources:
            if (resource.get('availability_status') == 'available' and 
                resource.get('resource_type') in compatible_types):
                compatible_resources.append(resource)
        
        return compatible_resources
    
    def calculate_relative_metrics(self, incident: Dict, resources: List[Dict]) -> List[Dict]:
        """Calculate relative metrics for each resource"""
        if not resources:
            return []
        
        incident_lat = incident.get('latitude', 0)
        incident_lon = incident.get('longitude', 0)
        
        # Calculate raw metrics
        for resource in resources:
            resource_lat = resource.get('latitude', 0)
            resource_lon = resource.get('longitude', 0)
            
            # Distance calculation
            distance = self.calculate_distance(incident_lat, incident_lon, resource_lat, resource_lon)
            resource['raw_distance'] = distance
            
            # Response time estimation (distance-based + base response time)
            base_response_time = 5  # minutes
            travel_time = distance * 2  # 2 minutes per km (rough estimate)
            resource['raw_response_time'] = base_response_time + travel_time
            
            # Idle duration (time since last used)
            last_used = resource.get('last_used_at')
            if last_used:
                try:
                    last_used_dt = datetime.fromisoformat(last_used.replace('Z', '+00:00'))
                    idle_hours = (datetime.now() - last_used_dt.replace(tzinfo=None)).total_seconds() / 3600
                except:
                    idle_hours = 24  # Default to 24 hours if parsing fails
            else:
                idle_hours = 24  # Never used
            
            resource['raw_idle_hours'] = idle_hours
            
            # Capacity suitability (normalized capacity)
            capacity = resource.get('capacity', 1)
            resource['raw_capacity'] = capacity
        
        # Normalize metrics relatively
        distances = [r['raw_distance'] for r in resources]
        response_times = [r['raw_response_time'] for r in resources]
        idle_hours = [r['raw_idle_hours'] for r in resources]
        capacities = [r['raw_capacity'] for r in resources]
        
        min_distance = min(distances) if distances else 0
        max_distance = max(distances) if distances else 1
        min_response = min(response_times) if response_times else 0
        max_response = max(response_times) if response_times else 1
        min_idle = min(idle_hours) if idle_hours else 0
        max_idle = max(idle_hours) if idle_hours else 1
        min_capacity = min(capacities) if capacities else 1
        max_capacity = max(capacities) if capacities else 1
        
        # Calculate normalized scores (0-1)
        for resource in resources:
            # Distance score (0 = closest, 1 = farthest)
            if max_distance > min_distance:
                resource['distance_score'] = (resource['raw_distance'] - min_distance) / (max_distance - min_distance)
            else:
                resource['distance_score'] = 0
            
            # Response time score (0 = fastest, 1 = slowest)
            if max_response > min_response:
                resource['response_time_score'] = (resource['raw_response_time'] - min_response) / (max_response - min_response)
            else:
                resource['response_time_score'] = 0
            
            # Availability score (always 1 for available resources)
            resource['availability_score'] = 1.0
            
            # Capacity score (0 = lowest capacity, 1 = highest capacity)
            if max_capacity > min_capacity:
                resource['capacity_score'] = (resource['raw_capacity'] - min_capacity) / (max_capacity - min_capacity)
            else:
                resource['capacity_score'] = 1.0
            
            # Idle duration score (0 = recently used, 1 = long idle)
            if max_idle > min_idle:
                resource['idle_duration_score'] = (resource['raw_idle_hours'] - min_idle) / (max_idle - min_idle)
            else:
                resource['idle_duration_score'] = 1.0
        
        return resources
    
    def calculate_suitability_score(self, resource: Dict, incident: Dict) -> float:
        """Calculate dynamic suitability score based on incident severity and type"""
        severity = incident.get('severity_level', 3)
        
        # Dynamic weights based on severity
        if severity >= 4:  # High severity - prioritize speed
            weights = {
                'distance': 0.4,
                'response_time': 0.3,
                'capacity': 0.2,
                'idle_duration': 0.1
            }
        elif severity >= 2:  # Medium severity - balanced approach
            weights = {
                'distance': 0.25,
                'response_time': 0.25,
                'capacity': 0.25,
                'idle_duration': 0.25
            }
        else:  # Low severity - optimize resource utilization
            weights = {
                'distance': 0.2,
                'response_time': 0.2,
                'capacity': 0.3,
                'idle_duration': 0.3
            }
        
        # Calculate weighted score (higher is better)
        score = (
            (1 - resource['distance_score']) * weights['distance'] +
            (1 - resource['response_time_score']) * weights['response_time'] +
            resource['capacity_score'] * weights['capacity'] +
            resource['idle_duration_score'] * weights['idle_duration']
        )
        
        return min(max(score, 0), 1)  # Ensure score is between 0 and 1
    
    def rank_resources(self, incident: Dict, resources: List[Dict]) -> List[Dict]:
        """Main ranking function"""
        try:
            # Filter compatible resources
            compatible_resources = self.get_compatible_resources(
                incident.get('incident_type', 'Other'), 
                resources
            )
            
            if not compatible_resources:
                logger.warning(f"No compatible resources found for incident {incident.get('incident_id')}")
                return []
            
            # Calculate relative metrics
            resources_with_metrics = self.calculate_relative_metrics(incident, compatible_resources)
            
            # Calculate suitability scores
            for resource in resources_with_metrics:
                resource['overall_suitability'] = self.calculate_suitability_score(resource, incident)
            
            # Sort by suitability score (highest first)
            ranked_resources = sorted(
                resources_with_metrics, 
                key=lambda x: x['overall_suitability'], 
                reverse=True
            )
            
            # Add rank
            for i, resource in enumerate(ranked_resources):
                resource['rank'] = i + 1
            
            logger.info(f"Ranked {len(ranked_resources)} resources for incident {incident.get('incident_id')}")
            return ranked_resources
            
        except Exception as e:
            logger.error(f"Resource ranking error: {e}")
            return []