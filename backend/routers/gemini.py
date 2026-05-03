from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai
import os
from backend.schemas import ChatRequest, ChatResponse
from backend.routers.auth import get_current_user
from backend.models import User

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

@router.post("/query", response_model=ChatResponse)
def query_gemini(request: ChatRequest, current_user: User = Depends(get_current_user)):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    try:
        model = genai.GenerativeModel(model_name)
        
        # System Prompt construction based on role
        system_prompt = f"You are ElectionBuddy, a helpful election assistant for India. The user is a {current_user.role}. "
        if request.context:
            system_prompt += f"Context to use: {request.context}. "
            
        full_prompt = f"{system_prompt}\nUser Query: {request.prompt}"
        
        response = model.generate_content(full_prompt)
        
        return ChatResponse(
            response=response.text,
            audio_reply_url=None # TTS can be integrated here later
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
