"""
Configuration and Environment Variable Management
Centralized configuration for SankatSaathi Backend
"""
import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

class Config:
    """Application Configuration"""
    
    # Environment
    ENV = os.getenv("ENV", "development")
    DEBUG = ENV == "development"
    
    # Database
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://sankat-saathi.vercel.app")
    
    # API Keys - External Services
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY")
    SARVAM_API_KEY: Optional[str] = os.getenv("SARVAM_API_KEY")
    SARVAM_BASE_URL: str = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")
    
    # Twilio (Voice & SMS)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Test Numbers for Twilio
    AMBULANCE_TEST_NUMBER: Optional[str] = os.getenv("AMBULANCE_TEST_NUMBER")
    FIRE_TEST_NUMBER: Optional[str] = os.getenv("FIRE_TEST_NUMBER")
    POLICE_TEST_NUMBER: Optional[str] = os.getenv("POLICE_TEST_NUMBER")
    
    # Web Push Notifications
    VAPID_PUBLIC_KEY: Optional[str] = os.getenv("VAPID_PUBLIC_KEY")
    VAPID_PRIVATE_KEY: Optional[str] = os.getenv("VAPID_PRIVATE_KEY")
    VAPID_MAILTO: str = os.getenv("VAPID_MAILTO", "mailto:support@sankatsaathi.com")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production"""
        return bool(os.getenv("VERCEL")) or cls.ENV == "production"
    
    @classmethod
    def get_required_env_vars(cls) -> dict:
        """Get status of required environment variables"""
        return {
            "supabase_configured": bool(cls.SUPABASE_URL and cls.SUPABASE_KEY),
            "gemini_configured": bool(cls.GEMINI_API_KEY),
            "news_api_configured": bool(cls.NEWS_API_KEY),
            "sarvam_configured": bool(cls.SARVAM_API_KEY),
            "twilio_configured": bool(cls.TWILIO_ACCOUNT_SID and cls.TWILIO_AUTH_TOKEN),
            "push_notifications_configured": bool(cls.VAPID_PUBLIC_KEY and cls.VAPID_PRIVATE_KEY),
        }
    
    @classmethod
    def get_summary(cls) -> dict:
        """Get configuration summary"""
        return {
            "environment": cls.ENV,
            "is_production": cls.is_production(),
            "frontend_url": cls.FRONTEND_URL,
            "services": cls.get_required_env_vars()
        }


# Export config instance
config = Config()
