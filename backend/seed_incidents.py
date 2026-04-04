import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:8000/api/incidents"

TYPES = ["Flood", "Fire", "Accident"]
STATES = ["Monitoring", "Preparedness", "Crisis"]

def seed_incidents():
    print(f"Connecting to {API_URL}...")
    
    # Generate 5 random incidents
    for i in range(5):
        incident_type = random.choice(TYPES)
        severity = random.randint(1, 5)
        
        # Random location around India (roughly)
        lat = 20.0 + random.uniform(-5, 5)
        lon = 78.0 + random.uniform(-5, 5)
        
        payload = {
            "incident_type": incident_type,
            "latitude": lat,
            "longitude": lon,
            "severity_level": severity,
            "priority_score": severity * 20 + random.randint(0, 5),
            "flood_risk_percentage": random.uniform(0, 100) if incident_type == "Flood" else 0.0,
            "current_state": "Crisis" if severity >= 4 else "Monitoring",
            "network_status": "Offline" if random.random() > 0.8 else "Online",
            "satellite_sos_required": severity == 5
        }
        
        try:
            res = requests.post(API_URL, json=payload)
            if res.status_code == 200:
                print(f"✅ Created {incident_type} at {lat:.2f}, {lon:.2f}")
            else:
                print(f"❌ Failed: {res.text}")
        except Exception as e:
            print(f"⚠️ Error: {e}")
            print("Is the backend running? (python app.py)")
            return

    print("\nDone! Check http://localhost:5173/admin")

if __name__ == "__main__":
    seed_incidents()
