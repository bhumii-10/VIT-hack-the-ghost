from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables early
load_dotenv()
# Vercel and some local setups might run from root or backend/
# We ensure the 'backend' directory is in sys.path so 'Feature1' and 'Feature2_news' can be found.
current_file_path = Path(__file__).resolve()
backend_dir = current_file_path.parent
root_dir = backend_dir.parent

# Add backend_dir to sys.path if not present
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Also add root_dir just in case imports reference 'backend.FeatureX'
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# --- IMPORTS ---
try:
    # Try importing as top-level modules (standard local python backend/app.py run)
    from Feature1.crisis_dispatch import router as crisis_router
    print("SUCCESS: Crisis Router imported successfully")
except ImportError as e:
    print(f"Warning: Direct import of Feature1 failed: {e}. Trying absolute...")
    try:
        # Try absolute import (useful if running from root like 'python -m backend.app')
        from backend.Feature1.crisis_dispatch import router as crisis_router
        print("SUCCESS: Crisis Router imported successfully (absolute)")
    except ImportError as e2:
        print(f"CRITICAL: Could not import Crisis Router. {e2}")
        crisis_router = None

try:
    from Feature2_news.news_router import router as news_router
    print("SUCCESS: News Router imported successfully")
except ImportError as e:
    print(f"Warning: Direct import of Feature2_news failed: {e}. Trying absolute...")
    try:
        from backend.Feature2_news.news_router import router as news_router
        print("SUCCESS: News Router imported successfully (absolute)")
    except ImportError as e2:
        print(f"CRITICAL: Could not import News Router. {e2}")
        news_router = None


# --- APP SETUP ---
app = FastAPI(
    title="SankatSaathi API",
    version="1.1.0",
    description="Backend for SankatSaathi: Crisis Management & News Aggregation"
)

# CORS CONFIGURATION (Production Ready) ---

# Get frontend URL from environment variable for deployment
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

# Initialize Supabase client for global use
SUPABASE_URL = "".join(char for char in os.getenv("SUPABASE_URL", "") if char.isprintable()).strip()
SUPABASE_KEY = "".join(char for char in os.getenv("SUPABASE_KEY", "") if char.isprintable()).strip()

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase_shim import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[SUCCESS] Supabase client initialized and sanitized")
    except Exception as e:
        print(f"[ERROR] Supabase init failed: {e}")
        supabase = None
else:
    print("[WARNING] Supabase credentials not found or invalid")
    supabase = None

# Build allowed origins list
allowed_origins = [
    "http://localhost:3000",      # Local React dev server
    "http://localhost:5173",      # Local Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://sankat-saathi.vercel.app",  # Production frontend
    "https://*.vercel.app",       # All Vercel apps
    "*"                           # Allow all for demo
]

# Add production frontend URL if provided
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)
    # Also add without trailing slash if present, or with if not
    if FRONTEND_URL.endswith("/"):
        allowed_origins.append(FRONTEND_URL.rstrip("/"))
    else:
        allowed_origins.append(FRONTEND_URL + "/")

# CORS middleware - More permissive for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- STATIC FILES CONFIGURATION ---
# Serve static files from public folder if it exists
static_dir = Path(__file__).parent.parent / "frontend" / "public"
if static_dir.exists():
    try:
        app.mount("/public", StaticFiles(directory=static_dir), name="public")
        print(f"[SUCCESS] Static files mounted from {static_dir}")
    except Exception as e:
        print(f"[WARNING] Could not mount static files: {e}")
else:
    print(f"[WARNING] Static directory not found: {static_dir}")

# --- ROUTING ---
# Mount routers if they were successfully imported

if crisis_router:
    # Standard API prefix
    app.include_router(crisis_router, prefix="/api") 
    # Fallback for some frontend calls that might miss /api prefix or Vercel rewrites
    app.include_router(crisis_router) 
else:
    print("ERROR: Crisis Router NOT mounted.")

if news_router:
    app.include_router(news_router, prefix="/api")
    app.include_router(news_router) # Fallback
else:
    print("ERROR: News Router NOT mounted.")

# Feature 3: Emergency Broadcast
try:
    from Feature3_emergency.emergency_router import router as emergency_router
    app.include_router(emergency_router, prefix="/api")
    app.include_router(emergency_router) # Fallback
    print("SUCCESS: Emergency Router mounted")
except ImportError as e:
    print(f"FAILED to mount Emergency Router: {e}")
    try:
        from backend.Feature3_emergency.emergency_router import router as emergency_router
        app.include_router(emergency_router, prefix="/api") 
        print("SUCCESS: Emergency Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Emergency Router completely failed: {e2}")

# Feature 3: Risk Scoring
try:
    from Feature3.scoring_router import router as scoring_router
    app.include_router(scoring_router, prefix="/api")
    print("SUCCESS: Scoring Router mounted")
except ImportError as e:
    print(f"FAILED to mount Scoring Router: {e}")
    try:
        from backend.Feature3.scoring_router import router as scoring_router
        app.include_router(scoring_router, prefix="/api")
        print("SUCCESS: Scoring Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Scoring Router completely failed: {e2}")

# Feature 3: Live Severity Intelligence
try:
    from Feature3.live_severity_router import router as live_severity_router
    app.include_router(live_severity_router, prefix="/api")
    print("SUCCESS: Live Severity Router mounted")
except ImportError as e:
    print(f"FAILED to mount Live Severity Router: {e}")
    try:
        from backend.Feature3.live_severity_router import router as live_severity_router
        app.include_router(live_severity_router, prefix="/api")
        print("SUCCESS: Live Severity Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Live Severity Router completely failed: {e2}")

# Feature 4: Escalation Management
try:
    from Feature4.enhanced_escalation_router import router as escalation_router
    app.include_router(escalation_router, prefix="/api")
    print("SUCCESS: Enhanced Escalation Router mounted")
except ImportError as e:
    print(f"FAILED to mount Enhanced Escalation Router: {e}")
    try:
        from backend.Feature4.enhanced_escalation_router import router as escalation_router
        app.include_router(escalation_router, prefix="/api")
        print("SUCCESS: Enhanced Escalation Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Enhanced Escalation Router completely failed: {e2}")
        # Fallback to basic escalation router
        try:
            from Feature4.escalation_router import router as basic_escalation_router
            app.include_router(basic_escalation_router, prefix="/api")
            print("SUCCESS: Basic Escalation Router mounted as fallback")
        except Exception as e3:
            print(f"CRITICAL: All Escalation Routers failed: {e3}")

# Feature 7: Automated Seismic Monitor
try:
    from Feature7_Seismic.seismic_router import router as seismic_router
    app.include_router(seismic_router, prefix="/api")
    print("SUCCESS: Seismic Monitor Router mounted")
except ImportError as e:
    print(f"FAILED to mount Seismic Router: {e}")
    try:
        from backend.Feature7_Seismic.seismic_router import router as seismic_router
        app.include_router(seismic_router, prefix="/api")
        print("SUCCESS: Seismic Monitor Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Seismic Router completely failed: {e2}")

# Feature 8: AI Disaster Intelligence
try:
    from Feature8_AI_Intelligence.intelligence_router import router as intelligence_router
    app.include_router(intelligence_router, prefix="/api")
    print("SUCCESS: AI Intelligence Router mounted")
except ImportError as e:
    print(f"FAILED to mount Intelligence Router: {e}")
    try:
        from backend.Feature8_AI_Intelligence.intelligence_router import router as intelligence_router
        app.include_router(intelligence_router, prefix="/api")
        print("SUCCESS: AI Intelligence Router mounted (absolute)")
    except Exception as e2:
         print(f"CRITICAL: Intelligence Router completely failed: {e2}")

# Feature 9: Resource Management & Allocation
try:
    from Feature9_Resources.resource_router import router as resource_router
    app.include_router(resource_router, prefix="/api")
    app.include_router(resource_router) # Fallback mount
    print("SUCCESS: Resource Management Router mounted")
except ImportError as e:
    print(f"FAILED to mount Resource Router: {e}")
    try:
        from backend.Feature9_Resources.resource_router import router as resource_router
        app.include_router(resource_router, prefix="/api")
        app.include_router(resource_router) # Fallback mount
        print("SUCCESS: Resource Management Router mounted (absolute)")
    except Exception as e2:
         print(f"CRITICAL: Resource Router completely failed: {e2}")

# Feature 5: Incidents (Admin)
try:
    from Feature5_incidents.router import router as incidents_router
    app.include_router(incidents_router, prefix="/api")
    print("SUCCESS: Incidents Router mounted")
except ImportError as e:
    print(f"FAILED to mount Incidents Router: {e}")
    try:
        from backend.Feature5_incidents.router import router as incidents_router
        app.include_router(incidents_router, prefix="/api")
        print("SUCCESS: Incidents Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Incidents Router completely failed: {e2}")

# Feature 5: Voice Navigation
try:
    from Feature5_voice_nav.voice_router import router as voice_router
    app.include_router(voice_router, prefix="/api")
    print("SUCCESS: Voice Router mounted")
except ImportError as e:
    print(f"FAILED to mount Voice Router: {e}")
    try:
        from backend.Feature5_voice_nav.voice_router import router as voice_router
        app.include_router(voice_router, prefix="/api")
        print("SUCCESS: Voice Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Voice Router completely failed: {e2}")

# Feature 4: Multilingual Support
try:
    from Feature4_multilingual.language_router import router as language_router
    app.include_router(language_router, prefix="/api")
    print("SUCCESS: Multilingual Router mounted")
except ImportError as e:
    print(f"FAILED to mount Multilingual Router: {e}")
    try:
        from backend.Feature4_multilingual.language_router import router as language_router
        app.include_router(language_router, prefix="/api")
        print("SUCCESS: Multilingual Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Multilingual Router completely failed: {e2}")

# Feature 6: ML Hotspot Engine
try:
    from Feature6_ML_Hotspot.hotspot_router import router as hotspot_router
    app.include_router(hotspot_router, prefix="/api")
    app.include_router(hotspot_router) # Fallback
    print("SUCCESS: ML Hotspot Router mounted")
except ImportError as e:
    print(f"FAILED to mount ML Hotspot Router: {e}")
    try:
        from backend.Feature6_ML_Hotspot.hotspot_router import router as hotspot_router
        app.include_router(hotspot_router, prefix="/api")
        print("SUCCESS: ML Hotspot Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: ML Hotspot Router completely failed: {e2}")

# Feature 7: AI-Assisted Resource Recommendation
try:
    from Feature7_AI_Recommendation.api.recommend import router as recommendation_router
    app.include_router(recommendation_router, prefix="/api")
    print("SUCCESS: AI Resource Recommendation Router mounted")
except ImportError as e:
    print(f"FAILED to mount AI Recommendation Router: {e}")
    try:
        from backend.Feature7_AI_Recommendation.api.recommend import router as recommendation_router
        app.include_router(recommendation_router, prefix="/api")
        print("SUCCESS: AI Resource Recommendation Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: AI Recommendation Router completely failed: {e2}")

# Admin Dashboard Router
try:
    from admin_router import router as admin_router
    app.include_router(admin_router, prefix="/api")
    print("SUCCESS: Admin Router mounted")
except ImportError as e:
    print(f"FAILED to mount Admin Router: {e}")
    try:
        from backend.admin_router import router as admin_router
        app.include_router(admin_router, prefix="/api")
        print("SUCCESS: Admin Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: Admin Router completely failed: {e2}")

# Feature 7: AI-Assisted Resource Recommendation
try:
    from Feature7_AI_Recommendation.api.recommend import router as ai_recommend_router
    app.include_router(ai_recommend_router, prefix="/api")
    print("SUCCESS: AI Recommendation Router mounted")
except ImportError as e:
    print(f"FAILED to mount AI Recommendation Router: {e}")
    try:
        from backend.Feature7_AI_Recommendation.api.recommend import router as ai_recommend_router
        app.include_router(ai_recommend_router, prefix="/api")
        print("SUCCESS: AI Recommendation Router mounted (absolute)")
    except Exception as e2:
        print(f"CRITICAL: AI Recommendation Router completely failed: {e2}")


@app.get("/")
@app.get("/api")
async def root(request: Request):
    return {
        "message": "🚨 SankatSaathi API is Live",
        "status": "operational",
        "version": "1.1.0",
        "services": {
            "crisis_dispatch": "active" if crisis_router is not None else "failed",
            "news_aggregator": "active" if news_router is not None else "failed",
            "emergency_broadcast": "active",
            "risk_scoring": "active",
            "live_severity_intelligence": "active",
            "escalation_management": "active",
            "incidents_management": "active",
            "voice_navigation": "active",
            "multilingual_support": "active",
            "ml_hotspot_engine": "active",
            "seismic_monitor": "active",
            "ai_intelligence": "active",
            "resource_management": "active",
            "ai_recommendation": "active",
            "admin_dashboard": "active"
        },
        "database": "connected" if supabase else "disconnected",
        "env": "production" if os.getenv("VERCEL") else "local",
        "path": request.url.path
    }

@app.get("/api/health")
async def health():
    """Health check endpoint for Vercel"""
    return {
        "status": "healthy",
        "message": "SankatSaathi API is operational",
        "version": "1.1.0",
        "database": "connected" if supabase else "disconnected",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/api/logo")
@app.get("/logo.jpg")
async def get_logo():
    """Serve logo for frontend"""
    logo_path = Path(__file__).parent.parent / "frontend" / "public" / "logo.jpg"
    if logo_path.exists():
        return {
            "url": "/public/logo.jpg",
            "alt": "SankatSaathi Logo",
            "status": "available"
        }
    else:
        return {
            "status": "not_found",
            "fallback": "Please ensure logo.jpg exists in frontend/public/"
        }

@app.get("/api/config")
async def get_config():
    """Get frontend configuration from environment"""
    return {
        "frontend_url": os.getenv("FRONTEND_URL", "https://sankat-saathi.vercel.app"),
        "api_url": os.getenv("BACKEND_URL", "http://localhost:8000"),
        "supabase_url": os.getenv("SUPABASE_URL", "").split("https://")[1].split(".")[0] if os.getenv("SUPABASE_URL") else "not_configured",
        "features": {
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "twilio": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "sarvam": bool(os.getenv("SARVAM_API_KEY")),
            "news_api": bool(os.getenv("NEWS_API_KEY")),
            "push_notifications": bool(os.getenv("VAPID_PUBLIC_KEY"))
        },
        "status": "ready"
    }

@app.get("/api/status")
async def get_status():
    """Detailed system status"""
    return {
        "system": "SankatSaathi",
        "status": "operational",
        "version": "1.1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": "production" if os.getenv("VERCEL") else "development",
        "database": {
            "status": "connected" if supabase else "disconnected",
            "supabase": bool(SUPABASE_URL and SUPABASE_KEY)
        },
        "services": {
            "crisis_dispatch": "active" if crisis_router is not None else "inactive",
            "news_aggregation": "active" if news_router is not None else "inactive"
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment for Render deployment
    port = int(os.getenv("PORT", 8000))
    try:
        # Standard execution - reload=False is more stable on some Windows setups
        uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user.")
    except Exception as e:
        print(f"\n[ERROR] Server failed: {e}")
