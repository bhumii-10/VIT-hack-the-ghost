import pytest
from fastapi.testclient import TestClient
from backend.app import app  # Assuming your FastAPI app instance is named 'app'

client = TestClient(app)

def test_risk_assessment_endpoint():
    """
    Tests the /api/scoring/risk-assessment endpoint with a sample payload.
    """
    sample_payload = {
        "incident_type": "flood",
        "description": "water level rising fast near bridge, people trapped",
        "location_zone": "low_lying",
        "time_of_day": "night",
        "rainfall_level": "high",
        "zone_history": "flood_prone"
    }
    
    response = client.post("/api/scoring/risk-assessment", json=sample_payload)
    
    assert response.status_code == 200
    
    data = response.json()
    assert "severity_level" in data
    assert "priority_score" in data
    assert "flood_risk_percentage" in data
    
    assert data["severity_level"] == "High"
    assert data["priority_score"] >= 70
    assert data["flood_risk_percentage"] >= 90

def test_risk_assessment_invalid_payload():
    """
    Tests the endpoint with an invalid payload to ensure it handles errors correctly.
    """
    invalid_payload = {
        "incident_type": "fire",
        "description": "small fire in a trash can",
        # Missing other required fields
    }
    
    response = client.post("/api/scoring/risk-assessment", json=invalid_payload)
    
    assert response.status_code == 422  # Unprocessable Entity for Pydantic validation error