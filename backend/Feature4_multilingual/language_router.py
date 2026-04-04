from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from .translation_service import translate_if_needed

router = APIRouter(tags=["Translation"])

class TranslationRequest(BaseModel):
    text: str
    language: str

class TranslationResponse(BaseModel):
    translated_text: str

@router.post("/translate", response_model=TranslationResponse)
async def translate_content(request: TranslationRequest):
    """
    Endpoint to translate text to the specified language.
    Executes translation in a threadpool to avoid blocking the event loop.
    """
    try:
        # Run synchronous translation in a separate thread
        translated = await run_in_threadpool(translate_if_needed, request.text, request.language)
        return TranslationResponse(translated_text=translated)
    except Exception:
        # Fallback to original text on any error
        return TranslationResponse(translated_text=request.text)
