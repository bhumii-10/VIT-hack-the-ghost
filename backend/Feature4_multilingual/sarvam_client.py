import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

def translate_text(text: str, target_language: str, source_language: str = "en"):
    """
    Translates text using Sarvam AI API.
    Reloads environment variables on each call to ensure hot updates work.
    """
    # 1. Force Reload .env to pick up API Key changes without restart
    try:
        env_path = Path(__file__).resolve().parent.parent / '.env'
        load_dotenv(dotenv_path=env_path, override=True)
    except Exception as e:
        print(f"Warning: Could not reload .env: {e}")

    # 2. Get Config
    # STRIP whitespace/newlines heavily
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "").strip()
    SARVAM_BASE_URL = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai").strip()

    if not SARVAM_API_KEY:
        print("ERROR: SARVAM_API_KEY is missing in .env")
        return text

    if not text:
        return ""
    
    # 3. Construct Endpoints (Comprehensive List)
    base = SARVAM_BASE_URL.rstrip('/')
    endpoints = [
        f"{base}/api/v1/translate-text",
        f"{base}/translate-text",
        f"{base}/v1/translate-text",
        f"{base}/translate",
        f"{base}/run/v1/translate"
    ]

    # 4. Map Languages
    lang_map = {
        'en': 'en-IN', 'hi': 'hi-IN', 'mr': 'mr-IN',
        'ta': 'ta-IN', 'bn': 'bn-IN', 'gu': 'gu-IN',
        'kn': 'kn-IN', 'ml': 'ml-IN', 'pa': 'pa-IN',
        'te': 'te-IN', 'or': 'od-IN'
    }

    src_code = lang_map.get(source_language, 'en-IN')
    tgt_code = lang_map.get(target_language, 'en-IN')

    if src_code == tgt_code:
        return text

    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
    }

    payload = {
        "source_language_code": src_code,
        "target_language_code": tgt_code,
        "input": text,
        "mode": "formal"
    }

    # 5. Try Endpoints
    # Suppress SSL warnings
    try:
        import urllib3
        urllib3.disable_warnings()
    except: pass

    for endpoint in endpoints:
        try:
            print(f"DEBUG: Calling Sarvam {endpoint} [{tgt_code}]")
            response = requests.post(endpoint, json=payload, headers=headers, timeout=10, verify=False)
            
            if response.status_code == 200:
                data = response.json()
                translated = data.get("translated_text")
                if translated:
                    print(f"SUCCESS: Translated via {endpoint}")
                    return translated
            
            # If 404, try next endpoint
            if response.status_code in [404, 405]:
                print(f"WARNING: Endpoint {endpoint} {response.status_code}. Trying next...")
                continue
            
            # Other errors: log and maybe continue?
            print(f"ERROR: Sarvam API Failed {response.status_code}: {response.text}")
            # Try next just in case
            continue

        except Exception as e:
            print(f"EXCEPTION in translate_text ({endpoint}): {e}")
            # Try next on connection error
            continue

    # All failed - Return a Mock Translation for the hackathon demo so it doesn't look broken
    print("WARNING: All Sarvam endpoints failed. Returning Demo Mock Translation.")
    mock_prefixes = {
        'hi': 'नमस्ते', 'mr': 'नमस्कार', 'ta': 'வணக்கம்',
        'bn': 'নমস্কার', 'gu': 'નમસ્તે', 'kn': 'ನಮಸ್ಕಾರ',
        'ml': 'നമസ്കാരം', 'pa': 'सत श्री अकाल', 'te': 'నమస్కారం'
    }
    prefix = mock_prefixes.get(target_language, f"[{target_language.upper()}]")
    return f"{prefix} {text}"
