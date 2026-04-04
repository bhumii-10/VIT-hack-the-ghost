"""
API endpoints for AI-Assisted Resource Recommendation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
import time
import logging
from datetime import datetime

from ..models.recommendation import (
    RecommendationRequest, 
    RecommendationResponse, 
    ResourceRecommendation,
    ResourceMetrics,
    RecommendationAudit,
    ChatMessage,
    ChatResponse
)
from ..services.recommendation_engine import RecommendationEngine
from ..ai.explanation_agent import ExplanationAgent
from ..db.supabase_client import RecommendationDatabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Resource Recommendation"])

# Initialize services
recommendation_engine = RecommendationEngine()
explanation_agent = ExplanationAgent()

def get_db():
    return RecommendationDatabase()

@router.get("/recommend/status")
async def get_recommendation_status():
    """Get AI recommendation system status"""
    try:
        db = get_db()
        stats = db.get_system_stats()
        
        return {
            "system_status": "operational",
            "features": {
                "resource_ranking": True,
                "ai_explanations": explanation_agent.model is not None,
                "audit_logging": True,
                "real_time_analysis": True
            },
            "statistics": stats,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.post("/recommend/analyze", response_model=RecommendationResponse)
async def analyze_incident_resources(request: RecommendationRequest):
    """
    Analyze and recommend resources for an incident
    DECISION-SUPPORT ONLY - No automatic dispatch
    """
    start_time = time.time()
    
    try:
        db = get_db()
        
        # Get incident details
        incident = db.get_incident(request.incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Get available resources
        resources = db.get_available_resources()
        if not resources:
            logger.warning(f"No available resources for incident {request.incident_id}")
            return RecommendationResponse(
                incident_id=request.incident_id,
                incident_type=incident.get('incident_type', 'Unknown'),
                incident_location={
                    'latitude': incident.get('latitude', 0),
                    'longitude': incident.get('longitude', 0)
                },
                recommendations=[],
                total_available_resources=0,
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
        
        # Rank resources using recommendation engine
        ranked_resources = recommendation_engine.rank_resources(incident, resources)
        
        # Limit to requested number of recommendations
        max_recommendations = min(request.max_recommendations, len(ranked_resources))
        top_resources = ranked_resources[:max_recommendations]
        
        # Generate AI explanations for top resources
        recommendations = []
        for resource in top_resources:
            try:
                explanation, confidence = explanation_agent.generate_explanation(
                    resource, incident, resource['rank']
                )
                
                # Create metrics object
                metrics = ResourceMetrics(
                    resource_id=resource.get('resource_id', ''),
                    resource_name=resource.get('name', ''),
                    resource_type=resource.get('resource_type', ''),
                    distance_score=resource.get('distance_score', 0),
                    response_time_score=resource.get('response_time_score', 0),
                    availability_score=resource.get('availability_score', 1),
                    capacity_score=resource.get('capacity_score', 0),
                    idle_duration_score=resource.get('idle_duration_score', 0),
                    overall_suitability=resource.get('overall_suitability', 0)
                )
                
                # Create recommendation
                recommendation = ResourceRecommendation(
                    resource_id=resource.get('resource_id', ''),
                    resource_name=resource.get('name', ''),
                    resource_type=resource.get('resource_type', ''),
                    rank=resource['rank'],
                    confidence=confidence,
                    explanation=explanation,
                    metrics=metrics,
                    latitude=resource.get('latitude', 0),
                    longitude=resource.get('longitude', 0),
                    capacity=resource.get('capacity', 1),
                    availability_status=resource.get('availability_status', 'available')
                )
                
                recommendations.append(recommendation)
                
                # Log recommendation for audit
                audit_data = {
                    'incident_id': request.incident_id,
                    'resource_id': resource.get('resource_id', ''),
                    'rank': resource['rank'],
                    'reasoning': explanation,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat()
                }
                
                db.log_recommendation(audit_data)
                
            except Exception as e:
                logger.error(f"Error processing resource {resource.get('resource_id')}: {e}")
                continue
        
        processing_time = int((time.time() - start_time) * 1000)
        
        response = RecommendationResponse(
            incident_id=request.incident_id,
            incident_type=incident.get('incident_type', 'Unknown'),
            incident_location={
                'latitude': incident.get('latitude', 0),
                'longitude': incident.get('longitude', 0)
            },
            recommendations=recommendations,
            total_available_resources=len(resources),
            processing_time_ms=processing_time
        )
        
        logger.info(f"Generated {len(recommendations)} recommendations for incident {request.incident_id} in {processing_time}ms")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recommendation analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/recommend/approve/{incident_id}/{resource_id}")
async def approve_recommendation(incident_id: str, resource_id: str, admin_id: str):
    """
    Admin approves a resource recommendation
    Updates resource status and logs approval
    """
    try:
        db = get_db()
        
        # Update resource status to busy
        success = db.update_resource_status(resource_id, 'busy')
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update resource status")
        
        # Log admin approval
        audit_data = {
            'incident_id': incident_id,
            'resource_id': resource_id,
            'rank': 0,  # Will be updated with actual rank
            'reasoning': f'Approved by admin {admin_id}',
            'confidence': 1.0,
            'approved_by_admin': admin_id,
            'admin_action': 'approved',
            'timestamp': datetime.now().isoformat()
        }
        
        db.log_recommendation(audit_data)
        
        logger.info(f"Admin {admin_id} approved resource {resource_id} for incident {incident_id}")
        
        return {
            "status": "approved",
            "message": f"Resource {resource_id} approved and allocated to incident {incident_id}",
            "resource_status": "busy",
            "approved_by": admin_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approval error: {e}")
        raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")

@router.post("/recommend/reject/{incident_id}/{resource_id}")
async def reject_recommendation(incident_id: str, resource_id: str, admin_id: str, reason: str = "No reason provided"):
    """
    Admin rejects a resource recommendation
    Logs rejection for audit
    """
    try:
        db = get_db()
        
        # Log admin rejection
        audit_data = {
            'incident_id': incident_id,
            'resource_id': resource_id,
            'rank': 0,
            'reasoning': f'Rejected by admin {admin_id}: {reason}',
            'confidence': 0.0,
            'approved_by_admin': admin_id,
            'admin_action': 'rejected',
            'timestamp': datetime.now().isoformat()
        }
        
        db.log_recommendation(audit_data)
        
        logger.info(f"Admin {admin_id} rejected resource {resource_id} for incident {incident_id}: {reason}")
        
        return {
            "status": "rejected",
            "message": f"Resource {resource_id} rejected for incident {incident_id}",
            "reason": reason,
            "rejected_by": admin_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Rejection error: {e}")
        raise HTTPException(status_code=500, detail=f"Rejection failed: {str(e)}")

@router.get("/recommend/history/{incident_id}")
async def get_recommendation_history(incident_id: str):
    """Get recommendation history for an incident"""
    try:
        db = get_db()
        history = db.get_recommendation_history(incident_id)
        
        return {
            "incident_id": incident_id,
            "history": history,
            "total_recommendations": len(history),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"History fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"History fetch failed: {str(e)}")

@router.post("/recommend/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    """
    Chat with AI assistant for general emergency guidance
    """
    try:
        response_text, confidence, suggestions = explanation_agent.generate_chat_response(
            message.message, 
            message.context
        )
        
        return ChatResponse(
            response=response_text,
            confidence=confidence,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@router.get("/recommend/analytics")
async def get_recommendation_analytics():
    """Get analytics for recommendation system"""
    try:
        db = get_db()
        stats = db.get_system_stats()
        
        # Additional analytics
        total_resources = stats.get('total_resources', 0)
        available_resources = stats.get('available_resources', 0)
        
        # Safe division for utilization rate
        if total_resources > 0:
            utilization_rate = f"{((total_resources - available_resources) / total_resources * 100):.1f}%"
        else:
            utilization_rate = "0.0%"
        
        analytics = {
            "system_performance": {
                "total_resources": total_resources,
                "available_resources": available_resources,
                "utilization_rate": utilization_rate,
                "recent_recommendations": stats.get('recent_recommendations', 0)
            },
            "ai_capabilities": {
                "explanation_engine": explanation_agent.model is not None,
                "chat_assistant": True,
                "confidence_scoring": True,
                "audit_logging": True
            },
            "features": {
                "relative_ranking": True,
                "contextual_analysis": True,
                "human_in_the_loop": True,
                "real_time_processing": True
            },
            "last_updated": datetime.now().isoformat()
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")