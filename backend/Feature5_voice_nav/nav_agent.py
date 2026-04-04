import os
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Force environment reload
try:
    env_path = Path(__file__).resolve().parent.parent / '.env'
    load_dotenv(dotenv_path=env_path, override=True)
except Exception:
    pass

def enhanced_keyword_fallback(text: str):
    """
    Enhanced voice command processing for SankatSaathi.
    Categorized by Admin vs User roles.
    """
    text = text.lower().strip()
    
    # 1. CRITICAL EMERGENCY / SOS
    emergency_patterns = {
        'ambulance': ['ambulance', 'medical', 'hospital', 'doctor', 'injured', 'sick'],
        'fire': ['fire', 'burning', 'smoke', 'flame', 'fire brigade', 'brigade', 'fire bridge', 'fire_bridge'],
        'police': ['police', 'cop', 'security', 'theft', 'crime', 'help']
    }
    
    for service, keywords in emergency_patterns.items():
        for keyword in keywords:
            if keyword in text and ('call' in text or 'emergency' in text or 'help' in text or 'sos' in text or 'place' in text):
                return {
                    "intent": "emergency",
                    "action": "emergency_call",
                    "target": f"call_{service}",
                    "confirmation_message": f"Calling {service.capitalize()} emergency service immediately.",
                    "service_type": service
                }

    # 2. ADMIN COMMANDS (HQ)
    admin_patterns = {
        '/admin': ['admin', 'hq', 'headquarters', 'dashboard', 'management panel'],
        '/admin/analytics': ['analytics', 'statistics', 'system health', 'performance'],
        '/resources': ['resource', 'resources', 'manage resources', 'inventory']
    }
    
    for route, keywords in admin_patterns.items():
        for keyword in keywords:
            if keyword in text and ('admin' in text or 'manage' in text or 'hq' in text):
                page_name = "Admin Headquarters" if route == '/admin' else keyword.title()
                return {
                    "intent": "navigate", "action": "navigation", "target": route,
                    "confirmation_message": f"Accessing secured {page_name}."
                }

    # 3. USER NAVIGATION COMMANDS
    user_patterns = {
        '/analytics': ['stats', 'data', 'public stats'],
        '/emergency': ['contacts', 'emergency contacts', 'sos page'],
        '/news': ['news', 'updates', 'reports', 'happenings'],
        '/risk-assessment': ['risk', 'assessment', 'forecast'],
        '/hotspot': ['hotspot', 'hotspots', 'risk zones', 'danger zones'],
        '/escalation': ['escalation', 'complaint', 'escalate'],
        '/': ['overview', 'main map', 'map dashboard', 'home']
    }
    
    for route, keywords in user_patterns.items():
        for keyword in keywords:
            if keyword in text:
                page_name = route.replace('/', '').replace('-', ' ').title() or 'Dashboard'
                return {
                    "intent": "navigate", "action": "navigation", "target": route,
                    "confirmation_message": f"Opening {page_name}."
                }
    
    return {
        "intent": "error", "action": "unknown", "target": None,
        "confirmation_message": "Command not recognized. Please try 'navigate to admin' or 'call ambulance'."
    }

async def process_voice_command(command_text: str):
    """Entry point for processing voice commands"""
    if not command_text or not command_text.strip():
        return {"intent": "error", "action": "unknown", "confirmation_message": "No command heard."}
    
    result = enhanced_keyword_fallback(command_text)
    return result
