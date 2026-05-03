from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from backend.routers.auth import get_current_user
from backend.models import User, CampaignMessage, CandidateProgress
from backend.database import get_db
from pydantic import BaseModel

class ProgressCreate(BaseModel):
    phase_id: int

router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class MessageCreate(BaseModel):
    content: str

@router.post("/campaign")
def submit_campaign_message(message_in: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Submits a new campaign message. 
    The content is automatically reviewed by Gemini AI for compliance with election rules.
    """
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can submit campaign messages.")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        prompt = f"""
        You are an automated content moderation AI for the Election Commission.
        Review the following campaign message submitted by a political candidate.
        Flag it if it contains hate speech, misinformation, or explicit content.
        Respond STRICTLY in JSON format:
        {{
            "status": "approved" | "quarantined",
            "reason": "Explain why it was quarantined, or leave empty if approved."
        }}
        
        Message: "{message_in.content}"
        """
        response = model.generate_content(prompt)
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw_text)
        
        status = result.get("status", "quarantined")
        reason = result.get("reason", "Failed to parse AI response securely.")

        # Save to DB
        new_msg = CampaignMessage(
            candidate_id=current_user.id,
            content=message_in.content,
            status=status,
            flagged_reason=reason if status == "quarantined" else None
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        return {"message_id": new_msg.id, "status": status, "reason": new_msg.flagged_reason}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign")
def get_campaign_messages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves history of campaign messages submitted by the candidate.
    """
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    messages = db.query(CampaignMessage).filter(CampaignMessage.candidate_id == current_user.id).order_by(CampaignMessage.timestamp.desc()).all()
    return messages

@router.post("/progress")
def save_candidate_progress(request: ProgressCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Marks a campaign phase as completed for the candidate.
    """
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can use this endpoint")
    
    # Check if already exists
    existing = db.query(CandidateProgress).filter(
        CandidateProgress.candidate_id == current_user.id,
        CandidateProgress.phase_id == request.phase_id
    ).first()
    
    if existing:
        return {"status": "already_completed"}
    
    progress = CandidateProgress(candidate_id=current_user.id, phase_id=request.phase_id)
    db.add(progress)
    db.commit()
    return {"status": "ok"}

@router.get("/progress")
def get_candidate_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the list of campaign phases completed by the candidate.
    """
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    progress = db.query(CandidateProgress).filter(CandidateProgress.candidate_id == current_user.id).all()
    return [p.phase_id for p in progress]
