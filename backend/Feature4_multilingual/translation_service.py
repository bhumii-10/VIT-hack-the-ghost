from .sarvam_client import translate_text

def detect_language(text: str) -> str:
    """
    Optional heuristic for language detection.
    Currently returns 'en' as default.
    """
    # Placeholder for actual detection logic if needed later
    return "en"

def translate_if_needed(text: str, user_language: str) -> str:
    """
    Translates text if the user language is not English.
    """
    if not text:
        return ""
    
    # Normalize user_language input (e.g., 'hi', 'hi-IN' -> 'hi')
    lang_prefix = user_language.split('-')[0].lower()
    
    if lang_prefix == 'en':
        return text
        
    return translate_text(text, lang_prefix)
