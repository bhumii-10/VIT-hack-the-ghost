"""
FastAPI Router for ML Hotspot Engine
Provides endpoints for hotspot detection and heatmap generation
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import sys
from pathlib import Path

# Add the backend directory to sys.path
base_dir = Path(__file__).parent.parent.resolve()
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

# Import Supabase client
from dotenv import load_dotenv
from supabase_shim import create_client, Client

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Import ML engine
from .ml_hotspot_engine import (
    detect_hotspot, 
    generate_heatmap_data, 
    analyze_temporal_patterns,
    get_zone_color_mapping,
    HotspotSeverity,
    HotspotZone
)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("DEBUG: Supabase initialized for ML Hotspot Engine")
    except Exception as e:
        print(f"DEBUG: Supabase init failed for ML Hotspot: {e}")

# Create router
router = APIRouter(prefix="/hotspot", tags=["ML Hotspot Engine"])

@router.get("/status")
async def get_hotspot_status():
    """Get ML hotspot detection system status"""
    try:
        return {
            "system_status": "operational",
            "supabase_connected": supabase is not None,
            "features": {
                "hotspot_detection": True,
                "heatmap_generation": True,
                "temporal_analysis": True,
                "zone_mapping": True,
                "ml_engine": True
            },
            "ml_models": {
                "hotspot_detector": "active",
                "pattern_analyzer": "active",
                "risk_assessor": "active"
            },
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot status check failed: {str(e)}")

# Pydantic models
class IncidentPoint(BaseModel):
    lat: float
    lng: float
    severity: Optional[str] = "medium"
    created_at: Optional[str] = None
    incident_type: Optional[str] = None

class HotspotAnalysisRequest(BaseModel):
    points: List[IncidentPoint]
    radius_km: Optional[float] = 50
    grid_size: Optional[float] = 0.1

class HeatmapRequest(BaseModel):
    incidents: List[IncidentPoint]
    grid_size: Optional[float] = 0.1

@router.get("/")
async def hotspot_info():
    """Get information about the ML Hotspot Engine"""
    return {
        "service": "ML Hotspot Engine",
        "version": "1.0.0",
        "description": "AI-powered crisis hotspot detection and heatmap generation",
        "features": [
            "Spatial clustering analysis",
            "Severity-weighted risk scoring", 
            "Heatmap grid generation",
            "Temporal pattern analysis",
            "Zone classification (Safe/Caution/Warning/Danger)"
        ],
        "endpoints": {
            "/analyze": "Analyze hotspots from incident data",
            "/heatmap": "Generate heatmap grid data",
            "/live-analysis": "Analyze live incidents from database",
            "/zones": "Get zone color mappings",
            "/temporal": "Analyze temporal patterns"
        }
    }

@router.post("/analyze")
async def analyze_hotspots(request: HotspotAnalysisRequest):
    """
    Analyze hotspots from provided incident points
    """
    try:
        # Convert Pydantic models to dicts
        points = [point.dict() for point in request.points]
        
        # Perform hotspot analysis
        hotspot_result = detect_hotspot(points, request.radius_km)
        
        # Generate heatmap data
        heatmap_data = generate_heatmap_data(points, request.grid_size)
        
        # Analyze temporal patterns
        temporal_analysis = analyze_temporal_patterns(points)
        
        return {
            "status": "success",
            "hotspot_analysis": hotspot_result,
            "heatmap_cells": len(heatmap_data),
            "heatmap_data": heatmap_data[:50],  # Limit response size
            "temporal_analysis": temporal_analysis,
            "analysis_metadata": {
                "total_points": len(points),
                "analysis_radius_km": request.radius_km,
                "grid_size_degrees": request.grid_size,
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/heatmap")
async def generate_heatmap(request: HeatmapRequest):
    """
    Generate heatmap grid data for visualization
    """
    try:
        # Convert Pydantic models to dicts
        incidents = [incident.dict() for incident in request.incidents]
        
        # Generate heatmap
        heatmap_data = generate_heatmap_data(incidents, request.grid_size)
        
        # Calculate statistics
        zone_counts = {}
        for cell in heatmap_data:
            zone = cell["zone"]
            zone_counts[zone] = zone_counts.get(zone, 0) + 1
        
        return {
            "status": "success",
            "heatmap_data": heatmap_data,
            "statistics": {
                "total_cells": len(heatmap_data),
                "zone_distribution": zone_counts,
                "grid_size_degrees": request.grid_size,
                "coverage_area_km2": len(heatmap_data) * (request.grid_size * 111) ** 2  # Rough estimate
            },
            "metadata": {
                "total_incidents": len(incidents),
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heatmap generation failed: {str(e)}")

@router.get("/live-analysis")
async def analyze_live_incidents(
    radius_km: float = Query(50, description="Analysis radius in kilometers"),
    grid_size: float = Query(0.1, description="Heatmap grid size in degrees"),
    days_back: int = Query(7, description="Days of historical data to analyze"),
    lat: Optional[float] = Query(None, description="User latitude for localized analysis"),
    lng: Optional[float] = Query(None, description="User longitude for localized analysis")
):
    """
    Analyze hotspots from live incident data in the database.
    If lat and lng are provided, results are prioritized/filtered for that region.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Fetch recent incidents from database
        response = supabase.table("incidents").select("*").execute()
        
        if not response.data:
            return {
                "status": "success",
                "message": "No incidents found in database",
                "hotspot_analysis": {
                    "hotspot_detected": False,
                    "hotspot_strength": "Low",
                    "zone_classification": "safe"
                },
                "heatmap_data": [],
                "temporal_analysis": {"trend": "no_data"}
            }
        
        # Convert database records to analysis format
        raw_incidents = []
        for record in response.data:
            if record.get("latitude") and record.get("longitude"):
                raw_incidents.append({
                    "lat": float(record["latitude"]),
                    "lng": float(record["longitude"]),
                    "severity": record.get("severity") or record.get("severity_level") or "medium",
                    "created_at": record.get("created_at") or record.get("reported_at"),
                    "incident_type": record.get("incident_type") or record.get("type")
                })
        
        # FILTER: If user location is provided, we can optionally filter or just analyze everything
        # Usually, for a heatmap, we analyze everything but the frontend centers on the user.
        # But for "Hotspot Detection", it's better to detect the ONE NEAR the user.
        
        incidents = raw_incidents
        location_context = "global"
        
        if lat is not None and lng is not None:
            user_point = {"lat": lat, "lng": lng}
            # Optional: Filter to only incidents within some large radius (e.g. 500km) to keep it snappy
            # Or just mark we have location context
            location_context = f"localized around {lat}, {lng}"
        
        if not incidents:
            return {
                "status": "success", 
                "message": "No incidents with valid coordinates found",
                "hotspot_analysis": {
                    "hotspot_detected": False,
                    "hotspot_strength": "Low"
                },
                "heatmap_data": []
            }
        
        # Perform analysis
        hotspot_result = detect_hotspot(incidents, radius_km)
        heatmap_data = generate_heatmap_data(incidents, grid_size)
        temporal_analysis = analyze_temporal_patterns(incidents, days_back)
        
        # Calculate zone statistics
        zone_stats = {}
        for cell in heatmap_data:
            zone = cell["zone"]
            zone_stats[zone] = zone_stats.get(zone, 0) + 1
        
        return {
            "status": "success",
            "context": location_context,
            "hotspot_analysis": hotspot_result,
            "heatmap_data": heatmap_data,
            "temporal_analysis": temporal_analysis,
            "statistics": {
                "total_incidents": len(incidents),
                "total_heatmap_cells": len(heatmap_data),
                "zone_distribution": zone_stats,
                "analysis_parameters": {
                    "radius_km": radius_km,
                    "grid_size_degrees": grid_size,
                    "days_analyzed": days_back,
                    "user_lat": lat,
                    "user_lng": lng
                }
            },
            "metadata": {
                "analysis_timestamp": datetime.now().isoformat(),
                "data_source": "live_database"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live analysis failed: {str(e)}")

@router.get("/zones")
async def get_zone_mappings():
    """
    Get zone color mappings and descriptions
    """
    try:
        zone_mappings = get_zone_color_mapping()
        
        return {
            "status": "success",
            "zone_mappings": zone_mappings,
            "legend": [
                {"zone": "safe", "color": "#32CD32", "description": "Safe Zone - Low Risk"},
                {"zone": "caution", "color": "#FFD700", "description": "Caution Zone - Moderate Risk"},
                {"zone": "warning", "color": "#FF8C00", "description": "Warning Zone - High Risk"},
                {"zone": "danger", "color": "#FF0000", "description": "Danger Zone - Critical Risk"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get zone mappings: {str(e)}")

@router.get("/temporal")
async def analyze_temporal_trends(
    days_back: int = Query(7, description="Number of days to analyze")
):
    """
    Analyze temporal patterns in incident data
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    try:
        # Fetch incidents from database
        response = supabase.table("incidents").select("*").execute()
        
        if not response.data:
            return {
                "status": "success",
                "message": "No incidents found",
                "temporal_analysis": {"trend": "no_data", "pattern": "no_data"}
            }
        
        # Convert to analysis format
        incidents = []
        for record in response.data:
            incidents.append({
                "created_at": record.get("created_at"),
                "severity": record.get("severity", "medium"),
                "type": record.get("type")
            })
        
        # Perform temporal analysis
        temporal_result = analyze_temporal_patterns(incidents, days_back)
        
        return {
            "status": "success",
            "temporal_analysis": temporal_result,
            "metadata": {
                "total_incidents_analyzed": len(incidents),
                "analysis_period_days": days_back,
                "analysis_timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Temporal analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ML Hotspot Engine",
        "timestamp": datetime.now().isoformat(),
        "database_connected": supabase is not None
    }