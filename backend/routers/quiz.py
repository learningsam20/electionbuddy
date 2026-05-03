from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from backend.routers.auth import get_current_user
from backend.models import User, Quiz
from backend.database import get_db
from pydantic import BaseModel

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class SubmitQuizRequest(BaseModel):
    points_earned: int

@router.get("/generate")
def generate_quiz(phase: str = "general", difficulty: str = "medium", num_questions: int = 3, current_user: User = Depends(get_current_user)):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    try:
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
        quiz_data = json.loads(raw_text)
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
            },
            {
                "question": "Which body conducts elections in India?",
                "options": ["Supreme Court", "Parliament", "Election Commission of India", "President"],
                "correct_answer": "Election Commission of India",
                "explanation": "Article 324 of the Constitution vests the power of superintendence, direction, and control of elections in an Election Commission.",
                "reference_link": "https://eci.gov.in/about/about-eci/"
            }
        ]}

@router.post("/submit")
def submit_quiz(request: SubmitQuizRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.total_points += request.points_earned
    db.commit()
    db.refresh(current_user)
    return {"message": "Points updated", "new_total": current_user.total_points}
