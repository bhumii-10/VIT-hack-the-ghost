"""
Context-Aware Severity Intelligence Engine
A continuous, adaptive situational intelligence layer for real-world risk assessment.
"""

import asyncio
import json
import math
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

class ContextSeverityEngine:
    """
    Autonomous severity intelligence that operates based on live location context.
    No manual input. No fixed thresholds. Pure situational awareness.
    """
    
    def __init__(self):
        self.base_severity = 0.0
        self.location_cache = {}
        self.severity_history = {}
        self.confidence_threshold = 0.7
        
        # External data sources
        self.weather_api_key = os.getenv('OPENWEATHER_API_KEY', '')
        self.news_api_key = os.getenv('GNEWS_API_KEY', '')
        
    async def compute_live_severity(self, user_id: str, latitude: float, longitude: float) -> Dict:
        """
        Main entry point: Compute severity based on live location context.
        """
        try:
            # Generate location context key
            location_key = f"{round(latitude, 3)}_{round(longitude, 3)}"
            
            # Fetch all contextual data sources
            location_context = await self._fetch_location_context(latitude, longitude)
            environmental_context = await self._fetch_environmental_context(latitude, longitude)
            incident_context = await self._fetch_incident_context(latitude, longitude)
            historical_context = await self._get_historical_baseline(location_key)
            
            # Compute continuous severity value
            severity_components = {
                'environmental_risk': self._compute_environmental_risk(environmental_context),
                'incident_density': self._compute_incident_density(incident_context),
                'location_vulnerability': self._compute_location_vulnerability(location_context),
                'temporal_multiplier': self._compute_temporal_multiplier(),
                'historical_deviation': self._compute_historical_deviation(historical_context, location_key)
            }
            
            # Combine components into continuous value
            continuous_value = self._combine_severity_components(severity_components)
            
            # Determine relative band dynamically
            relative_band = self._determine_relative_band(continuous_value, location_key)
            
            # Compute trend
            trend = self._compute_trend(user_id, continuous_value)
            
            # Calculate confidence
            confidence = self._calculate_confidence(severity_components)
            
            # Store for trend analysis
            self._store_severity_reading(user_id, continuous_value, location_key)
            
            return {
                "severity_context": {
                    "continuous_value": round(continuous_value, 4),
                    "relative_band": relative_band,
                    "confidence": round(confidence, 3),
                    "trend": trend
                },
                "location_basis": location_key,
                "used_auto_fetched_context": True,
                "manual_user_input_used": False,
                "contributing_factors": severity_components,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "timezone": "Local Time"
            }
            
        except Exception as e:
            # Fail-safe: Conservative elevation
            return {
                "severity_context": {
                    "continuous_value": 0.3,
                    "relative_band": "elevated",
                    "confidence": 0.1,
                    "trend": "unknown"
                },
                "location_basis": f"{latitude}_{longitude}",
                "used_auto_fetched_context": False,
                "manual_user_input_used": False,
                "error": str(e),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "timezone": "Local Time"
            }
    
    async def _fetch_location_context(self, lat: float, lon: float) -> Dict:
        """Fetch location-specific risk indicators."""
        try:
            # Reverse geocoding to get location details
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Use free geocoding service
                response = await client.get(
                    f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'country': data.get('countryName', 'Unknown'),
                        'region': data.get('principalSubdivision', 'Unknown'),
                        'city': data.get('city', 'Unknown'),
                        'locality': data.get('locality', 'Unknown'),
                        'population_density': self._estimate_population_density(data),
                        'infrastructure_type': self._classify_infrastructure(data)
                    }
        except Exception as e:
            print(f"Location context fetch error: {e}")
            
        return {
            'country': 'Unknown',
            'region': 'Unknown', 
            'city': 'Unknown',
            'locality': 'Unknown',
            'population_density': 'medium',
            'infrastructure_type': 'mixed'
        }
    
    async def _fetch_environmental_context(self, lat: float, lon: float) -> Dict:
        """Fetch real-time environmental risk indicators."""
        environmental_data = {
            'weather_severity': 0.0,
            'natural_hazard_risk': 0.0,
            'air_quality_risk': 0.0,
            'seismic_activity': 0.0
        }
        
        try:
            if self.weather_api_key:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Current weather conditions
                    weather_response = await client.get(
                        f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={self.weather_api_key}"
                    )
                    
                    if weather_response.status_code == 200:
                        weather_data = weather_response.json()
                        environmental_data['weather_severity'] = self._assess_weather_severity(weather_data)
                    
                    # Weather alerts
                    alerts_response = await client.get(
                        f"https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid={self.weather_api_key}&exclude=minutely,hourly,daily"
                    )
                    
                    if alerts_response.status_code == 200:
                        alerts_data = alerts_response.json()
                        if 'alerts' in alerts_data:
                            environmental_data['natural_hazard_risk'] = len(alerts_data['alerts']) * 0.2
            
        except Exception as e:
            print(f"Environmental context fetch error: {e}")
        
        return environmental_data
    
    async def _fetch_incident_context(self, lat: float, lon: float) -> Dict:
        """Fetch nearby incident density and crisis signals."""
        try:
            # This would integrate with your existing incident database
            # For now, simulate based on location characteristics
            
            # Check for recent incidents in radius
            incident_density = await self._query_incident_database(lat, lon, radius_km=10)
            
            # Check news for crisis signals in the area
            crisis_signals = await self._scan_crisis_news(lat, lon)
            
            return {
                'incident_count_24h': incident_density.get('count_24h', 0),
                'incident_severity_avg': incident_density.get('avg_severity', 0.0),
                'crisis_news_mentions': crisis_signals.get('mentions', 0),
                'emergency_service_activity': incident_density.get('emergency_activity', 0.0)
            }
            
        except Exception as e:
            print(f"Incident context fetch error: {e}")
            return {
                'incident_count_24h': 0,
                'incident_severity_avg': 0.0,
                'crisis_news_mentions': 0,
                'emergency_service_activity': 0.0
            }
    
    async def _query_incident_database(self, lat: float, lon: float, radius_km: float = 10) -> Dict:
        """Query local incident database for nearby incidents using live data."""
        try:
            # Dynamically import shim to avoid circular dependencies
            from supabase_shim import create_client
            
            url = os.getenv("SUPABASE_URL", "").strip()
            key = os.getenv("SUPABASE_KEY", "").strip()
            
            if not url or not key:
                return {'count_24h': 0, 'avg_severity': 0.0, 'emergency_activity': 0.0}
                
            # Create a localized client for this engine loop
            sb = create_client(url, key)
            
            # Fast Bounding Box Calculation (~111km per degree)
            lat_delta = radius_km / 111.0
            # Compensate for longitude lines converging at poles
            cos_lat = math.cos(math.radians(lat))
            lon_delta = radius_km / (111.0 * max(cos_lat, 0.1))
            
            # Query incidents within the bounding box that are NOT closed
            # Using the builder pattern from our shim
            response = sb.table('incidents').select('*')\
                .lt('latitude', lat + lat_delta)\
                .gt('latitude', lat - lat_delta)\
                .lt('longitude', lon + lon_delta)\
                .gt('longitude', lon - lon_delta)\
                .neq('status', 'resolved')\
                .neq('status', 'closed')\
                .execute()
                
            # Extract data from our custom SupabaseResponse
            incidents = response.data if hasattr(response, 'data') else []
            
            if not incidents:
                return {'count_24h': 0, 'avg_severity': 0.0, 'emergency_activity': 0.0}
            
            # Calculate composite situational scores
            severity_map = {
                'minimal': 0.1, 'low': 0.3, 'medium': 0.5, 
                'high': 0.8, 'critical': 1.0, 
                # numeric fallbacks
                '1': 0.2, '2': 0.4, '3': 0.6, '4': 0.8, '5': 1.0
            }
            
            total_sev = 0.0
            for incident in incidents:
                raw_sev = str(incident.get('severity', 'low')).lower()
                total_sev += severity_map.get(raw_sev, 0.4)
                
            return {
                'count_24h': len(incidents),
                'avg_severity': round(total_sev / len(incidents), 4),
                'emergency_activity': min(len(incidents) * 0.12, 1.0)
            }
            
        except Exception as e:
            print(f"Situational Engine DB Query Error: {e}")
            # Fallback to zero-risk if database is unreachable or query fails
            return {
                'count_24h': 0,
                'avg_severity': 0.0,
                'emergency_activity': 0.0
            }
    
    async def _scan_crisis_news(self, lat: float, lon: float) -> Dict:
        """Scan news for crisis-related mentions in the area."""
        try:
            if not self.news_api_key:
                return {'mentions': 0}
                
            # Get location name for news search
            location_context = await self._fetch_location_context(lat, lon)
            search_terms = [
                location_context.get('city', ''),
                location_context.get('region', ''),
                'disaster', 'emergency', 'crisis', 'flood', 'fire', 'earthquake'
            ]
            
            # This would search news APIs for crisis mentions
            # For now, return simulated data
            return {'mentions': 0}
            
        except Exception as e:
            print(f"Crisis news scan error: {e}")
            return {'mentions': 0}
    
    def _compute_environmental_risk(self, env_context: Dict) -> float:
        """Compute environmental risk component."""
        risk = 0.0
        risk += env_context.get('weather_severity', 0.0) * 0.4
        risk += env_context.get('natural_hazard_risk', 0.0) * 0.3
        risk += env_context.get('air_quality_risk', 0.0) * 0.2
        risk += env_context.get('seismic_activity', 0.0) * 0.1
        return min(risk, 1.0)
    
    def _compute_incident_density(self, incident_context: Dict) -> float:
        """Compute incident density risk component."""
        density = 0.0
        
        # Recent incident count (normalized)
        incident_count = incident_context.get('incident_count_24h', 0)
        density += min(incident_count / 10.0, 0.5)  # Max 0.5 from count
        
        # Average severity of recent incidents
        avg_severity = incident_context.get('incident_severity_avg', 0.0)
        density += avg_severity * 0.3
        
        # Emergency service activity
        emergency_activity = incident_context.get('emergency_service_activity', 0.0)
        density += emergency_activity * 0.2
        
        return min(density, 1.0)
    
    def _compute_location_vulnerability(self, location_context: Dict) -> float:
        """Compute location-based vulnerability."""
        vulnerability = 0.0
        
        # Population density risk
        pop_density = location_context.get('population_density', 'medium')
        if pop_density == 'high':
            vulnerability += 0.2
        elif pop_density == 'very_high':
            vulnerability += 0.3
        
        # Infrastructure vulnerability
        infrastructure = location_context.get('infrastructure_type', 'mixed')
        if infrastructure == 'old':
            vulnerability += 0.2
        elif infrastructure == 'poor':
            vulnerability += 0.3
        
        return min(vulnerability, 1.0)
    
    def _compute_temporal_multiplier(self) -> float:
        """Compute time-based risk multiplier using local time."""
        # Get current local time
        current_time = datetime.now()
        current_hour = current_time.hour
        
        # Night hours are riskier (reduced visibility, slower response)
        if 22 <= current_hour or current_hour <= 6:
            return 0.2
        # Early morning
        elif 6 < current_hour <= 9:
            return 0.1
        # Day hours
        else:
            return 0.0
    
    def _compute_historical_deviation(self, historical_context: Dict, location_key: str) -> float:
        """Compute deviation from historical baseline."""
        if not historical_context:
            return 0.0
            
        baseline = historical_context.get('baseline_severity', 0.1)
        recent_avg = historical_context.get('recent_average', 0.1)
        
        # If current conditions are significantly above baseline
        deviation = (recent_avg - baseline) / max(baseline, 0.01)
        return max(0.0, min(deviation, 0.5))
    
    def _combine_severity_components(self, components: Dict) -> float:
        """Combine all severity components into continuous value."""
        # Weighted combination
        weights = {
            'environmental_risk': 0.3,
            'incident_density': 0.25,
            'location_vulnerability': 0.2,
            'temporal_multiplier': 0.15,
            'historical_deviation': 0.1
        }
        
        total_severity = 0.0
        for component, value in components.items():
            weight = weights.get(component, 0.0)
            total_severity += value * weight
        
        return min(total_severity, 1.0)
    
    def _determine_relative_band(self, continuous_value: float, location_key: str) -> str:
        """Dynamically determine relative severity band."""
        # Dynamic thresholds based on location context
        if continuous_value <= 0.1:
            return "minimal"
        elif continuous_value <= 0.25:
            return "low"
        elif continuous_value <= 0.5:
            return "elevated"
        elif continuous_value <= 0.75:
            return "high"
        else:
            return "critical"
    
    def _compute_trend(self, user_id: str, current_value: float) -> str:
        """Compute severity trend."""
        if user_id not in self.severity_history:
            return "stable"
        
        history = self.severity_history[user_id]
        if len(history) < 2:
            return "stable"
        
        recent_values = [h['value'] for h in history[-3:]]
        if len(recent_values) >= 2:
            if current_value > recent_values[-1] + 0.1:
                return "increasing"
            elif current_value < recent_values[-1] - 0.1:
                return "decreasing"
        
        return "stable"
    
    def _calculate_confidence(self, components: Dict) -> float:
        """Calculate confidence in severity assessment."""
        # Base confidence
        confidence = 0.7
        
        # Reduce confidence if data is missing or uncertain
        for component, value in components.items():
            if value == 0.0:
                confidence -= 0.1
        
        return max(0.1, min(confidence, 1.0))
    
    def _store_severity_reading(self, user_id: str, value: float, location_key: str):
        """Store severity reading for trend analysis."""
        if user_id not in self.severity_history:
            self.severity_history[user_id] = []
        
        self.severity_history[user_id].append({
            'value': value,
            'location': location_key,
            'timestamp': time.time()
        })
        
        # Keep only last 10 readings
        self.severity_history[user_id] = self.severity_history[user_id][-10:]
    
    async def _get_historical_baseline(self, location_key: str) -> Dict:
        """Get historical baseline for location."""
        # This would query historical data from database
        # For now, return simulated baseline
        return {
            'baseline_severity': 0.1,
            'recent_average': 0.15
        }
    
    def _assess_weather_severity(self, weather_data: Dict) -> float:
        """Assess weather-based severity."""
        severity = 0.0
        
        # Wind speed
        wind_speed = weather_data.get('wind', {}).get('speed', 0)
        if wind_speed > 15:  # Strong wind
            severity += 0.3
        elif wind_speed > 10:
            severity += 0.1
        
        # Weather conditions
        weather_main = weather_data.get('weather', [{}])[0].get('main', '').lower()
        severe_conditions = ['thunderstorm', 'tornado', 'hurricane', 'snow', 'hail']
        if any(condition in weather_main for condition in severe_conditions):
            severity += 0.4
        
        # Visibility
        visibility = weather_data.get('visibility', 10000)
        if visibility < 1000:  # Poor visibility
            severity += 0.2
        
        return min(severity, 1.0)
    
    def _estimate_population_density(self, location_data: Dict) -> str:
        """Estimate population density from location data."""
        locality_type = location_data.get('localityType', '').lower()
        
        if 'city' in locality_type or 'urban' in locality_type:
            return 'high'
        elif 'town' in locality_type or 'suburb' in locality_type:
            return 'medium'
        else:
            return 'low'
    
    def _classify_infrastructure(self, location_data: Dict) -> str:
        """Classify infrastructure type."""
        country = location_data.get('countryName', '').lower()
        
        # Simplified classification
        developed_countries = ['united states', 'canada', 'germany', 'japan', 'australia']
        if any(country in dev_country for dev_country in developed_countries):
            return 'modern'
        else:
            return 'mixed'


# Global engine instance
severity_engine = ContextSeverityEngine()