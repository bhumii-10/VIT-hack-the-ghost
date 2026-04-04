"""
Feature Admin: Legacy Admin Router (Backup)
This is a backup admin router for compatibility
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

router = APIRouter(tags=["Legacy Admin"])

class AdminAction(BaseModel):
    action_type: str
    target_id: str
    reason: Optional[str] = None

@router.get("/legacy-admin/status")
async def get_legacy_admin_status():
    """Get legacy admin system status"""
    return {
        "status": "deprecated",
        "message": "This admin router has been superseded by the main admin_router.py",
        "redirect_to": "/api/admin/stats",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/legacy-admin/redirect")
async def redirect_to_new_admin():
    """Redirect to new admin endpoints"""
    return {
        "new_endpoints": {
            "stats": "/api/admin/stats",
            "users": "/api/admin/users", 
            "incidents": "/api/admin/incidents",
            "analytics": "/api/admin/analytics",
            "system_health": "/api/admin/system-health"
        },
        "message": "Please use the new admin endpoints for full functionality"
    }