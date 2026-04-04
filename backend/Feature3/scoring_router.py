from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

# Import the severity engine from the renamed file
try:
    from .severity_engine import severity_engine as risk_engine
except ImportError:
    # Handle cases where the script might be run in a different context
    from severity_engine import severity_engine as risk_engine

router = APIRouter()

class RiskInput(BaseModel):
    incident_type: str
    description: str
    location_zone: str
    time_of_day: str
    rainfall_level: str
    zone_history: str

@router.post("/risk-assessment")
async def get_risk_assessment(data: RiskInput):
    """
    Analyzes incident data to produce a risk and severity assessment.
    """
    try:
        # The risk_engine expects a dictionary, so we convert the Pydantic model
        result = risk_engine(data.dict())
        return result
    except Exception as e:
        # If anything goes wrong in the risk engine, return a server error
        raise HTTPException(status_code=500, detail=str(e))