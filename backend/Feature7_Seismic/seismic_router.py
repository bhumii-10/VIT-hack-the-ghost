"""
Feature 7: Automated Seismic Monitor
Real-time seismic activity monitoring and earthquake detection
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime
import requests
import json

router = APIRouter(tags=["Seismic Monitor"])

class SeismicEvent(BaseModel):
    magnitude: float
    location: str
    latitude: float
    longitude: float
    depth: float
    timestamp: str
    source: str = "USGS"

class SeismicAlert(BaseModel):
    event_id: str
    magnitude: float
    location: str
    risk_level: str
    estimated_impact: str
    recommendations: List[str]

@router.get("/seismic/events")
async def get_recent_seismic_events():
    """Get recent seismic events from USGS"""
    try:
        # USGS Earthquake API
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            events = []
            
            for feature in data.get('features', []):
                props = feature.get('properties', {})
                coords = feature.get('geometry', {}).get('coordinates', [])
                
                if len(coords) >= 3:
                    event = SeismicEvent(
                        magnitude=props.get('mag', 0),
                        location=props.get('place', 'Unknown'),
                        latitude=coords[1],
                        longitude=coords[0],
                        depth=coords[2],
                        timestamp=datetime.fromtimestamp(props.get('time', 0) / 1000).isoformat(),
                        source="USGS"
                    )
                    events.append(event)
            
            return {"events": events, "count": len(events)}
        else:
            return {"events": [], "count": 0, "error": "Failed to fetch seismic data"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seismic monitoring error: {str(e)}")

@router.get("/seismic/alerts/{latitude}/{longitude}")
async def get_seismic_alerts(latitude: float, longitude: float, radius: float = 100):
    """Get seismic alerts for a specific location"""
    try:
        # Simulate seismic risk assessment
        alerts = []
        
        # Check for recent earthquakes in the area
        events_response = await get_recent_seismic_events()
        events = events_response.get('events', [])
        
        for event in events:
            # Calculate distance (simplified)
            lat_diff = abs(event.latitude - latitude)
            lon_diff = abs(event.longitude - longitude)
            distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111  # Rough km conversion
            
            if distance <= radius and event.magnitude >= 4.0:
                risk_level = "HIGH" if event.magnitude >= 6.0 else "MEDIUM" if event.magnitude >= 5.0 else "LOW"
                
                alert = SeismicAlert(
                    event_id=f"SEISMIC_{int(datetime.now().timestamp())}",
                    magnitude=event.magnitude,
                    location=event.location,
                    risk_level=risk_level,
                    estimated_impact=f"Earthquake detected {distance:.1f}km away",
                    recommendations=[
                        "Stay alert for aftershocks",
                        "Check for structural damage",
                        "Keep emergency supplies ready",
                        "Follow local emergency guidelines"
                    ]
                )
                alerts.append(alert)
        
        return {
            "alerts": alerts,
            "location": {"latitude": latitude, "longitude": longitude},
            "radius_km": radius,
            "alert_count": len(alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seismic alert error: {str(e)}")

@router.get("/seismic/risk/{latitude}/{longitude}")
async def assess_seismic_risk(latitude: float, longitude: float):
    """Assess seismic risk for a location"""
    try:
        # Simplified seismic risk assessment
        # In production, this would use geological data and historical patterns
        
        risk_factors = {
            "historical_activity": "MODERATE",
            "geological_stability": "STABLE",
            "fault_proximity": "DISTANT",
            "building_codes": "MODERN"
        }
        
        # Calculate overall risk score (0-100)
        base_risk = 25  # Base risk for the region
        
        # Adjust based on location (simplified)
        if 20 <= latitude <= 40 and 70 <= longitude <= 90:  # India seismic zones
            base_risk += 20
        
        risk_score = min(base_risk, 100)
        
        if risk_score >= 70:
            risk_level = "HIGH"
            color = "red"
        elif risk_score >= 40:
            risk_level = "MEDIUM"
            color = "orange"
        else:
            risk_level = "LOW"
            color = "green"
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "risk_assessment": {
                "overall_risk": risk_level,
                "risk_score": risk_score,
                "color": color,
                "factors": risk_factors
            },
            "recommendations": [
                "Ensure buildings meet seismic safety standards",
                "Prepare emergency kits and evacuation plans",
                "Stay informed about local seismic activity",
                "Practice earthquake safety drills"
            ],
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment error: {str(e)}")

@router.get("/seismic/status")
async def get_seismic_monitor_status():
    """Get seismic monitoring system status"""
    try:
        # Check USGS API availability
        usgs_status = "operational"
        try:
            response = requests.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson", timeout=5)
            if response.status_code != 200:
                usgs_status = "degraded"
        except:
            usgs_status = "offline"
        
        return {
            "system_status": "operational",
            "data_sources": {
                "usgs_api": usgs_status,
                "local_sensors": "simulated"
            },
            "monitoring_regions": ["Global", "India", "Asia-Pacific"],
            "last_check": datetime.now().isoformat(),
            "features": {
                "real_time_monitoring": True,
                "risk_assessment": True,
                "alert_system": True,
                "historical_data": True
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check error: {str(e)}")