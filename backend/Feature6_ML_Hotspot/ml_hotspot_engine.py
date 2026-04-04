# -*- coding: utf-8 -*-
"""
SankatSaathi ML Hotspot Engine
AI-powered crisis hotspot detection and heatmap generation
"""

from math import radians, sin, cos, sqrt, atan2
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
import json
from enum import Enum

class HotspotSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium" 
    HIGH = "High"
    CRITICAL = "Critical"

class HotspotZone(str, Enum):
    SAFE = "safe"        # Green
    CAUTION = "caution"  # Yellow
    WARNING = "warning"  # Orange
    DANGER = "danger"    # Red

def haversine_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    R = 6371  # Earth's radius in kilometers
    
    dlat = radians(p2["lat"] - p1["lat"])
    dlon = radians(p2["lng"] - p1["lng"])
    
    a = (sin(dlat/2)**2 + 
         cos(radians(p1["lat"])) * cos(radians(p2["lat"])) * sin(dlon/2)**2)
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

def detect_hotspot(points: List[Dict[str, Any]], radius_km: float = 50) -> Dict[str, Any]:
    """
    Detects crisis hotspot regions using spatial clustering with enhanced ML logic
    """
    if len(points) < 2:
        return {
            "hotspot_detected": False,
            "hotspot_strength": HotspotSeverity.LOW,
            "hotspot_radius_km": radius_km,
            "clustered_points": 0,
            "zone_classification": HotspotZone.SAFE,
            "risk_score": 0.0,
            "center_point": None
        }
    
    clustered_points = 0
    severity_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    total_severity_score = 0
    
    for i in range(len(points)):
        neighbors = 0
        severity_sum = 0
        
        for j in range(len(points)):
            if i != j:
                distance = haversine_distance(points[i], points[j])
                if distance <= radius_km:
                    neighbors += 1
                    point_severity = points[j].get("severity", "medium").lower()
                    severity_sum += severity_weights.get(point_severity, 2)
        
        if neighbors >= 1:
            clustered_points += 1
            point_severity = points[i].get("severity", "medium").lower()
            total_severity_score += severity_weights.get(point_severity, 2) * (neighbors + 1)
    
    max_possible_score = len(points) * 4 * len(points)
    risk_score = min(100, (total_severity_score / max_possible_score) * 100) if max_possible_score > 0 else 0
    
    if clustered_points >= 8 or risk_score >= 80:
        strength = HotspotSeverity.CRITICAL
        zone = HotspotZone.DANGER
    elif clustered_points >= 5 or risk_score >= 60:
        strength = HotspotSeverity.HIGH
        zone = HotspotZone.WARNING
    elif clustered_points >= 3 or risk_score >= 30:
        strength = HotspotSeverity.MEDIUM
        zone = HotspotZone.CAUTION
    else:
        strength = HotspotSeverity.LOW
        zone = HotspotZone.SAFE
    
    center_point = None
    if clustered_points > 0:
        avg_lat = sum(p["lat"] for p in points) / len(points)
        avg_lng = sum(p["lng"] for p in points) / len(points)
        center_point = {"lat": avg_lat, "lng": avg_lng}
    
    return {
        "hotspot_detected": strength != HotspotSeverity.LOW,
        "hotspot_strength": strength,
        "hotspot_radius_km": radius_km,
        "clustered_points": clustered_points,
        "zone_classification": zone,
        "risk_score": round(risk_score, 2),
        "center_point": center_point,
        "total_incidents": len(points),
        "analysis_timestamp": datetime.now().isoformat()
    }

def generate_heatmap_data(incidents: List[Dict[str, Any]], grid_size: float = 0.1) -> List[Dict[str, Any]]:
    """
    Generate heatmap grid data for visualization
    """
    if not incidents:
        return []
    
    lats = [inc["lat"] for inc in incidents]
    lngs = [inc["lng"] for inc in incidents]
    
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)
    
    padding = grid_size
    min_lat -= padding
    max_lat += padding
    min_lng -= padding
    max_lng += padding
    
    heatmap_cells = []
    severity_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    
    lat = min_lat
    while lat <= max_lat:
        lng = min_lng
        while lng <= max_lng:
            cell_center = {"lat": lat + grid_size/2, "lng": lng + grid_size/2}
            intensity = 0
            incident_count = 0
            
            for incident in incidents:
                distance = haversine_distance(cell_center, incident)
                if distance <= 25:
                    weight = max(0, 1 - (distance / 25))
                    severity = incident.get("severity", "medium").lower()
                    severity_multiplier = severity_weights.get(severity, 2)
                    intensity += weight * severity_multiplier
                    incident_count += 1
            
            if intensity > 0:
                normalized_intensity = min(100, intensity * 10)
                if normalized_intensity >= 75:
                    zone = HotspotZone.DANGER
                    color = "#FF0000"
                elif normalized_intensity >= 50:
                    zone = HotspotZone.WARNING
                    color = "#FF8C00"
                elif normalized_intensity >= 25:
                    zone = HotspotZone.CAUTION
                    color = "#FFD700"
                else:
                    zone = HotspotZone.SAFE
                    color = "#32CD32"
                
                heatmap_cells.append({
                    "lat": lat, "lng": lng,
                    "lat_end": lat + grid_size, "lng_end": lng + grid_size,
                    "center": cell_center, "intensity": round(normalized_intensity, 2),
                    "zone": zone, "color": color, "incident_count": incident_count, "grid_size": grid_size
                })
            lng += grid_size
        lat += grid_size
    return heatmap_cells

def analyze_temporal_patterns(incidents: List[Dict[str, Any]], days_back: int = 7) -> Dict[str, Any]:
    """
    Analyze temporal patterns in incident data
    """
    if not incidents:
        return {"trend": "stable", "pattern": "no_data", "forecast": "unknown"}
    
    # Filter recent incidents - USE UTC for comparison
    now_utc = datetime.now(timezone.utc)
    cutoff_date = now_utc - timedelta(days=days_back)
    recent_incidents = []
    
    for incident in incidents:
        try:
            if "created_at" in incident:
                ts = incident["created_at"]
                if isinstance(ts, str):
                    incident_date = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                else:
                    incident_date = ts # Assuming it's already a datetime if not str
                
                if incident_date >= cutoff_date:
                    recent_incidents.append(incident)
        except:
            recent_incidents.append(incident)
    
    if len(recent_incidents) < 2:
        return {"trend": "stable", "pattern": "insufficient_data", "forecast": "stable"}
    
    daily_counts = {}
    for incident in recent_incidents:
        try:
            ts = incident.get("created_at")
            if isinstance(ts, str):
                date_str = ts[:10]
            else:
                date_str = ts.strftime("%Y-%m-%d")
            daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
        except:
            continue
    
    if len(daily_counts) < 2:
        return {"trend": "stable", "pattern": "single_day", "forecast": "stable"}
    
    dates = sorted(daily_counts.keys())
    counts = [daily_counts[date] for date in dates]
    
    if len(counts) >= 3:
        recent_avg = sum(counts[-3:]) / 3
        earlier_avg = sum(counts[:-3]) / max(1, len(counts) - 3) if len(counts) > 3 else counts[0]
        if recent_avg > earlier_avg * 1.5:
            trend, forecast = "increasing", "escalating"
        elif recent_avg < earlier_avg * 0.7:
            trend, forecast = "decreasing", "improving"
        else:
            trend, forecast = "stable", "stable"
    else:
        trend, forecast = "stable", "stable"
    
    return {
        "trend": trend, "pattern": "analyzed", "forecast": forecast,
        "daily_counts": daily_counts, "total_recent": len(recent_incidents),
        "analysis_period_days": days_back
    }

def get_zone_color_mapping() -> Dict[str, Dict[str, str]]:
    return {
        HotspotZone.SAFE: {"color": "#32CD32", "hex": "#32CD32", "description": "Safe Zone - Low risk area"},
        HotspotZone.CAUTION: {"color": "#FFD700", "hex": "#FFD700", "description": "Caution Zone - Moderate risk area"},
        HotspotZone.WARNING: {"color": "#FF8C00", "hex": "#FF8C00", "description": "Warning Zone - High risk area"},
        HotspotZone.DANGER: {"color": "#FF0000", "hex": "#FF0000", "description": "Danger Zone - Critical risk area"}
    }