from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from typing import List

from backend.routers.auth import get_current_user
from backend.models import User, UserGameProgress
from backend.database import get_db
from backend.schemas import GameProgressResponse, GameStageCompleteRequest

router = APIRouter()

@router.get("/progress", response_model=GameProgressResponse)
def get_game_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(UserGameProgress).filter(UserGameProgress.user_id == current_user.id).first()
    if not progress:
        progress = UserGameProgress(user_id=current_user.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return {
        "current_stage": progress.current_stage,
        "unlocked_stages": json.loads(progress.unlocked_stages_json),
        "total_game_points": progress.total_game_points
    }

@router.post("/complete-stage")
def complete_stage(req: GameStageCompleteRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(UserGameProgress).filter(UserGameProgress.user_id == current_user.id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    unlocked = json.loads(progress.unlocked_stages_json)
    if req.stage_id not in unlocked:
        raise HTTPException(status_code=400, detail="Stage not yet unlocked")
    
    # Unlock next stage if not already unlocked
    next_stage = req.stage_id + 1
    if next_stage not in unlocked and next_stage <= 4: # Assuming 4 stages
        unlocked.append(next_stage)
        progress.unlocked_stages_json = json.dumps(unlocked)
        progress.current_stage = next_stage
    
    progress.total_game_points += req.points_earned
    current_user.total_points += req.points_earned # Add to global points too
    
    db.commit()
    return {"message": f"Stage {req.stage_id} completed", "next_stage": next_stage}

@router.get("/scenario")
def get_ai_scenario(current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"scenario": "You are at a rally and someone offers free food to voters. What do you do?", "options": ["Accept it", "Report to EC", "Ignore"]}
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        prompt = """
        Generate a realistic ethical dilemma for a citizen during an Indian election campaign trail. 
        Focus on the Model Code of Conduct (MCC).
        Provide 3 options: one correct (following EC rules), one borderline, and one incorrect.
        Respond in JSON format: {"scenario": "text", "options": [{"text": "...", "points": 10, "feedback": "..."}, ...]}
        """
        
        response = model.generate_content(prompt)
        # Extract JSON from response (handling potential markdown formatting)
        content = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(content)
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"scenario": "A candidate is distributing cash in your colony. Your neighbors are taking it.", "options": [{"text": "Take it and vote honestly", "points": 0, "feedback": "Illegal!"}, {"text": "Report to C-Vigil app", "points": 20, "feedback": "Correct!"}, {"text": "Do nothing", "points": 5, "feedback": "Passive citizen."}]}
