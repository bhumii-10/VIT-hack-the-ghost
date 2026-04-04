"""
Enhanced Escalation Router - Integrates with Feature 3 Live Severity Data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
import asyncio
import sys
import os
from pathlib import Path

# Add Feature3 to path for imports
current_dir = Path(__file__).resolve().parent
feature3_dir = current_dir.parent / "Feature3"
sys.path.insert(0, str(feature3_dir))

try:
    from context_severity_engine import severity_engine
    from .hackvision_ml_escalation_transition_engine import escalation_engine
except ImportError as e:
    print(f"Import error in enhanced escalation router: {e}")
    # Fallback imports
    try:
        from hackvision_ml_escalation_transition_engine import escalation_engine
    except ImportError:
        escalation_engine = None

router = APIRouter(tags=["Enhanced Escalation Management"])

class EscalationInput(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    flood_risk_percentage: Optional[float] = None
    manual_severity_override: Optional[str] = None

class AutoEscalationInput(BaseModel):
    user_id: str
    latitude: float
    longitude: float

@router.post("/escalation/auto-assess")
async def auto_escalation_assessment(data: AutoEscalationInput):
    """
    Automatically assess escalation state using live severity data from Feature 3.
    This endpoint fetches severity data automatically and determines escalation state.
    """
    try:
        # Fetch live severity data from Feature 3
        severity_result = await severity_engine.compute_live_severity(
            user_id=data.user_id,
            latitude=data.latitude,
            longitude=data.longitude
        )
        
        # Extract severity information
        severity_context = severity_result["severity_context"]
        continuous_value = severity_context["continuous_value"]
        relative_band = severity_context["relative_band"]
        confidence = severity_context["confidence"]
        trend = severity_context["trend"]
        
        # Convert continuous value to flood risk percentage for escalation engine
        flood_risk_percentage = continuous_value * 100
        
        # Map relative band to severity level
        severity_mapping = {
            "minimal": "Low",
            "low": "Low", 
            "elevated": "Medium",
            "high": "High",
            "critical": "High"
        }
        severity_level = severity_mapping.get(relative_band, "Medium")
        
        # Run escalation assessment
        escalation_result = escalation_engine(
            flood_risk_percentage=flood_risk_percentage,
            severity_level=severity_level,
            risk_trend=trend
        )
        
        # Enhanced escalation logic based on live data
        enhanced_state = enhance_escalation_state(
            escalation_result["current_state"],
            severity_context,
            confidence
        )
        
        return {
            "escalation_assessment": {
                "current_state": enhanced_state["state"],
                "reason": enhanced_state["reason"],
                "confidence": confidence,
                "auto_generated": True
            },
            "severity_data": {
                "continuous_risk": continuous_value,
                "risk_band": relative_band,
                "trend": trend,
                "location_basis": severity_result["location_basis"]
            },
            "escalation_factors": {
                "flood_risk_percentage": flood_risk_percentage,
                "incident_severity": severity_level,
                "environmental_factors": severity_result.get("contributing_factors", {}),
                "timestamp": severity_result["timestamp"]
            },
            "recommendations": generate_recommendations(enhanced_state["state"], severity_context)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-escalation assessment failed: {str(e)}")

@router.post("/escalation/manual-assess")
async def manual_escalation_assessment(data: EscalationInput):
    """
    Manual escalation assessment with optional severity override.
    Combines live data with manual inputs.
    """
    try:
        # Get live severity data
        severity_result = await severity_engine.compute_live_severity(
            user_id=data.user_id,
            latitude=data.latitude,
            longitude=data.longitude
        )
        
        severity_context = severity_result["severity_context"]
        
        # Use manual override or live data
        if data.manual_severity_override:
            severity_level = data.manual_severity_override
        else:
            severity_mapping = {
                "minimal": "Low",
                "low": "Low",
                "elevated": "Medium", 
                "high": "High",
                "critical": "High"
            }
            severity_level = severity_mapping.get(severity_context["relative_band"], "Medium")
        
        # Use manual flood risk or derive from severity
        if data.flood_risk_percentage is not None:
            flood_risk = data.flood_risk_percentage
        else:
            flood_risk = severity_context["continuous_value"] * 100
        
        # Run escalation assessment
        escalation_result = escalation_engine(
            flood_risk_percentage=flood_risk,
            severity_level=severity_level,
            risk_trend=severity_context["trend"]
        )
        
        return {
            "escalation_assessment": {
                "current_state": escalation_result["current_state"],
                "reason": escalation_result["reason"],
                "manual_override_used": data.manual_severity_override is not None,
                "auto_generated": False
            },
            "input_data": {
                "flood_risk_percentage": flood_risk,
                "severity_level": severity_level,
                "live_severity_band": severity_context["relative_band"],
                "live_continuous_value": severity_context["continuous_value"]
            },
            "timestamp": severity_result["timestamp"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual escalation assessment failed: {str(e)}")

@router.get("/escalation/regional/{lat}/{lon}")
async def regional_escalation_status(lat: float, lon: float, radius: float = 10.0):
    """
    Get regional escalation status using severity heatmap data.
    """
    try:
        # Get regional severity data from Feature 3
        regional_data = await get_regional_severity_data(lat, lon, radius)
        
        # Analyze escalation states across the region
        escalation_analysis = analyze_regional_escalation(regional_data)
        
        return {
            "region_center": {"latitude": lat, "longitude": lon},
            "radius_km": radius,
            "regional_escalation": escalation_analysis,
            "timestamp": regional_data.get("timestamp", "unknown")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regional escalation analysis failed: {str(e)}")

@router.get("/escalation/states")
async def get_escalation_states():
    """
    Get available escalation states with enhanced descriptions.
    """
    return {
        "states": ["NORMAL", "WATCH", "PREPAREDNESS", "CRISIS"],
        "descriptions": {
            "NORMAL": {
                "level": "Green",
                "description": "No immediate risk detected",
                "actions": ["Continue monitoring", "Maintain readiness"],
                "severity_range": "0-25%"
            },
            "WATCH": {
                "level": "Yellow", 
                "description": "Elevated risk - monitor situation closely",
                "actions": ["Increase monitoring", "Alert relevant teams", "Prepare resources"],
                "severity_range": "25-50%"
            },
            "PREPAREDNESS": {
                "level": "Orange",
                "description": "High risk - prepare for potential emergency",
                "actions": ["Deploy resources", "Activate response teams", "Issue public alerts"],
                "severity_range": "50-75%"
            },
            "CRISIS": {
                "level": "Red",
                "description": "Active emergency - immediate response required",
                "actions": ["Full emergency response", "Evacuate if necessary", "Coordinate with all agencies"],
                "severity_range": "75-100%"
            }
        },
        "integration": {
            "live_severity_engine": True,
            "auto_assessment": True,
            "manual_override": True,
            "regional_analysis": True
        }
    }

def enhance_escalation_state(base_state: str, severity_context: Dict, confidence: float) -> Dict:
    """
    Enhance escalation state based on additional context.
    """
    state = base_state
    reason = f"Base assessment: {base_state}"
    
    # Upgrade state if confidence is high and trend is increasing
    if confidence > 0.8 and severity_context.get("trend") == "increasing":
        if state == "NORMAL":
            state = "WATCH"
            reason = "Upgraded to WATCH due to increasing risk trend with high confidence"
        elif state == "WATCH":
            state = "PREPAREDNESS"
            reason = "Upgraded to PREPAREDNESS due to increasing risk trend with high confidence"
    
    # Downgrade if confidence is very low
    elif confidence < 0.3:
        if state == "CRISIS":
            state = "PREPAREDNESS"
            reason = "Downgraded from CRISIS due to low confidence in data"
        elif state == "PREPAREDNESS":
            state = "WATCH"
            reason = "Downgraded from PREPAREDNESS due to low confidence in data"
    
    return {"state": state, "reason": reason}

def generate_recommendations(escalation_state: str, severity_context: Dict) -> list:
    """
    Generate actionable recommendations based on escalation state.
    """
    recommendations = []
    
    if escalation_state == "NORMAL":
        recommendations = [
            "Continue routine monitoring",
            "Maintain standard readiness levels",
            "Review and update emergency plans"
        ]
    elif escalation_state == "WATCH":
        recommendations = [
            "Increase monitoring frequency",
            "Alert response teams to elevated status",
            "Prepare communication channels",
            "Review resource availability"
        ]
    elif escalation_state == "PREPAREDNESS":
        recommendations = [
            "Deploy monitoring equipment",
            "Activate response teams",
            "Issue public advisories",
            "Coordinate with emergency services",
            "Prepare evacuation routes if needed"
        ]
    elif escalation_state == "CRISIS":
        recommendations = [
            "Implement full emergency response",
            "Coordinate with all emergency agencies",
            "Issue immediate public warnings",
            "Consider evacuation orders",
            "Establish emergency command center"
        ]
    
    # Add context-specific recommendations
    if severity_context.get("trend") == "increasing":
        recommendations.append("Monitor trend closely - situation may escalate further")
    
    return recommendations

async def get_regional_severity_data(lat: float, lon: float, radius: float) -> Dict:
    """
    Get regional severity data for escalation analysis.
    """
    try:
        # This would integrate with the regional severity endpoint from Feature 3
        # For now, simulate the call
        grid_points = []
        step = 0.01
        
        for lat_offset in [-2*step, -step, 0, step, 2*step]:
            for lon_offset in [-2*step, -step, 0, step, 2*step]:
                grid_lat = lat + lat_offset
                grid_lon = lon + lon_offset
                
                severity_result = await severity_engine.compute_live_severity(
                    user_id="regional_escalation_scan",
                    latitude=grid_lat,
                    longitude=grid_lon
                )
                
                grid_points.append({
                    "latitude": grid_lat,
                    "longitude": grid_lon,
                    "severity": severity_result["severity_context"]["continuous_value"],
                    "band": severity_result["severity_context"]["relative_band"]
                })
        
        return {
            "grid_points": grid_points,
            "timestamp": severity_result["timestamp"]
        }
        
    except Exception as e:
        print(f"Regional severity data fetch error: {e}")
        return {"grid_points": [], "timestamp": "unknown"}

def analyze_regional_escalation(regional_data: Dict) -> Dict:
    """
    Analyze regional escalation based on severity grid data.
    """
    grid_points = regional_data.get("grid_points", [])
    
    if not grid_points:
        return {
            "overall_state": "UNKNOWN",
            "reason": "No regional data available",
            "hotspots": [],
            "statistics": {}
        }
    
    # Calculate escalation states for each point
    escalation_states = []
    for point in grid_points:
        severity = point["severity"]
        flood_risk = severity * 100
        
        if flood_risk < 20:
            state = "NORMAL"
        elif flood_risk < 40:
            state = "WATCH"
        elif flood_risk < 60:
            state = "PREPAREDNESS"
        else:
            state = "CRISIS"
            
        escalation_states.append(state)
        point["escalation_state"] = state
    
    # Determine overall regional state
    state_counts = {
        "NORMAL": escalation_states.count("NORMAL"),
        "WATCH": escalation_states.count("WATCH"),
        "PREPAREDNESS": escalation_states.count("PREPAREDNESS"),
        "CRISIS": escalation_states.count("CRISIS")
    }
    
    # Overall state is the highest priority state with significant presence
    if state_counts["CRISIS"] > 0:
        overall_state = "CRISIS"
        reason = f"Crisis conditions detected in {state_counts['CRISIS']} locations"
    elif state_counts["PREPAREDNESS"] >= 2:
        overall_state = "PREPAREDNESS"
        reason = f"High risk conditions in {state_counts['PREPAREDNESS']} locations"
    elif state_counts["WATCH"] >= 3:
        overall_state = "WATCH"
        reason = f"Elevated risk in {state_counts['WATCH']} locations"
    else:
        overall_state = "NORMAL"
        reason = "No significant risks detected in region"
    
    # Identify hotspots (CRISIS or PREPAREDNESS areas)
    hotspots = [
        point for point in grid_points 
        if point["escalation_state"] in ["CRISIS", "PREPAREDNESS"]
    ]
    
    return {
        "overall_state": overall_state,
        "reason": reason,
        "state_distribution": state_counts,
        "hotspots": hotspots,
        "total_points_analyzed": len(grid_points),
        "statistics": {
            "max_severity": max([p["severity"] for p in grid_points]),
            "avg_severity": sum([p["severity"] for p in grid_points]) / len(grid_points),
            "crisis_percentage": (state_counts["CRISIS"] / len(grid_points)) * 100
        }
    }