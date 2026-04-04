import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Note: Removed deprecated google.generativeai package
# Using fallback analysis instead
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

def analyze_crisis_with_llm(description: str, crisis_type: str, cnn_score: float = 0.0, cnn_label: str = "") -> Dict[str, Any]:
    """
    Analyzes crisis using rule-based fallback system
    (Removed deprecated Gemini package)
    """
    print("INFO: Using rule-based crisis analysis (Gemini package deprecated)")
    return _intelligent_fallback_analysis(description, crisis_type, cnn_score, cnn_label)

def _intelligent_fallback_analysis(description: str, crisis_type: str, cnn_score: float, cnn_label: str) -> Dict[str, Any]:
    """
    Intelligent rule-based analysis as replacement for Gemini
    """
    description_lower = description.lower()
    crisis_type_lower = crisis_type.lower()
    
    # Severity assessment based on keywords
    severity = "medium"
    confidence = 0.7
    
    # High severity keywords
    high_severity_keywords = [
        "fire", "explosion", "collapse", "trapped", "multiple", "casualties", 
        "severe", "critical", "emergency", "urgent", "life-threatening"
    ]
    
    # Critical severity keywords
    critical_keywords = [
        "mass casualty", "building collapse", "major fire", "explosion", 
        "multiple fatalities", "disaster", "catastrophic"
    ]
    
    # Low severity keywords
    low_severity_keywords = [
        "minor", "small", "resolved", "under control", "no injuries"
    ]
    
    # Assess severity
    if any(keyword in description_lower for keyword in critical_keywords):
        severity = "critical"
        confidence = 0.9
    elif any(keyword in description_lower for keyword in high_severity_keywords):
        severity = "high" 
        confidence = 0.8
    elif any(keyword in description_lower for keyword in low_severity_keywords):
        severity = "low"
        confidence = 0.8
    
    # Resource allocation based on incident type and severity
    resources = {"medical": 0, "fire": 0, "police": 0, "disaster_management": 0, "other": []}
    
    if "fire" in crisis_type_lower or "fire" in description_lower:
        resources["fire"] = 3 if severity in ["high", "critical"] else 2
        resources["medical"] = 2 if severity in ["high", "critical"] else 1
        resources["police"] = 1
        
    elif "medical" in crisis_type_lower or any(word in description_lower for word in ["injury", "hurt", "accident", "ambulance"]):
        resources["medical"] = 3 if severity in ["high", "critical"] else 2
        resources["police"] = 1 if severity in ["high", "critical"] else 0
        
    elif "flood" in crisis_type_lower or "flood" in description_lower:
        resources["disaster_management"] = 2
        resources["medical"] = 1
        resources["police"] = 1
        resources["other"] = ["rescue_boats", "evacuation_teams"]
        
    else:
        # Default allocation
        resources["police"] = 1
        resources["medical"] = 1
    
    # Generate actions based on severity and type
    actions = []
    if severity == "critical":
        actions = [
            "Dispatch all available units immediately",
            "Establish incident command center", 
            "Coordinate with multiple agencies",
            "Prepare for mass casualty response"
        ]
    elif severity == "high":
        actions = [
            "Dispatch priority units",
            "Establish perimeter if needed",
            "Coordinate with relevant agencies",
            "Monitor situation closely"
        ]
    else:
        actions = [
            "Dispatch standard response units",
            "Assess situation on arrival",
            "Follow standard protocols"
        ]
    
    # Generate broadcast message
    broadcast_message = f"Emergency Response: {crisis_type} reported - {description[:100]}{'...' if len(description) > 100 else ''}"
    
    return {
        "assessed_severity": severity,
        "confidence_score": confidence,
        "reasoning": f"Rule-based analysis: Severity determined by keyword analysis and incident type classification",
        "required_resources": resources,
        "recommended_actions": actions,
        "broadcast_message": broadcast_message
    }

def _mock_ai_response(description: str) -> Dict[str, Any]:
    """Fallback response for compatibility"""
    return {
        "assessed_severity": "medium",
        "confidence_score": 0.5,
        "reasoning": "Fallback response - manual verification recommended",
        "required_resources": {
            "medical": 1,
            "police": 1,
            "fire": 0,
            "disaster_management": 0,
            "other": []
        },
        "recommended_actions": ["Verify information manually", "Dispatch nearest available unit"],
        "broadcast_message": f"Emergency reported: {description[:50]}..."
    }
