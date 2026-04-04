from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

# --- APP SETUP ---
app = FastAPI(
    title="SankatSaathi API",
    version="1.2.0",
    description="Backend for SankatSaathi: Crisis Management System"
)

# CORS middleware - Very permissive for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- BASIC ROUTES ---
@app.get("/")
@app.get("/api")
async def root(request: Request):
    return {
        "message": "🚨 SankatSaathi API is Live",
        "status": "operational",
        "version": "1.2.0",
        "env": "production" if os.getenv("RENDER") else "local",
        "path": request.url.path,
        "backend_url": "https://sankatsaathi.onrender.com",
        "frontend_url": "https://sankat-saathi.vercel.app"
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "message": "SankatSaathi API is operational",
        "version": "1.2.0",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.get("/api/status")
async def status():
    return {
        "status": "operational",
        "loaded_features": ["Basic API"],
        "total_features": 1,
        "environment": "production" if os.getenv("RENDER") else "development"
    }

# Mock crisis endpoint for frontend testing
@app.get("/api/crisis/active")
async def get_active_crises():
    return {
        "crises": [
            {
                "id": "demo-1",
                "title": "Demo Crisis Alert",
                "description": "This is a demo crisis for testing",
                "severity": "medium",
                "location": {"lat": 28.6139, "lng": 77.2090},
                "created_at": "2024-01-01T00:00:00Z"
            }
        ],
        "total": 1,
        "status": "demo_mode"
    }

# Mock hotspot endpoint
@app.get("/api/hotspot/")
async def hotspot_info():
    return {
        "service": "ML Hotspot Engine",
        "version": "1.0.0",
        "description": "AI-powered crisis hotspot detection",
        "status": "demo_mode"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting SankatSaathi API on port {port}")
    uvicorn.run("app_simple:app", host="0.0.0.0", port=port, reload=False)