from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import random
from datetime import datetime
from dotenv import load_dotenv
from typing import Optional

from .twilio_client import get_twilio_client
from .ml_engine import analyze_severity

load_dotenv()

router = APIRouter(prefix="/emergency", tags=["Emergency Broadcast"])

# Status endpoint
@router.get("/status")
async def get_emergency_status():
    """Get emergency services system status"""
    try:
        twilio_client = get_twilio_client()
        
        return {
            "system_status": "operational",
            "twilio_configured": twilio_client is not None,
            "emergency_numbers": {
                "ambulance": EMERGENCY_NUMBERS.get("ambulance") is not None,
                "fire": EMERGENCY_NUMBERS.get("fire") is not None,
                "police": EMERGENCY_NUMBERS.get("police") is not None
            },
            "features": {
                "emergency_calling": True,
                "sms_alerts": True,
                "severity_analysis": True,
                "ml_engine": True
            },
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency status check failed: {str(e)}")

# Map services to environment variable keys for numbers
EMERGENCY_NUMBERS = {
    "ambulance": os.getenv("AMBULANCE_TEST_NUMBER"),
    "fire": os.getenv("FIRE_TEST_NUMBER"),
    "police": os.getenv("POLICE_TEST_NUMBER")
}

# Twilio Configuration
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# --- DATA MODELS ---

class EmergencyCallRequest(BaseModel):
    service: str  # 'ambulance', 'fire', 'police'

class SeverityAnalysisRequest(BaseModel):
    latitude: float
    longitude: float

# --- ENDPOINTS ---

@router.post("/analyze")
async def analyze_incident_severity(request: SeverityAnalysisRequest):
    """
    Analyzes severity based on Location and Simulated Context.
    Uses the automated ML Engine rules.
    NO MANUAL INPUT ALLOWED.
    """
    print(f"DEBUG: /analyze hit with lat={request.latitude}, lon={request.longitude}")
    
    # 1. Simulate Context Data (In production, these would be calls to WeatherAPI, GIS DB, etc.)
    # We randomize these slightly for demo purposes to show different outputs
    
    # Time of day
    hour = datetime.now().hour
    if 5 <= hour < 12: time_of_day = "morning"
    elif 12 <= hour < 17: time_of_day = "afternoon"
    elif 17 <= hour < 21: time_of_day = "evening"
    else: time_of_day = "night"

    # Simulated Zone (Deterministic based on lat/lon to be stable-ish)
    val = (request.latitude + request.longitude)
    if int(val * 10) % 3 == 0: zone = "urban"
    elif int(val * 10) % 3 == 1: zone = "rural"
    else: zone = "industrial"

    # Simulated Weather
    rainfall = random.choice(["low", "medium", "high"])
    
    # Simulated History
    history = random.choice(["low_risk", "medium_risk", "high_risk"])

    # Simulated Incident Type (In real world, this comes from sensor/image analysis. We'll pick a random one)
    incident_type = random.choice(["fire", "accident", "flood", "earthquake", "building_collapse"])
    
    # Simulated Description (Crucial for life-threat keywords)
    # 20% chance of life-threatening keyword
    if random.random() < 0.2:
        desc = f"Major {incident_type} reported. People trapped under debris."
    else:
        desc = f"Reported {incident_type} in the area. Local authorities alerted."

    # 2. Construct Incident Object
    incident_data = {
        "incident_type": incident_type,
        "description": desc,
        "location_zone": zone,
        "time_of_day": time_of_day,
        "rainfall_level": rainfall,
        "zone_history": history
    }

    # 3. Call ML Engine
    result = analyze_severity(incident_data)

    # 4. Return Combined Data (Result + The Context used)
    return {
        "analysis": result,
        "context": incident_data
    }


@router.post("/call")
async def call_emergency_service(request: EmergencyCallRequest):
    """
    Initiates a Twilio voice call to the mapped test number for the requested service.
    Handles Twilio Trial account limitations with verified numbers only.
    """
    service_type = request.service.lower()
    
    # 1. Validate Service Type
    if service_type not in EMERGENCY_NUMBERS:
        raise HTTPException(status_code=400, detail="Invalid emergency service type. Choose: ambulance, fire, police.")

    destination_number = EMERGENCY_NUMBERS[service_type]
    
    # 2. Validate Configuration
    if not destination_number or destination_number.startswith("+91XXXXXXXXXX"):
        return {
            "status": "simulated",
            "message": f"No verified number configured for {service_type.upper()}. In production, this would call the actual emergency service.",
            "sid": f"simulated_{service_type}_123",
            "note": "Configure a verified phone number in .env to test actual calls"
        }
    
    if not TWILIO_PHONE_NUMBER:
        raise HTTPException(status_code=500, detail="Twilio source number not configured in .env")

    client = get_twilio_client()
    if not client:
        # Fallback for demo if credentials missing
        return {
            "status": "simulated",
            "message": f"Twilio keys missing. Simulated calling {service_type.upper()} at {destination_number}",
            "sid": "simulated_sid_123"
        }

    # 3. Check if number is likely verified (basic validation)
    if not destination_number.startswith(("+91902", "+91957", "+91")):
        return {
            "status": "simulated", 
            "message": f"Number {destination_number} may not be verified for Trial account. Simulating call to {service_type.upper()}.",
            "sid": f"simulated_{service_type}_456",
            "note": "Twilio Trial accounts can only call verified numbers"
        }

    try:
        # 4. Initiate Call to Verified Number
        # TwiML instructions for what to say when picked up
        twiml_instruction = f'<Response><Say>This is an automated emergency alert from Sankat Saathi. A user has requested {service_type} services immediately. This is a test call from the disaster management system.</Say></Response>'

        call = client.calls.create(
            twiml=twiml_instruction,
            to=destination_number,
            from_=TWILIO_PHONE_NUMBER
        )

        print(f"✅ Call Initiated: {call.sid}")

        # 5. (Optional) Send Confirmation SMS
        try:
            sms = client.messages.create(
                body=f"🚨 Emergency request initiated for {service_type.upper()}. Help is being contacted. (Test from SankatSaathi)",
                from_=TWILIO_PHONE_NUMBER,
                to=destination_number 
            )
            print(f"✅ SMS Sent: {sms.sid}")
        except Exception as sms_error:
            print(f"⚠️ SMS failed (non-critical): {sms_error}")

        return {
            "status": "success", 
            "message": f"Successfully calling {service_type}...", 
            "sid": call.sid,
            "destination": destination_number
        }

    except Exception as e:
        error_message = str(e)
        print(f"❌ Twilio Error: {error_message}")
        
        # Handle specific Twilio Trial account errors gracefully
        if "unverified" in error_message.lower() or "21219" in error_message:
            return {
                "status": "trial_limitation",
                "message": f"Cannot call {destination_number} - number not verified for Trial account. In production, this would work with a paid Twilio account.",
                "sid": f"trial_limited_{service_type}",
                "error": "Twilio Trial account limitation",
                "solution": "Verify the phone number in Twilio Console or upgrade to paid account"
            }
        
        # For other errors, return detailed info
        raise HTTPException(status_code=500, detail=f"Failed to connect call: {error_message}")
