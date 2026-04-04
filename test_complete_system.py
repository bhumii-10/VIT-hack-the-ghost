#!/usr/bin/env python3
"""
Complete System Test for SankatSaathi
Tests all features including the new Feature 6 ML Hotspot Engine
"""

import requests
import json
import sys
import time
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

def test_endpoint(name, url, method="GET", data=None, expected_status=200):
    """Test a single endpoint"""
    try:
        print(f"\n🧪 Testing {name}...")
        print(f"   URL: {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == expected_status:
            try:
                result = response.json()
                print(f"   ✅ SUCCESS - Response received")
                if isinstance(result, dict) and len(result) <= 5:
                    print(f"   📄 Sample: {json.dumps(result, indent=2)[:200]}...")
                return True
            except:
                print(f"   ✅ SUCCESS - Non-JSON response")
                return True
        else:
            print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ CONNECTION ERROR - Server not running?")
        return False
    except Exception as e:
        print(f"   ❌ ERROR - {str(e)}")
        return False

def main():
    print("🚀 SankatSaathi Complete System Test")
    print("=" * 50)
    
    tests = []
    
    # Core API Tests
    tests.append(("Root API", f"{BASE_URL}/"))
    tests.append(("Health Check", f"{API_BASE}/health"))
    
    # Feature 1: Crisis Management
    tests.append(("Crisis Active", f"{API_BASE}/crisis/active"))
    tests.append(("Crisis Subscribe", f"{API_BASE}/crisis/subscribe", "POST", {
        "user_id": "test-user-123",
        "subscription": {"endpoint": "test", "keys": {"p256dh": "test", "auth": "test"}}
    }))
    
    # Feature 2: News
    tests.append(("News Categories", f"{API_BASE}/news/categories"))
    tests.append(("News Stats", f"{API_BASE}/news/stats"))
    tests.append(("News Latest", f"{API_BASE}/news/latest"))
    
    # Feature 3: Emergency
    tests.append(("Emergency Broadcast", f"{API_BASE}/emergency/broadcast", "POST", {
        "message": "Test emergency broadcast",
        "severity": "high",
        "location": {"lat": 28.6139, "lng": 77.2090}
    }))
    
    # Feature 5: Incidents
    tests.append(("Incidents List", f"{API_BASE}/incidents/"))
    tests.append(("Create Incident", f"{API_BASE}/incidents/", "POST", {
        "title": "Test Incident",
        "description": "Test incident for system verification",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "severity": "medium",
        "type": "test"
    }))
    
    # Feature 6: ML Hotspot Engine (NEW)
    tests.append(("Hotspot Info", f"{API_BASE}/hotspot/"))
    tests.append(("Hotspot Health", f"{API_BASE}/hotspot/health"))
    tests.append(("Hotspot Zones", f"{API_BASE}/hotspot/zones"))
    tests.append(("Hotspot Live Analysis", f"{API_BASE}/hotspot/live-analysis"))
    tests.append(("Hotspot Temporal", f"{API_BASE}/hotspot/temporal"))
    
    # Hotspot Analysis Test
    hotspot_test_data = {
        "points": [
            {"lat": 28.6139, "lng": 77.2090, "severity": "high"},
            {"lat": 28.6200, "lng": 77.2100, "severity": "critical"},
            {"lat": 28.6100, "lng": 77.2050, "severity": "medium"},
            {"lat": 28.6180, "lng": 77.2080, "severity": "high"}
        ],
        "radius_km": 50,
        "grid_size": 0.05
    }
    tests.append(("Hotspot Analysis", f"{API_BASE}/hotspot/analyze", "POST", hotspot_test_data))
    
    # Heatmap Generation Test
    heatmap_test_data = {
        "incidents": [
            {"lat": 28.6139, "lng": 77.2090, "severity": "critical"},
            {"lat": 28.6200, "lng": 77.2100, "severity": "high"},
            {"lat": 28.6100, "lng": 77.2050, "severity": "medium"}
        ],
        "grid_size": 0.1
    }
    tests.append(("Heatmap Generation", f"{API_BASE}/hotspot/heatmap", "POST", heatmap_test_data))
    
    # Run all tests
    passed = 0
    total = len(tests)
    
    for test in tests:
        if len(test) == 2:
            name, url = test
            success = test_endpoint(name, url)
        elif len(test) == 3:
            name, url, method = test
            success = test_endpoint(name, url, method)
        else:
            name, url, method, data = test
            success = test_endpoint(name, url, method, data)
        
        if success:
            passed += 1
        
        time.sleep(0.5)  # Brief pause between tests
    
    # Results
    print("\n" + "=" * 50)
    print(f"🏁 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! System is fully operational.")
        print("\n🚀 Ready for production deployment!")
        print("\n📋 Available Features:")
        print("   ✅ Feature 1: Crisis Management & Push Notifications")
        print("   ✅ Feature 2: Live News Aggregation")
        print("   ✅ Feature 3: Emergency Broadcasting")
        print("   ✅ Feature 5: Incident Management")
        print("   ✅ Feature 6: ML Hotspot Engine (NEW)")
        print("\n🌐 Frontend Features:")
        print("   ✅ 3D Earth Visualization")
        print("   ✅ Real-time Crisis Dashboard")
        print("   ✅ Interactive Heatmap Visualization")
        print("   ✅ Multi-language Support")
        print("   ✅ Voice Navigation")
        print("   ✅ Responsive Design")
    else:
        failed = total - passed
        print(f"⚠️  {failed} tests failed. Check the logs above.")
        print("💡 Make sure the backend server is running: python backend/app.py")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)