from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase_shim import create_client, Client

# Add base dir for imports if needed
base_dir = Path(__file__).parent.parent.resolve()
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

from .models import IncidentCreate, IncidentUpdate, IncidentResponse, IncidentAcknowledge

# Environment Setup
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Feature5: Supabase Initialized")
    except Exception as e:
        print(f"Feature5: Supabase Init Failed: {e}")
else:
    print("Feature5: Supabase Credentials MISSING")

router = APIRouter(prefix="/incidents", tags=["Incidents (Feature 5)"])

@router.post("/", response_model=IncidentResponse)
async def create_incident(incident: IncidentCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        data = incident.dict(exclude_none=True)
        response = supabase.table("incidents").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create incident")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents():
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Fetch all incidents, ordered by reported_at desc
        response = supabase.table("incidents").select("*").order("reported_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(incident_id: str, update_data: IncidentUpdate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        data = update_data.dict(exclude_none=True)
        response = supabase.table("incidents").update(data).eq("incident_id", incident_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Incident not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{incident_id}/acknowledge", response_model=IncidentResponse)
async def acknowledge_incident(incident_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        data = {
            "admin_acknowledged": True,
            "acknowledged_at": datetime.now().isoformat()
        }
        response = supabase.table("incidents").update(data).eq("incident_id", incident_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Incident not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
