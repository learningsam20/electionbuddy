from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from backend.schemas import ChatRequest, ChatResponse
from backend.routers.auth import get_current_user
from backend.models import User, ChatMessage
from backend.database import SessionLocal

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Safety settings to ensure responsible AI
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

@router.post("/query", response_model=ChatResponse)
def query_gemini(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Query Gemini with role-based system instructions and chat history.
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    db = SessionLocal()
    try:
        # Fetch last 5 messages for history context
        history_msgs = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
        history_msgs.reverse()

        # Construct history for Gemini
        gemini_history = []
        for m in history_msgs:
            gemini_history.append({"role": m.role, "parts": [m.content]})

        # System Instruction
        system_instruction = (
            f"You are ElectionBuddy, a premium AI election assistant for India. "
            f"The user is a {current_user.role} from {current_user.district}. "
            f"Provide accurate, non-partisan, and encouraging information about democratic processes. "
            f"If the user is a candidate, assist with campaign ethics and MCC compliance. "
            f"If the user is a citizen, help them understand voting steps and candidate backgrounds."
        )
        
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction,
            safety_settings=SAFETY_SETTINGS
        )
        
        # Start chat with history
        chat = model.start_chat(history=gemini_history)
        
        # Add context to current prompt if provided
        user_prompt = request.prompt
        if request.context:
            user_prompt = f"Context: {request.context}\n\nUser Question: {request.prompt}"

        response = chat.send_message(user_prompt)
        
        # Persist conversation to DB
        db.add(ChatMessage(user_id=current_user.id, role="user", content=request.prompt))
        db.add(ChatMessage(user_id=current_user.id, role="model", content=response.text))
        db.commit()
        
        return ChatResponse(
            response=response.text,
            audio_reply_url=None
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
