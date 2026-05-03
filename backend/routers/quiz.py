from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from backend.routers.auth import get_current_user
from backend.models import User, Quiz, UserAction
from backend.database import get_db
from pydantic import BaseModel

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

from functools import lru_cache

@lru_cache(maxsize=16)
def _get_ai_quiz(phase: str, difficulty: str, num_questions: int):
    """
    Private helper to call Gemini for quiz generation.
    Cached to save API costs and improve response time for similar requests.
    """
    model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
    prompt = f"""
    Generate a {num_questions}-question multiple choice quiz about the Indian Election Process.
    Target Phase: '{phase}'
    Difficulty Level: {difficulty}
    
    The output MUST be strictly valid JSON without any markdown formatting or backticks.
    Format strictly like this:
    [
      {{
        "question": "What is the minimum voting age?",
        "options": ["16", "18", "21", "25"],
        "correct_answer": "18",
        "explanation": "The minimum voting age in India was lowered from 21 to 18 years by the 61st Amendment Act of 1988.",
        "reference_link": "https://eci.gov.in/"
      }}
    ]
    """
    response = model.generate_content(prompt)
    raw_text = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(raw_text)

@router.get("/generate")
def generate_quiz(phase: str = "general", difficulty: str = None, num_questions: int = 3, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates a context-aware quiz for the user. 
    Difficulty is automatically tuned based on user history if not specified.
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    # Auto-calculate difficulty if not provided
    if not difficulty:
        completed_count = db.query(UserAction).filter(
            UserAction.user_id == current_user.id,
            UserAction.action_type == "quiz_completed"
        ).count()
        
        if completed_count < 2:
            difficulty = "easy"
        elif completed_count < 5:
            difficulty = "medium"
        else:
            difficulty = "hard"
    
    try:
        quiz_data = _get_ai_quiz(phase, difficulty, num_questions)
        return {"questions": quiz_data}
        
    except Exception as e:
        # Fallback quiz if Gemini fails or parses wrong
        return {"questions": [
            {
                "question": "What is the minimum voting age in India?",
                "options": ["16", "18", "21", "25"],
                "correct_answer": "18",
                "explanation": "The 61st Constitutional Amendment Act of 1988 lowered the voting age from 21 to 18 years.",
                "reference_link": "https://eci.gov.in/"
            }
        ]}

@router.post("/submit")
def submit_quiz(request: SubmitQuizRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Submits quiz results, updates user points, and logs the action for progression.
    """
    current_user.total_points += request.points_earned
    
    # Log action for progression tracking
    action = UserAction(user_id=current_user.id, action_type="quiz_completed")
    db.add(action)
    
    db.commit()
    db.refresh(current_user)
    return {"message": "Points updated", "new_total": current_user.total_points}
