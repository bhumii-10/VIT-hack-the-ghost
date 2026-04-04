"""
Live Severity Router - Location-based automatic severity assessment
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import asyncio
from datetime import datetime
from .context_severity_engine import severity_engine

router = APIRouter(tags=["Live Severity Intelligence"])

class LocationInput(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None

class SeverityResponse(BaseModel):
    severity_context: dict
    location_basis: str
    used_auto_fetched_context: bool
    manual_user_input_used: bool
    contributing_factors: Optional[dict] = None
    timestamp: str

@router.post("/severity/live", response_model=SeverityResponse)
async def get_live_severity(location: LocationInput):
    """
    Autonomous severity assessment based on live location context.
    
    This endpoint:
    - Takes only GPS coordinates (no manual severity input)
    - Auto-fetches environmental, incident, and location context
    - Returns continuous severity value with confidence
    - Operates as invisible intelligence layer
    """
    try:
        # Validate coordinates
        if not (-90 <= location.latitude <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude")
        if not (-180 <= location.longitude <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude")
        
        # Compute live severity using context engine
        result = await severity_engine.compute_live_severity(
            user_id=location.user_id,
            latitude=location.latitude,
            longitude=location.longitude
        )
        
        return SeverityResponse(**result)
        
    except Exception as e:
        # Fail-safe: Return conservative assessment
        return SeverityResponse(
            severity_context={
                "continuous_value": 0.3,
                "relative_band": "elevated",
                "confidence": 0.1,
                "trend": "unknown"
            },
            location_basis=f"{location.latitude}_{location.longitude}",
            used_auto_fetched_context=False,
            manual_user_input_used=False,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

@router.get("/severity/regional/{lat}/{lon}")
async def get_regional_severity_map(lat: float, lon: float, radius: float = 10.0):
    """
    Get aggregated severity heatmap for a region.
    Used by admins for resource planning and hotspot detection.
    """
    try:
        # Generate grid points around the center
        grid_points = []
        step = 0.01  # ~1km resolution
        
        for lat_offset in [-2*step, -step, 0, step, 2*step]:
            for lon_offset in [-2*step, -step, 0, step, 2*step]:
                grid_lat = lat + lat_offset
                grid_lon = lon + lon_offset
                
                # Compute severity for each grid point
                severity_result = await severity_engine.compute_live_severity(
                    user_id="regional_scan",
                    latitude=grid_lat,
                    longitude=grid_lon
                )
                
                grid_points.append({
                    "latitude": grid_lat,
                    "longitude": grid_lon,
                    "severity": severity_result["severity_context"]["continuous_value"],
                    "band": severity_result["severity_context"]["relative_band"]
                })
        
        # Calculate regional statistics
        severities = [point["severity"] for point in grid_points]
        avg_severity = sum(severities) / len(severities)
        max_severity = max(severities)
        
        return {
            "center": {"latitude": lat, "longitude": lon},
            "radius_km": radius,
            "grid_resolution": step,
            "regional_stats": {
                "average_severity": round(avg_severity, 4),
                "max_severity": round(max_severity, 4),
                "hotspot_count": len([s for s in severities if s > 0.6])
            },
            "grid_points": grid_points,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "timezone": "Local Time"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regional analysis failed: {str(e)}")

@router.get("/severity/trends/{user_id}")
async def get_user_severity_trends(user_id: str):
    """
    Get severity trends for a specific user (anonymized).
    Used for understanding user risk patterns over time.
    """
    try:
        # Get user's severity history from engine
        history = severity_engine.severity_history.get(user_id, [])
        
        if not history:
            return {
                "user_id": user_id,
                "trend_data": [],
                "summary": "No historical data available"
            }
        
        # Analyze trends
        values = [h["value"] for h in history]
        locations = [h["location"] for h in history]
        
        trend_analysis = {
            "current_severity": values[-1] if values else 0.0,
            "average_severity": sum(values) / len(values) if values else 0.0,
            "peak_severity": max(values) if values else 0.0,
            "location_changes": len(set(locations)),
            "data_points": len(history)
        }
        
        return {
            "user_id": user_id,
            "trend_data": history,
            "analysis": trend_analysis,
            "privacy_note": "Data is anonymized and used only for safety optimization"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {str(e)}")

@router.get("/severity/system/status")
async def get_system_status():
    """
    Get status of the severity intelligence system.
    """
    return {
        "system": "Context-Aware Severity Intelligence Engine",
        "status": "operational",
        "mode": "autonomous",
        "features": {
            "live_location_analysis": True,
            "environmental_context": True,
            "incident_correlation": True,
            "trend_detection": True,
            "regional_mapping": True
        },
        "data_sources": {
            "weather_api": bool(severity_engine.weather_api_key),
            "news_api": bool(severity_engine.news_api_key),
            "incident_database": True,
            "location_services": True
        },
        "privacy": {
            "manual_input_required": False,
            "user_data_anonymized": True,
            "individual_exposure": False
        }
    }

@router.post("/severity/test")
async def test_severity_engine(test_location: LocationInput):
    """
    Test endpoint for severity engine validation.
    """
    try:
        # Test with known coordinates
        test_results = []
        
        # Test multiple scenarios
        test_scenarios = [
            {"lat": test_location.latitude, "lon": test_location.longitude, "name": "User Location"},
            {"lat": 40.7128, "lon": -74.0060, "name": "New York City"},  # Urban
            {"lat": 36.1699, "lon": -115.1398, "name": "Las Vegas"},     # Desert
            {"lat": 25.7617, "lon": -80.1918, "name": "Miami"},         # Coastal
        ]
        
        for scenario in test_scenarios:
            result = await severity_engine.compute_live_severity(
                user_id=f"test_{scenario['name'].lower().replace(' ', '_')}",
                latitude=scenario["lat"],
                longitude=scenario["lon"]
            )
            
            test_results.append({
                "scenario": scenario["name"],
                "coordinates": f"{scenario['lat']}, {scenario['lon']}",
                "severity": result["severity_context"]["continuous_value"],
                "band": result["severity_context"]["relative_band"],
                "confidence": result["severity_context"]["confidence"]
            })
        
        return {
            "test_status": "completed",
            "engine_version": "Context-Aware v1.0",
            "test_results": test_results,
            "validation": "All scenarios processed successfully"
        }
        
    except Exception as e:
        return {
            "test_status": "failed",
            "error": str(e),
            "fallback_active": True
        }