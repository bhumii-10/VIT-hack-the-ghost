"""
AI Disaster Intelligence Router
FastAPI endpoints for the AI-powered disaster intelligence system
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple
import asyncio
from datetime import datetime
import json
import logging

from .ai_disaster_intelligence import disaster_intelligence, DisasterType, AlertLevel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Disaster Intelligence"])

class UserIncidentReport(BaseModel):
    incident_id: str
    incident_type: str
    latitude: float
    longitude: float
    description: str
    reported_at: str
    user_id: str
    network_status: Optional[str] = "unknown"
    images: Optional[List[str]] = []

class RegionMonitorRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 50.0

class ContinuousMonitoringRequest(BaseModel):
    regions: List[Tuple[float, float, float]]  # (lat, lon, radius_km)

@router.post("/ai-disaster/ingest/user-report")
async def ingest_user_report(report: UserIncidentReport):
    """
    Ingest a user-reported incident into the AI disaster intelligence system
    """
    try:
        # Convert to dict for processing
        incident_data = report.dict()
        
        # Process the user report
        event = disaster_intelligence.ingest_user_report(incident_data)
        
        # Immediately assess risk for the incident location
        risk_assessment = disaster_intelligence.assess_risk(
            report.latitude, 
            report.longitude, 
            radius_km=25.0  # Smaller radius for user reports
        )
        
        # Check if alert should be triggered
        should_alert = disaster_intelligence.should_trigger_alert(risk_assessment)
        
        response = {
            "success": True,
            "event_id": event.event_id,
            "processed_at": datetime.now().isoformat(),
            "risk_assessment": {
                "risk_percentage": risk_assessment.risk_percentage,
                "severity_level": risk_assessment.severity_level,
                "alert_level": risk_assessment.alert_level.value,
                "confidence": risk_assessment.confidence
            },
            "alert_triggered": should_alert
        }
        
        # Generate alert if needed
        if should_alert:
            alert = disaster_intelligence.generate_verified_alert(risk_assessment)
            response["alert"] = alert
            logger.warning(f"Alert triggered for user report: {report.incident_id}")
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to process user report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process report: {str(e)}")

@router.post("/ai-disaster/assess-risk")
async def assess_regional_risk(request: RegionMonitorRequest):
    """
    Assess disaster risk for a specific region
    """
    try:
        risk_assessment = disaster_intelligence.assess_risk(
            request.latitude,
            request.longitude,
            request.radius_km
        )
        
        return {
            "region": {
                "latitude": request.latitude,
                "longitude": request.longitude,
                "radius_km": request.radius_km
            },
            "assessment": {
                "disaster_type": risk_assessment.disaster_type.value,
                "risk_percentage": risk_assessment.risk_percentage,
                "severity_level": risk_assessment.severity_level,
                "alert_level": risk_assessment.alert_level.value,
                "confidence": risk_assessment.confidence,
                "estimated_population_at_risk": risk_assessment.estimated_population_at_risk,
                "recommended_actions": risk_assessment.recommended_actions
            },
            "trend_analysis": {
                "direction": risk_assessment.trend_analysis.trend_direction,
                "intensity_change": risk_assessment.trend_analysis.intensity_change,
                "frequency_change": risk_assessment.trend_analysis.frequency_change,
                "spatial_clustering": risk_assessment.trend_analysis.spatial_clustering,
                "temporal_clustering": risk_assessment.trend_analysis.temporal_clustering,
                "confidence": risk_assessment.trend_analysis.confidence
            },
            "assessed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

@router.get("/ai-disaster/analyze-trends/{latitude}/{longitude}")
async def analyze_regional_trends(
    latitude: float, 
    longitude: float, 
    radius_km: float = 50.0
):
    """
    Analyze disaster trends for a specific region
    """
    try:
        trend_analysis = disaster_intelligence.analyze_trends(latitude, longitude, radius_km)
        
        return {
            "region": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km
            },
            "trends": {
                "direction": trend_analysis.trend_direction,
                "intensity_change": trend_analysis.intensity_change,
                "frequency_change": trend_analysis.frequency_change,
                "spatial_clustering": trend_analysis.spatial_clustering,
                "temporal_clustering": trend_analysis.temporal_clustering,
                "confidence": trend_analysis.confidence
            },
            "analyzed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {str(e)}")

@router.post("/ai-disaster/ingest/official-data")
async def ingest_official_data():
    """
    Manually trigger ingestion of official disaster data sources
    """
    try:
        events = await disaster_intelligence.ingest_official_data()
        
        return {
            "success": True,
            "events_ingested": len(events),
            "sources": list(disaster_intelligence.data_sources.keys()),
            "ingested_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Official data ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Data ingestion failed: {str(e)}")

@router.post("/ai-disaster/continuous-monitoring")
async def start_continuous_monitoring(
    request: ContinuousMonitoringRequest,
    background_tasks: BackgroundTasks
):
    """
    Start continuous monitoring for multiple regions
    """
    try:
        # Run continuous monitoring in background
        alerts = await disaster_intelligence.continuous_monitoring(request.regions)
        
        return {
            "success": True,
            "regions_monitored": len(request.regions),
            "alerts_generated": len(alerts),
            "alerts": alerts,
            "monitoring_started_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Continuous monitoring failed: {e}")
        raise HTTPException(status_code=500, detail=f"Monitoring failed: {str(e)}")

@router.get("/ai-disaster/system-status")
async def get_system_status():
    """
    Get current system status and statistics
    """
    try:
        status = disaster_intelligence.get_system_status()
        return status
        
    except Exception as e:
        logger.error(f"System status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.get("/ai-disaster/active-alerts")
async def get_active_alerts():
    """
    Get all currently active alerts
    """
    try:
        # This would typically query a database of active alerts
        # For now, return system status with alert information
        status = disaster_intelligence.get_system_status()
        
        return {
            "active_alerts": [],  # Would be populated from alert database
            "system_status": status['status'],
            "total_events_24h": status['total_events_24h'],
            "last_updated": status['last_updated']
        }
        
    except Exception as e:
        logger.error(f"Active alerts retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Alert retrieval failed: {str(e)}")

@router.get("/ai-disaster/disaster-types")
async def get_supported_disaster_types():
    """
    Get list of supported disaster types
    """
    return {
        "disaster_types": [dtype.value for dtype in DisasterType],
        "alert_levels": [level.value for level in AlertLevel]
    }

@router.post("/ai-disaster/simulate-event")
async def simulate_disaster_event(
    disaster_type: str,
    latitude: float,
    longitude: float,
    magnitude: float = 3.0,
    description: str = "Simulated disaster event for testing"
):
    """
    Simulate a disaster event for testing purposes
    """
    try:
        # Create simulated incident data
        incident_data = {
            "incident_id": f"sim_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "incident_type": disaster_type,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "reported_at": datetime.now().isoformat(),
            "user_id": "simulation_system",
            "network_status": "Online",
            "images": []
        }
        
        # Override magnitude estimation for simulation
        event = disaster_intelligence.ingest_user_report(incident_data)
        event.magnitude = magnitude
        event.confidence = 0.9
        
        # Assess risk
        risk_assessment = disaster_intelligence.assess_risk(latitude, longitude, 50.0)
        
        # Check if alert should be triggered
        should_alert = disaster_intelligence.should_trigger_alert(risk_assessment)
        
        response = {
            "simulation": True,
            "event_id": event.event_id,
            "disaster_type": disaster_type,
            "magnitude": magnitude,
            "risk_assessment": {
                "risk_percentage": risk_assessment.risk_percentage,
                "severity_level": risk_assessment.severity_level,
                "alert_level": risk_assessment.alert_level.value,
                "confidence": risk_assessment.confidence
            },
            "alert_triggered": should_alert,
            "simulated_at": datetime.now().isoformat()
        }
        
        if should_alert:
            alert = disaster_intelligence.generate_verified_alert(risk_assessment)
            response["alert"] = alert
        
        return response
        
    except Exception as e:
        logger.error(f"Event simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.get("/ai-disaster/health")
async def health_check():
    """
    Health check endpoint for the AI disaster intelligence system
    """
    try:
        status = disaster_intelligence.get_system_status()
        
        return {
            "status": "healthy",
            "ai_engine": "operational",
            "data_sources": status['data_sources'],
            "last_check": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "last_check": datetime.now().isoformat()
        }