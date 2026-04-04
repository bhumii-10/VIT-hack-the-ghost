"""
Pydantic models for AI-Assisted Resource Recommendation
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ResourceMetrics(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    distance_score: float  # 0-1, lower is better
    response_time_score: float  # 0-1, lower is better
    availability_score: float  # 0-1, higher is better
    capacity_score: float  # 0-1, higher is better
    idle_duration_score: float  # 0-1, higher is better
    overall_suitability: float  # 0-1, higher is better

class ResourceRecommendation(BaseModel):
    resource_id: str
    resource_name: str
    resource_type: str
    rank: int
    confidence: float  # 0-1
    explanation: str
    metrics: ResourceMetrics
    latitude: float
    longitude: float
    capacity: int
    availability_status: str

class RecommendationRequest(BaseModel):
    incident_id: str
    max_recommendations: Optional[int] = 5

class RecommendationResponse(BaseModel):
    incident_id: str
    incident_type: str
    incident_location: dict
    recommendations: List[ResourceRecommendation]
    total_available_resources: int
    processing_time_ms: int
    note: str = "AI-assisted recommendation. Human approval required."

class RecommendationAudit(BaseModel):
    incident_id: str
    resource_id: str
    rank: int
    reasoning: str
    confidence: float
    approved_by_admin: Optional[str] = None
    admin_action: Optional[str] = None  # approved, rejected, ignored
    timestamp: datetime

class ChatMessage(BaseModel):
    message: str
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    confidence: float
    suggestions: Optional[List[str]] = None