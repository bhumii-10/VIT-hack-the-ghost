"""
AI-Powered Disaster Intelligence Engine
Comprehensive disaster detection, analysis, and response coordination system
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
from collections import defaultdict, deque
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DisasterType(Enum):
    EARTHQUAKE = "earthquake"
    FLOOD = "flood"
    FIRE = "fire"
    CYCLONE = "cyclone"
    LANDSLIDE = "landslide"
    TSUNAMI = "tsunami"
    URBAN_CRISIS = "urban_crisis"

class AlertLevel(Enum):
    NORMAL = "normal"
    PREPAREDNESS = "preparedness"
    ALERT = "alert"
    EMERGENCY = "emergency"
    CRITICAL = "critical"

@dataclass
class DisasterEvent:
    """Individual disaster event data structure"""
    event_id: str
    disaster_type: DisasterType
    latitude: float
    longitude: float
    magnitude: float
    timestamp: datetime
    source: str  # 'official' or 'user_reported'
    confidence: float
    metadata: Dict
    
@dataclass
class TrendAnalysis:
    """Trend analysis results"""
    trend_direction: str  # 'increasing', 'decreasing', 'stable'
    intensity_change: float
    frequency_change: float
    spatial_clustering: float
    temporal_clustering: float
    confidence: float

@dataclass
class RiskAssessment:
    """Comprehensive risk assessment"""
    disaster_type: DisasterType
    risk_percentage: float
    severity_level: int  # 1-5
    alert_level: AlertLevel
    confidence: float
    trend_analysis: TrendAnalysis
    affected_radius_km: float
    estimated_population_at_risk: int
    recommended_actions: List[str]
    
class AIDisasterIntelligence:
    """
    AI-Powered Disaster Intelligence Engine
    
    Continuously analyzes disaster data from multiple sources:
    - Official seismic feeds (USGS, local geological surveys)
    - Weather data (meteorological services)
    - User-reported incidents with geolocation
    - Social media sentiment analysis
    - Satellite imagery analysis (future enhancement)
    
    Provides:
    - Real-time trend analysis
    - Dynamic risk assessment
    - Intelligent escalation management
    - Community-level response coordination
    """
    
    def __init__(self):
        self.event_history = deque(maxlen=10000)  # Store recent events
        self.risk_cache = {}  # Cache risk assessments by region
        self.trend_cache = {}  # Cache trend analysis
        self.alert_thresholds = {
            AlertLevel.PREPAREDNESS: 25.0,
            AlertLevel.ALERT: 50.0,
            AlertLevel.EMERGENCY: 75.0,
            AlertLevel.CRITICAL: 90.0
        }
        
        # Data source configurations
        self.data_sources = {
            'usgs_earthquake': {
                'url': 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
                'enabled': True,
                'last_fetch': None
            },
            'weather_api': {
                'url': os.getenv('WEATHER_API_URL', ''),
                'api_key': os.getenv('WEATHER_API_KEY', ''),
                'enabled': bool(os.getenv('WEATHER_API_KEY')),
                'last_fetch': None
            }
        }
        
        # Regional population data (simplified - in production, use detailed census data)
        self.population_density = defaultdict(lambda: 1000)  # people per km²
        
        logger.info("AI Disaster Intelligence Engine initialized")
    
    async def ingest_official_data(self) -> List[DisasterEvent]:
        """
        Ingest data from official disaster monitoring sources
        """
        events = []
        
        # Fetch USGS earthquake data
        if self.data_sources['usgs_earthquake']['enabled']:
            try:
                earthquake_events = await self._fetch_usgs_earthquakes()
                events.extend(earthquake_events)
                self.data_sources['usgs_earthquake']['last_fetch'] = datetime.now()
            except Exception as e:
                logger.error(f"Failed to fetch USGS data: {e}")
        
        # Fetch weather data
        if self.data_sources['weather_api']['enabled']:
            try:
                weather_events = await self._fetch_weather_data()
                events.extend(weather_events)
                self.data_sources['weather_api']['last_fetch'] = datetime.now()
            except Exception as e:
                logger.error(f"Failed to fetch weather data: {e}")
        
        # Add events to history
        for event in events:
            self.event_history.append(event)
        
        logger.info(f"Ingested {len(events)} official disaster events")
        return events
    
    async def _fetch_usgs_earthquakes(self) -> List[DisasterEvent]:
        """Fetch earthquake data from USGS"""
        events = []
        try:
            response = requests.get(self.data_sources['usgs_earthquake']['url'], timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for feature in data.get('features', []):
                props = feature['properties']
                coords = feature['geometry']['coordinates']
                
                event = DisasterEvent(
                    event_id=f"usgs_{props['id']}",
                    disaster_type=DisasterType.EARTHQUAKE,
                    latitude=coords[1],
                    longitude=coords[0],
                    magnitude=props.get('mag', 0.0),
                    timestamp=datetime.fromtimestamp(props['time'] / 1000),
                    source='official',
                    confidence=0.95,  # High confidence for official data
                    metadata={
                        'depth': coords[2],
                        'place': props.get('place', ''),
                        'url': props.get('url', ''),
                        'felt': props.get('felt', 0),
                        'significance': props.get('sig', 0)
                    }
                )
                events.append(event)
                
        except Exception as e:
            logger.error(f"USGS fetch error: {e}")
        
        return events
    
    async def _fetch_weather_data(self) -> List[DisasterEvent]:
        """Fetch severe weather data"""
        events = []
        # Implementation would depend on specific weather API
        # This is a placeholder for weather data integration
        return events
    
    def ingest_user_report(self, incident_data: Dict) -> DisasterEvent:
        """
        Process user-reported incident and convert to DisasterEvent
        """
        try:
            event = DisasterEvent(
                event_id=f"user_{incident_data.get('incident_id', '')}",
                disaster_type=DisasterType(incident_data.get('incident_type', '').lower()),
                latitude=float(incident_data.get('latitude', 0)),
                longitude=float(incident_data.get('longitude', 0)),
                magnitude=self._estimate_magnitude_from_description(
                    incident_data.get('description', ''),
                    incident_data.get('incident_type', '')
                ),
                timestamp=datetime.fromisoformat(incident_data.get('reported_at', datetime.now().isoformat())),
                source='user_reported',
                confidence=self._calculate_user_report_confidence(incident_data),
                metadata={
                    'description': incident_data.get('description', ''),
                    'user_id': incident_data.get('user_id', ''),
                    'network_status': incident_data.get('network_status', 'unknown'),
                    'images': incident_data.get('images', [])
                }
            )
            
            self.event_history.append(event)
            logger.info(f"Processed user report: {event.event_id}")
            return event
            
        except Exception as e:
            logger.error(f"Failed to process user report: {e}")
            raise
    
    def _estimate_magnitude_from_description(self, description: str, incident_type: str) -> float:
        """
        Estimate magnitude/severity from text description using NLP
        """
        description_lower = description.lower()
        
        # Severity keywords mapping
        severity_keywords = {
            'minor': 1.0, 'small': 1.5, 'light': 2.0,
            'moderate': 3.0, 'significant': 3.5,
            'major': 4.0, 'severe': 4.5, 'extreme': 5.0,
            'catastrophic': 5.5, 'devastating': 6.0
        }
        
        # Incident-specific keywords
        if incident_type.lower() == 'flood':
            flood_keywords = {
                'puddles': 1.0, 'ankle': 1.5, 'knee': 2.5,
                'waist': 3.5, 'chest': 4.5, 'roof': 5.0
            }
            severity_keywords.update(flood_keywords)
        
        # Find highest severity keyword
        max_severity = 2.0  # Default moderate severity
        for keyword, severity in severity_keywords.items():
            if keyword in description_lower:
                max_severity = max(max_severity, severity)
        
        return min(max_severity, 6.0)  # Cap at 6.0
    
    def _calculate_user_report_confidence(self, incident_data: Dict) -> float:
        """
        Calculate confidence score for user-reported incident
        """
        confidence = 0.5  # Base confidence
        
        # Boost confidence based on available data
        if incident_data.get('images'):
            confidence += 0.2
        if incident_data.get('description') and len(incident_data['description']) > 50:
            confidence += 0.1
        if incident_data.get('network_status') == 'Online':
            confidence += 0.1
        if incident_data.get('latitude') and incident_data.get('longitude'):
            confidence += 0.1
        
        return min(confidence, 0.9)  # Cap at 0.9 for user reports
    
    def analyze_trends(self, region_lat: float, region_lon: float, radius_km: float = 50) -> TrendAnalysis:
        """
        Analyze disaster trends in a specific region
        """
        cache_key = f"{region_lat:.2f}_{region_lon:.2f}_{radius_km}"
        
        # Check cache (5-minute expiry)
        if cache_key in self.trend_cache:
            cached_time, cached_result = self.trend_cache[cache_key]
            if datetime.now() - cached_time < timedelta(minutes=5):
                return cached_result
        
        # Get events in region within last 24 hours
        recent_events = self._get_events_in_region(region_lat, region_lon, radius_km, hours=24)
        
        if len(recent_events) < 2:
            # Insufficient data for trend analysis
            trend = TrendAnalysis(
                trend_direction='stable',
                intensity_change=0.0,
                frequency_change=0.0,
                spatial_clustering=0.0,
                temporal_clustering=0.0,
                confidence=0.3
            )
        else:
            trend = self._calculate_trend_metrics(recent_events)
        
        # Cache result
        self.trend_cache[cache_key] = (datetime.now(), trend)
        return trend
    
    def _get_events_in_region(self, lat: float, lon: float, radius_km: float, hours: int = 24) -> List[DisasterEvent]:
        """Get events within specified region and time window"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        regional_events = []
        
        for event in self.event_history:
            if event.timestamp < cutoff_time:
                continue
                
            # Calculate distance using Haversine formula (simplified)
            distance = self._calculate_distance(lat, lon, event.latitude, event.longitude)
            if distance <= radius_km:
                regional_events.append(event)
        
        return sorted(regional_events, key=lambda x: x.timestamp)
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Earth's radius in kilometers
        
        return c * r
    
    def _calculate_trend_metrics(self, events: List[DisasterEvent]) -> TrendAnalysis:
        """Calculate detailed trend metrics from event list"""
        if len(events) < 2:
            return TrendAnalysis('stable', 0.0, 0.0, 0.0, 0.0, 0.3)
        
        # Split events into two halves for comparison
        mid_point = len(events) // 2
        first_half = events[:mid_point]
        second_half = events[mid_point:]
        
        # Calculate intensity change
        first_avg_magnitude = np.mean([e.magnitude for e in first_half])
        second_avg_magnitude = np.mean([e.magnitude for e in second_half])
        intensity_change = (second_avg_magnitude - first_avg_magnitude) / first_avg_magnitude if first_avg_magnitude > 0 else 0
        
        # Calculate frequency change
        first_duration = (first_half[-1].timestamp - first_half[0].timestamp).total_seconds() / 3600  # hours
        second_duration = (second_half[-1].timestamp - second_half[0].timestamp).total_seconds() / 3600
        
        first_frequency = len(first_half) / max(first_duration, 0.1)
        second_frequency = len(second_half) / max(second_duration, 0.1)
        frequency_change = (second_frequency - first_frequency) / first_frequency if first_frequency > 0 else 0
        
        # Determine trend direction
        if intensity_change > 0.1 or frequency_change > 0.2:
            trend_direction = 'increasing'
        elif intensity_change < -0.1 or frequency_change < -0.2:
            trend_direction = 'decreasing'
        else:
            trend_direction = 'stable'
        
        # Calculate spatial clustering (simplified)
        spatial_clustering = self._calculate_spatial_clustering(events)
        
        # Calculate temporal clustering
        temporal_clustering = self._calculate_temporal_clustering(events)
        
        # Calculate confidence based on data quality
        confidence = min(0.9, 0.5 + (len(events) * 0.05))
        
        return TrendAnalysis(
            trend_direction=trend_direction,
            intensity_change=intensity_change,
            frequency_change=frequency_change,
            spatial_clustering=spatial_clustering,
            temporal_clustering=temporal_clustering,
            confidence=confidence
        )
    
    def _calculate_spatial_clustering(self, events: List[DisasterEvent]) -> float:
        """Calculate how spatially clustered the events are (0-1)"""
        if len(events) < 3:
            return 0.0
        
        # Calculate average distance between all event pairs
        distances = []
        for i in range(len(events)):
            for j in range(i + 1, len(events)):
                dist = self._calculate_distance(
                    events[i].latitude, events[i].longitude,
                    events[j].latitude, events[j].longitude
                )
                distances.append(dist)
        
        avg_distance = np.mean(distances)
        # Normalize: closer events = higher clustering score
        clustering_score = max(0, 1 - (avg_distance / 100))  # 100km normalization
        return min(clustering_score, 1.0)
    
    def _calculate_temporal_clustering(self, events: List[DisasterEvent]) -> float:
        """Calculate how temporally clustered the events are (0-1)"""
        if len(events) < 3:
            return 0.0
        
        # Calculate time gaps between consecutive events
        time_gaps = []
        for i in range(1, len(events)):
            gap = (events[i].timestamp - events[i-1].timestamp).total_seconds() / 3600  # hours
            time_gaps.append(gap)
        
        avg_gap = np.mean(time_gaps)
        # Normalize: shorter gaps = higher clustering score
        clustering_score = max(0, 1 - (avg_gap / 24))  # 24 hour normalization
        return min(clustering_score, 1.0)
    
    def assess_risk(self, region_lat: float, region_lon: float, radius_km: float = 50) -> RiskAssessment:
        """
        Comprehensive risk assessment for a region
        """
        cache_key = f"risk_{region_lat:.2f}_{region_lon:.2f}_{radius_km}"
        
        # Check cache (2-minute expiry for risk assessments)
        if cache_key in self.risk_cache:
            cached_time, cached_result = self.risk_cache[cache_key]
            if datetime.now() - cached_time < timedelta(minutes=2):
                return cached_result
        
        # Get trend analysis
        trend_analysis = self.analyze_trends(region_lat, region_lon, radius_km)
        
        # Get recent events
        recent_events = self._get_events_in_region(region_lat, region_lon, radius_km, hours=6)
        
        # Calculate base risk from recent events
        base_risk = self._calculate_base_risk(recent_events)
        
        # Apply trend multipliers
        trend_multiplier = self._calculate_trend_multiplier(trend_analysis)
        
        # Calculate final risk percentage
        risk_percentage = min(base_risk * trend_multiplier, 100.0)
        
        # Determine severity level (1-5)
        severity_level = self._risk_to_severity_level(risk_percentage)
        
        # Determine alert level
        alert_level = self._risk_to_alert_level(risk_percentage)
        
        # Estimate affected population
        affected_population = self._estimate_affected_population(region_lat, region_lon, radius_km, severity_level)
        
        # Generate recommended actions
        recommended_actions = self._generate_recommended_actions(alert_level, recent_events)
        
        # Calculate overall confidence
        confidence = self._calculate_risk_confidence(recent_events, trend_analysis)
        
        risk_assessment = RiskAssessment(
            disaster_type=self._determine_primary_disaster_type(recent_events),
            risk_percentage=risk_percentage,
            severity_level=severity_level,
            alert_level=alert_level,
            confidence=confidence,
            trend_analysis=trend_analysis,
            affected_radius_km=radius_km,
            estimated_population_at_risk=affected_population,
            recommended_actions=recommended_actions
        )
        
        # Cache result
        self.risk_cache[cache_key] = (datetime.now(), risk_assessment)
        
        logger.info(f"Risk assessment for {region_lat:.2f},{region_lon:.2f}: {risk_percentage:.1f}% ({alert_level.value})")
        return risk_assessment
    
    def _calculate_base_risk(self, events: List[DisasterEvent]) -> float:
        """Calculate base risk from recent events"""
        if not events:
            return 0.0
        
        # Weight events by recency and magnitude
        total_weighted_risk = 0.0
        total_weight = 0.0
        
        now = datetime.now()
        
        for event in events:
            # Time decay factor (more recent = higher weight)
            hours_ago = (now - event.timestamp).total_seconds() / 3600
            time_weight = max(0.1, 1.0 - (hours_ago / 24))  # Decay over 24 hours
            
            # Magnitude factor
            magnitude_risk = min(event.magnitude * 15, 80)  # Scale magnitude to risk
            
            # Source confidence factor
            confidence_weight = event.confidence
            
            weighted_risk = magnitude_risk * time_weight * confidence_weight
            total_weighted_risk += weighted_risk
            total_weight += time_weight * confidence_weight
        
        if total_weight == 0:
            return 0.0
        
        return min(total_weighted_risk / total_weight, 80.0)  # Cap base risk at 80%
    
    def _calculate_trend_multiplier(self, trend_analysis: TrendAnalysis) -> float:
        """Calculate risk multiplier based on trend analysis"""
        base_multiplier = 1.0
        
        # Trend direction multiplier
        if trend_analysis.trend_direction == 'increasing':
            base_multiplier *= 1.5
        elif trend_analysis.trend_direction == 'decreasing':
            base_multiplier *= 0.8
        
        # Intensity change multiplier
        if trend_analysis.intensity_change > 0.2:
            base_multiplier *= (1.0 + trend_analysis.intensity_change)
        
        # Frequency change multiplier
        if trend_analysis.frequency_change > 0.3:
            base_multiplier *= (1.0 + trend_analysis.frequency_change * 0.5)
        
        # Clustering multipliers
        if trend_analysis.spatial_clustering > 0.7:
            base_multiplier *= 1.3
        if trend_analysis.temporal_clustering > 0.7:
            base_multiplier *= 1.2
        
        return min(base_multiplier, 3.0)  # Cap multiplier at 3x
    
    def _risk_to_severity_level(self, risk_percentage: float) -> int:
        """Convert risk percentage to severity level (1-5)"""
        if risk_percentage < 20:
            return 1
        elif risk_percentage < 40:
            return 2
        elif risk_percentage < 60:
            return 3
        elif risk_percentage < 80:
            return 4
        else:
            return 5
    
    def _risk_to_alert_level(self, risk_percentage: float) -> AlertLevel:
        """Convert risk percentage to alert level"""
        if risk_percentage < self.alert_thresholds[AlertLevel.PREPAREDNESS]:
            return AlertLevel.NORMAL
        elif risk_percentage < self.alert_thresholds[AlertLevel.ALERT]:
            return AlertLevel.PREPAREDNESS
        elif risk_percentage < self.alert_thresholds[AlertLevel.EMERGENCY]:
            return AlertLevel.ALERT
        elif risk_percentage < self.alert_thresholds[AlertLevel.CRITICAL]:
            return AlertLevel.EMERGENCY
        else:
            return AlertLevel.CRITICAL
    
    def _estimate_affected_population(self, lat: float, lon: float, radius_km: float, severity_level: int) -> int:
        """Estimate population at risk in the affected area"""
        # Simplified calculation - in production, use detailed census data
        area_km2 = 3.14159 * (radius_km ** 2)
        population_density = self.population_density[f"{lat:.1f}_{lon:.1f}"]
        
        # Adjust for severity level
        severity_multiplier = {1: 0.1, 2: 0.3, 3: 0.6, 4: 0.8, 5: 1.0}
        
        estimated_population = int(area_km2 * population_density * severity_multiplier[severity_level])
        return estimated_population
    
    def _determine_primary_disaster_type(self, events: List[DisasterEvent]) -> DisasterType:
        """Determine the primary disaster type from recent events"""
        if not events:
            return DisasterType.URBAN_CRISIS
        
        # Count events by type
        type_counts = defaultdict(int)
        for event in events:
            type_counts[event.disaster_type] += 1
        
        # Return most common type
        return max(type_counts.items(), key=lambda x: x[1])[0]
    
    def _generate_recommended_actions(self, alert_level: AlertLevel, events: List[DisasterEvent]) -> List[str]:
        """Generate context-appropriate recommended actions"""
        actions = []
        
        if alert_level == AlertLevel.NORMAL:
            actions = [
                "Continue normal activities",
                "Stay informed about local conditions",
                "Review emergency preparedness plans"
            ]
        elif alert_level == AlertLevel.PREPAREDNESS:
            actions = [
                "Review emergency supplies and evacuation routes",
                "Stay alert to changing conditions",
                "Ensure communication devices are charged",
                "Monitor official emergency channels"
            ]
        elif alert_level == AlertLevel.ALERT:
            actions = [
                "Prepare for possible evacuation",
                "Secure loose objects and important documents",
                "Avoid unnecessary travel",
                "Stay in contact with family and neighbors",
                "Monitor emergency broadcasts continuously"
            ]
        elif alert_level == AlertLevel.EMERGENCY:
            actions = [
                "EVACUATE IMMEDIATELY if instructed by authorities",
                "Move to higher ground (floods) or open areas (earthquakes)",
                "Take emergency supplies and important documents",
                "Help elderly and disabled neighbors if safe to do so",
                "Report your status to emergency services"
            ]
        elif alert_level == AlertLevel.CRITICAL:
            actions = [
                "TAKE IMMEDIATE SHELTER OR EVACUATE NOW",
                "Follow all emergency service instructions",
                "Do not attempt to travel unless evacuating",
                "Conserve phone battery for emergency calls only",
                "Stay calm and help others if possible"
            ]
        
        # Add disaster-specific actions
        if events:
            primary_type = self._determine_primary_disaster_type(events)
            disaster_specific = self._get_disaster_specific_actions(primary_type, alert_level)
            actions.extend(disaster_specific)
        
        return actions
    
    def _get_disaster_specific_actions(self, disaster_type: DisasterType, alert_level: AlertLevel) -> List[str]:
        """Get disaster-specific recommended actions"""
        actions = []
        
        if disaster_type == DisasterType.EARTHQUAKE:
            if alert_level in [AlertLevel.ALERT, AlertLevel.EMERGENCY, AlertLevel.CRITICAL]:
                actions.extend([
                    "Drop, Cover, and Hold On during shaking",
                    "Stay away from windows and heavy objects",
                    "If outdoors, move away from buildings and power lines",
                    "Check for gas leaks and structural damage after shaking stops"
                ])
        
        elif disaster_type == DisasterType.FLOOD:
            if alert_level in [AlertLevel.ALERT, AlertLevel.EMERGENCY, AlertLevel.CRITICAL]:
                actions.extend([
                    "Move to higher ground immediately",
                    "Avoid walking or driving through flood water",
                    "Turn off utilities if instructed",
                    "Do not drink flood water - use bottled water only"
                ])
        
        elif disaster_type == DisasterType.FIRE:
            if alert_level in [AlertLevel.ALERT, AlertLevel.EMERGENCY, AlertLevel.CRITICAL]:
                actions.extend([
                    "Evacuate immediately if fire is approaching",
                    "Close all windows and doors",
                    "Wet towels and place under doors to prevent smoke",
                    "Stay low to avoid smoke inhalation"
                ])
        
        return actions
    
    def _calculate_risk_confidence(self, events: List[DisasterEvent], trend_analysis: TrendAnalysis) -> float:
        """Calculate overall confidence in risk assessment"""
        base_confidence = 0.5
        
        # More events = higher confidence
        event_confidence = min(0.3, len(events) * 0.05)
        
        # Official sources boost confidence
        official_events = [e for e in events if e.source == 'official']
        official_confidence = min(0.2, len(official_events) * 0.1)
        
        # Trend analysis confidence
        trend_confidence = trend_analysis.confidence * 0.3
        
        total_confidence = base_confidence + event_confidence + official_confidence + trend_confidence
        return min(total_confidence, 0.95)
    
    def should_trigger_alert(self, risk_assessment: RiskAssessment) -> bool:
        """
        Determine if an alert should be triggered based on risk assessment
        Implements intelligent filtering to prevent false alarms
        """
        # Don't alert for normal conditions
        if risk_assessment.alert_level == AlertLevel.NORMAL:
            return False
        
        # Require minimum confidence threshold
        if risk_assessment.confidence < 0.6:
            return False
        
        # Require minimum risk percentage
        if risk_assessment.risk_percentage < 30.0:
            return False
        
        # Check if trend is actually increasing (avoid false alarms on decreasing trends)
        if (risk_assessment.trend_analysis.trend_direction == 'decreasing' and 
            risk_assessment.alert_level == AlertLevel.PREPAREDNESS):
            return False
        
        # Require minimum population at risk for higher alert levels
        if (risk_assessment.alert_level in [AlertLevel.EMERGENCY, AlertLevel.CRITICAL] and 
            risk_assessment.estimated_population_at_risk < 100):
            return False
        
        return True
    
    def generate_verified_alert(self, risk_assessment: RiskAssessment) -> Dict:
        """
        Generate a verified alert with all required information
        """
        alert = {
            'alert_id': f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'timestamp': datetime.now().isoformat(),
            'disaster_type': risk_assessment.disaster_type.value,
            'alert_level': risk_assessment.alert_level.value,
            'risk_percentage': round(risk_assessment.risk_percentage, 1),
            'severity_level': risk_assessment.severity_level,
            'confidence': round(risk_assessment.confidence, 2),
            'affected_radius_km': risk_assessment.affected_radius_km,
            'estimated_population_at_risk': risk_assessment.estimated_population_at_risk,
            'recommended_actions': risk_assessment.recommended_actions,
            'trend_analysis': {
                'direction': risk_assessment.trend_analysis.trend_direction,
                'intensity_change': round(risk_assessment.trend_analysis.intensity_change, 2),
                'frequency_change': round(risk_assessment.trend_analysis.frequency_change, 2),
                'spatial_clustering': round(risk_assessment.trend_analysis.spatial_clustering, 2),
                'temporal_clustering': round(risk_assessment.trend_analysis.temporal_clustering, 2)
            },
            'verification_status': 'verified',
            'source': 'ai_disaster_intelligence',
            'expires_at': (datetime.now() + timedelta(hours=6)).isoformat()
        }
        
        logger.warning(f"VERIFIED ALERT GENERATED: {alert['alert_id']} - {alert['disaster_type'].upper()} - {alert['alert_level'].upper()}")
        return alert
    
    async def continuous_monitoring(self, regions: List[Tuple[float, float, float]]) -> List[Dict]:
        """
        Continuously monitor specified regions and generate alerts as needed
        
        Args:
            regions: List of (latitude, longitude, radius_km) tuples to monitor
        
        Returns:
            List of generated alerts
        """
        alerts = []
        
        # Ingest latest official data
        await self.ingest_official_data()
        
        # Assess risk for each region
        for lat, lon, radius in regions:
            try:
                risk_assessment = self.assess_risk(lat, lon, radius)
                
                if self.should_trigger_alert(risk_assessment):
                    alert = self.generate_verified_alert(risk_assessment)
                    alerts.append(alert)
                    
            except Exception as e:
                logger.error(f"Error assessing region {lat},{lon}: {e}")
        
        return alerts
    
    def get_system_status(self) -> Dict:
        """Get current system status and statistics"""
        now = datetime.now()
        
        # Count events by source and recency
        recent_events = [e for e in self.event_history if (now - e.timestamp).total_seconds() < 86400]  # 24 hours
        official_events = [e for e in recent_events if e.source == 'official']
        user_events = [e for e in recent_events if e.source == 'user_reported']
        
        # Data source status
        source_status = {}
        for source, config in self.data_sources.items():
            if config['last_fetch']:
                minutes_since_fetch = (now - config['last_fetch']).total_seconds() / 60
                status = 'operational' if minutes_since_fetch < 60 else 'stale'
            else:
                status = 'not_fetched'
            
            source_status[source] = {
                'enabled': config['enabled'],
                'status': status,
                'last_fetch': config['last_fetch'].isoformat() if config['last_fetch'] else None
            }
        
        return {
            'status': 'operational',
            'total_events_24h': len(recent_events),
            'official_events_24h': len(official_events),
            'user_events_24h': len(user_events),
            'data_sources': source_status,
            'cache_stats': {
                'risk_cache_size': len(self.risk_cache),
                'trend_cache_size': len(self.trend_cache),
                'event_history_size': len(self.event_history)
            },
            'alert_thresholds': {level.value: threshold for level, threshold in self.alert_thresholds.items()},
            'last_updated': now.isoformat()
        }

# Global instance
disaster_intelligence = AIDisasterIntelligence()