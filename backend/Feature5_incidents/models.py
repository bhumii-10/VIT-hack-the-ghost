from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IncidentCreate(BaseModel):
    incident_type: str
    latitude: float
    longitude: float
    severity_level: Optional[int] = None
    priority_score: Optional[int] = None
    flood_risk_percentage: Optional[float] = None
    current_state: Optional[str] = "Monitoring"
    network_status: Optional[str] = "Online"
    satellite_sos_required: Optional[bool] = False

class IncidentUpdate(BaseModel):
    current_state: Optional[str] = None
    network_status: Optional[str] = None
    satellite_sos_required: Optional[bool] = None
    severity_level: Optional[int] = None
    priority_score: Optional[int] = None

class IncidentAcknowledge(BaseModel):
    admin_acknowledged: bool

class IncidentResponse(BaseModel):
    incident_id: str
    incident_type: str
    latitude: float
    longitude: float
    reported_at: datetime
    severity_level: Optional[int]
    priority_score: Optional[int]
    flood_risk_percentage: Optional[float]
    current_state: str
    network_status: str
    satellite_sos_required: bool
    admin_acknowledged: bool
    acknowledged_at: Optional[datetime]
    created_at: datetime
