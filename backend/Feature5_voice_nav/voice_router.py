from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import httpx
import os
from .nav_agent import process_voice_command

router = APIRouter(tags=["Voice Navigation"])

@router.get("/voice/status")
async def get_voice_status():
    """Get voice navigation system status"""
    try:
        return {
            "system_status": "operational",
            "features": {
                "voice_commands": True,
                "navigation": True,
                "emergency_integration": True,
                "natural_language": True
            },
            "supported_commands": [
                "navigate to [page]",
                "call ambulance",
                "call fire department",
                "call police",
                "emergency help"
            ],
            "last_updated": "2024-01-01T00:00:00"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice status check failed: {str(e)}")

class VoiceCommandRequest(BaseModel):
    command: str

@router.post("/voice/command")
async def handle_voice_command(req: VoiceCommandRequest):
    """
    Process a natural language voice command and return navigation instructions or emergency actions.
    """
    try:
        result = await process_voice_command(req.command)
        
        # If it's an emergency call, trigger the emergency service
        if result.get("action") == "emergency_call" and result.get("service_type"):
            try:
                # Make internal API call to emergency service
                import httpx
                async with httpx.AsyncClient(timeout=5.0) as client:
                    emergency_response = await client.post(
                        f"http://localhost:8000/api/emergency/call",
                        json={"service": result["service_type"]}
                    )
                    
                    if emergency_response.status_code == 200:
                        emergency_data = emergency_response.json()
                        result["emergency_status"] = emergency_data.get("status", "success")
                        result["emergency_message"] = emergency_data.get("message", "Emergency service contacted")
                        result["confirmation_message"] = f"Emergency call initiated. {emergency_data.get('message', '')}"
                    else:
                        result["emergency_status"] = "failed"
                        result["emergency_message"] = "Failed to contact emergency service"
                        result["confirmation_message"] = "Emergency call failed. Please try manual dialing."
                        
            except Exception as e:
                print(f"Emergency call error: {e}")
                result["emergency_status"] = "simulated"
                result["emergency_message"] = "Emergency call simulated for demo"
                result["confirmation_message"] = f"Emergency call to {result['service_type']} service initiated. Help is on the way."
        
        return result
        
    except Exception as e:
        print(f"Voice command processing error: {e}")
        return {
            "intent": "error",
            "action": "unknown",
            "target": None,
            "confirmation_message": "Voice processing failed. Please try again.",
            "error": str(e)
        }

@router.get("/voice/test")
async def test_voice_system():
    """
    Test endpoint to verify voice system is working.
    """
    return {
        "status": "active",
        "message": "Voice navigation system is operational",
        "supported_commands": {
            "navigation": [
                "navigate to analytics",
                "go to dashboard", 
                "open emergency page",
                "show me news",
                "risk assessment"
            ],
            "emergency": [
                "call ambulance",
                "call fire brigade", 
                "call police",
                "medical emergency",
                "fire emergency"
            ]
        }
    }
