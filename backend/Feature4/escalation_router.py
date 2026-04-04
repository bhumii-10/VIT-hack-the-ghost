from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Import the escalation engine
try:
    from .hackvision_ml_escalation_transition_engine import escalation_engine
except ImportError:
    from hackvision_ml_escalation_transition_engine import escalation_engine

router = APIRouter()

class EscalationInput(BaseModel):
    flood_risk_percentage: float
    severity_level: str
    risk_trend: Optional[str] = "stable"

@router.post("/escalation-assessment")
async def get_escalation_assessment(data: EscalationInput):
    """
    Analyzes flood risk and severity to determine escalation state.
    """
    try:
        result = escalation_engine(
            flood_risk_percentage=data.flood_risk_percentage,
            severity_level=data.severity_level,
            risk_trend=data.risk_trend
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/escalation-states")
async def get_available_states():
    """
    Returns available escalation states.
    """
    return {
        "states": ["NORMAL", "WATCH", "PREPAREDNESS", "CRISIS"],
        "description": {
            "NORMAL": "No immediate risk",
            "WATCH": "Monitor situation",
            "PREPAREDNESS": "Prepare resources", 
            "CRISIS": "Active emergency"
        }
    }