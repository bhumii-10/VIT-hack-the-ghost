"""
Feature 9: Resource Management & Allocation
Emergency resource tracking, allocation, and coordination system
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
from datetime import datetime, timedelta
import json
import random

router = APIRouter(prefix="/resources", tags=["Resource Management"])

class Resource(BaseModel):
    resource_id: str
    name: str
    type: str  # medical, rescue, transport, shelter, supplies
    quantity: int
    available: int
    location: Dict[str, float]
    status: str  # available, deployed, maintenance, unavailable
    contact_info: Optional[str] = None

class ResourceRequest(BaseModel):
    request_id: str
    incident_id: str
    resource_type: str
    quantity_needed: int
    priority: str  # low, medium, high, critical
    location: Dict[str, float]
    requested_by: str
    status: str = "pending"  # pending, approved, deployed, completed
    description: Optional[str] = None

class ResourceAllocation(BaseModel):
    allocation_id: str
    request_id: str
    resource_id: str
    quantity_allocated: int
    estimated_arrival: str
    status: str
    allocated_by: str

# Simulated resource database
RESOURCES_DB = [
    {
        "resource_id": "AMB_001",
        "name": "Ambulance Unit Alpha",
        "type": "medical",
        "quantity": 1,
        "available": 1,
        "location": {"latitude": 28.6139, "longitude": 77.2090},
        "status": "available",
        "contact_info": "+91-9876543210"
    },
    {
        "resource_id": "FIRE_001", 
        "name": "Fire Engine Delta",
        "type": "rescue",
        "quantity": 1,
        "available": 1,
        "location": {"latitude": 28.7041, "longitude": 77.1025},
        "status": "available",
        "contact_info": "+91-9876543211"
    },
    {
        "resource_id": "SHELTER_001",
        "name": "Community Center Shelter",
        "type": "shelter",
        "quantity": 500,
        "available": 450,
        "location": {"latitude": 28.5355, "longitude": 77.3910},
        "status": "available",
        "contact_info": "+91-9876543212"
    },
    {
        "resource_id": "SUPPLY_001",
        "name": "Emergency Food Supplies",
        "type": "supplies",
        "quantity": 1000,
        "available": 800,
        "location": {"latitude": 28.4595, "longitude": 77.0266},
        "status": "available",
        "contact_info": "+91-9876543213"
    },
    {
        "resource_id": "TRANSPORT_001",
        "name": "Evacuation Bus Fleet",
        "type": "transport",
        "quantity": 5,
        "available": 3,
        "location": {"latitude": 28.6692, "longitude": 77.4538},
        "status": "available",
        "contact_info": "+91-9876543214"
    }
]

REQUESTS_DB = []
ALLOCATIONS_DB = []

@router.get("/available")
async def get_available_resources(resource_type: Optional[str] = None):
    """Get all available resources, optionally filtered by type"""
    try:
        resources = RESOURCES_DB.copy()
        
        if resource_type:
            resources = [r for r in resources if r["type"] == resource_type]
        
        # Filter only available resources
        available_resources = [r for r in resources if r["available"] > 0 and r["status"] == "available"]
        
        return {
            "resources": available_resources,
            "total_count": len(available_resources),
            "resource_types": list(set([r["type"] for r in available_resources])),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resource fetch error: {str(e)}")

@router.get("/{resource_id}")
async def get_resource_details(resource_id: str):

@router.post("/request")
async def request_resources(request: ResourceRequest):
    """Submit a resource request for an incident"""
    try:
        # Generate request ID if not provided
        if not request.request_id:
            request.request_id = f"REQ_{int(datetime.now().timestamp())}"
        
        # Add timestamp
        request_data = request.dict()
        request_data["requested_at"] = datetime.now().isoformat()
        request_data["status"] = "pending"
        
        REQUESTS_DB.append(request_data)
        
        # Auto-approve high priority requests
        if request.priority in ["high", "critical"]:
            allocation = await auto_allocate_resources(request_data)
            if allocation:
                return {
                    "request_id": request.request_id,
                    "status": "auto_approved",
                    "allocation": allocation,
                    "message": "High priority request auto-approved and allocated"
                }
        
        return {
            "request_id": request.request_id,
            "status": "pending",
            "message": "Resource request submitted successfully",
            "estimated_review_time": "15 minutes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request submission error: {str(e)}")

async def auto_allocate_resources(request_data: Dict) -> Optional[Dict]:
    """Automatically allocate resources for high priority requests"""
    try:
        # Find suitable resources
        suitable_resources = [
            r for r in RESOURCES_DB 
            if r["type"] == request_data["resource_type"] 
            and r["available"] >= request_data["quantity_needed"]
            and r["status"] == "available"
        ]
        
        if not suitable_resources:
            return None
        
        # Select closest resource (simplified distance calculation)
        req_lat = request_data["location"]["latitude"]
        req_lon = request_data["location"]["longitude"]
        
        def calculate_distance(resource):
            r_lat = resource["location"]["latitude"]
            r_lon = resource["location"]["longitude"]
            return ((req_lat - r_lat)**2 + (req_lon - r_lon)**2)**0.5
        
        closest_resource = min(suitable_resources, key=calculate_distance)
        
        # Create allocation
        allocation_id = f"ALLOC_{int(datetime.now().timestamp())}"
        allocation = {
            "allocation_id": allocation_id,
            "request_id": request_data["request_id"],
            "resource_id": closest_resource["resource_id"],
            "quantity_allocated": request_data["quantity_needed"],
            "estimated_arrival": (datetime.now() + timedelta(minutes=30)).isoformat(),
            "status": "dispatched",
            "allocated_by": "auto_system",
            "allocated_at": datetime.now().isoformat()
        }
        
        ALLOCATIONS_DB.append(allocation)
        
        # Update resource availability
        for resource in RESOURCES_DB:
            if resource["resource_id"] == closest_resource["resource_id"]:
                resource["available"] -= request_data["quantity_needed"]
                if resource["available"] <= 0:
                    resource["status"] = "deployed"
                break
        
        return allocation
        
    except Exception as e:
        print(f"Auto allocation error: {e}")
        return None

@router.get("/requests")
async def get_resource_requests(status: Optional[str] = None):
    """Get all resource requests, optionally filtered by status"""
    try:
        requests = REQUESTS_DB.copy()
        
        if status:
            requests = [r for r in requests if r["status"] == status]
        
        # Sort by priority and timestamp
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        requests.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["requested_at"]))
        
        return {
            "requests": requests,
            "total_count": len(requests),
            "pending_count": len([r for r in REQUESTS_DB if r["status"] == "pending"]),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Requests fetch error: {str(e)}")

@router.post("/allocate")
async def allocate_resources(allocation: ResourceAllocation):
    """Manually allocate resources to a request"""
    try:
        # Validate request exists
        request = next((r for r in REQUESTS_DB if r["request_id"] == allocation.request_id), None)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        
        # Validate resource exists and is available
        resource = next((r for r in RESOURCES_DB if r["resource_id"] == allocation.resource_id), None)
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        if resource["available"] < allocation.quantity_allocated:
            raise HTTPException(status_code=400, detail="Insufficient resource quantity available")
        
        # Create allocation
        allocation_data = allocation.dict()
        allocation_data["allocated_at"] = datetime.now().isoformat()
        allocation_data["status"] = "approved"
        
        ALLOCATIONS_DB.append(allocation_data)
        
        # Update resource availability
        resource["available"] -= allocation.quantity_allocated
        if resource["available"] <= 0:
            resource["status"] = "deployed"
        
        # Update request status
        request["status"] = "approved"
        
        return {
            "allocation_id": allocation.allocation_id,
            "status": "success",
            "message": "Resources allocated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allocation error: {str(e)}")

@router.get("/allocations")
async def get_resource_allocations():
    """Get all resource allocations"""
    try:
        allocations = ALLOCATIONS_DB.copy()
        
        # Enrich with resource and request details
        for allocation in allocations:
            resource = next((r for r in RESOURCES_DB if r["resource_id"] == allocation["resource_id"]), None)
            request = next((r for r in REQUESTS_DB if r["request_id"] == allocation["request_id"]), None)
            
            if resource:
                allocation["resource_name"] = resource["name"]
                allocation["resource_type"] = resource["type"]
            
            if request:
                allocation["incident_id"] = request["incident_id"]
                allocation["priority"] = request["priority"]
        
        return {
            "allocations": allocations,
            "total_count": len(allocations),
            "active_count": len([a for a in allocations if a["status"] in ["approved", "dispatched"]]),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allocations fetch error: {str(e)}")

@router.get("/analytics")
async def get_resource_analytics():
    """Get resource utilization analytics"""
    try:
        # Calculate analytics
        total_resources = len(RESOURCES_DB)
        available_resources = len([r for r in RESOURCES_DB if r["status"] == "available"])
        deployed_resources = len([r for r in RESOURCES_DB if r["status"] == "deployed"])
        
        # Resource type distribution
        type_distribution = {}
        for resource in RESOURCES_DB:
            resource_type = resource["type"]
            if resource_type not in type_distribution:
                type_distribution[resource_type] = {"total": 0, "available": 0, "deployed": 0}
            
            type_distribution[resource_type]["total"] += resource["quantity"]
            type_distribution[resource_type]["available"] += resource["available"]
            type_distribution[resource_type]["deployed"] += (resource["quantity"] - resource["available"])
        
        # Request analytics
        total_requests = len(REQUESTS_DB)
        pending_requests = len([r for r in REQUESTS_DB if r["status"] == "pending"])
        approved_requests = len([r for r in REQUESTS_DB if r["status"] == "approved"])
        
        # Response time analytics (simulated)
        avg_response_time = "12 minutes"
        allocation_success_rate = "94.5%"
        
        return {
            "resource_summary": {
                "total_resources": total_resources,
                "available_resources": available_resources,
                "deployed_resources": deployed_resources,
                "utilization_rate": f"{((deployed_resources / total_resources) * 100):.1f}%" if total_resources > 0 else "0%"
            },
            "type_distribution": type_distribution,
            "request_summary": {
                "total_requests": total_requests,
                "pending_requests": pending_requests,
                "approved_requests": approved_requests,
                "completion_rate": f"{((approved_requests / total_requests) * 100):.1f}%" if total_requests > 0 else "0%"
            },
            "performance_metrics": {
                "avg_response_time": avg_response_time,
                "allocation_success_rate": allocation_success_rate,
                "peak_demand_hours": ["10:00-12:00", "14:00-16:00", "18:00-20:00"]
            },
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@router.patch("/{resource_id}/status")
async def update_resource_status(resource_id: str, status_data: Dict):
    """Update resource status"""
    try:
        resource = next((r for r in RESOURCES_DB if r["resource_id"] == resource_id), None)
        
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        # Update status
        new_status = status_data.get("status")
        if new_status:
            resource["status"] = new_status
            
        # Update availability if provided
        new_available = status_data.get("available")
        if new_available is not None:
            resource["available"] = min(new_available, resource["quantity"])
        
        resource["last_updated"] = datetime.now().isoformat()
        
        return {
            "resource_id": resource_id,
            "status": "updated",
            "message": "Resource status updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status update error: {str(e)}")

@router.get("/status")
async def get_resource_system_status():
    """Get resource management system status"""
    try:
        return {
            "system_status": "operational",
            "total_resources": len(RESOURCES_DB),
            "active_requests": len([r for r in REQUESTS_DB if r["status"] == "pending"]),
            "active_allocations": len([a for a in ALLOCATIONS_DB if a["status"] in ["approved", "dispatched"]]),
            "resource_types": list(set([r["type"] for r in RESOURCES_DB])),
            "features": {
                "auto_allocation": True,
                "priority_handling": True,
                "real_time_tracking": True,
                "analytics": True,
                "multi_type_support": True
            },
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check error: {str(e)}")


@router.get("/{resource_id}")
async def get_resource_details(resource_id: str):
    """Get detailed information about a specific resource"""
    try:
        resource = next((r for r in RESOURCES_DB if r["resource_id"] == resource_id), None)

        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")

        # Add utilization history (simulated)
        resource["utilization_history"] = [
            {"date": (datetime.now() - timedelta(days=i)).isoformat(),
             "deployments": random.randint(0, 5)}
            for i in range(7)
        ]

        return resource

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resource details error: {str(e)}")