from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from pydantic import BaseModel
from typing import List, Optional

from backend.routers.auth import get_current_user
from backend.models import User, CandidateProfile, SystemAlert, AuditLog, CampaignMessage, BoothResource
from backend.database import get_db

router = APIRouter()

class AlertRequest(BaseModel):
    content: str
    target_languages: List[str]

class ModerationRequest(BaseModel):
    status: str

@router.get("/campaign-pending")
def get_pending_campaign(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    msgs = db.query(CampaignMessage).filter(CampaignMessage.status == "pending").all()
    results = []
    for m in msgs:
        cand = db.query(User).filter(User.id == m.candidate_id).first()
        results.append({
            "id": m.id,
            "candidate_name": cand.name if cand else "Unknown",
            "content": m.content,
            "media_url": m.media_url,
            "ai_review": json.loads(m.ai_review_json) if m.ai_review_json else None,
            "timestamp": m.timestamp
        })
    return results

@router.post("/campaign-moderate/{message_id}")
def moderate_campaign(message_id: int, req: ModerationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    msg = db.query(CampaignMessage).filter(CampaignMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.status = req.status
    db.commit()
    return {"message": f"Message {req.status} successfully"}

@router.get("/booth-resources")
def get_booth_resources(district: Optional[str] = None, booth_id: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["officer", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(BoothResource)
    if district:
        query = query.filter(BoothResource.district == district)
    if booth_id:
        query = query.filter(BoothResource.booth_id == booth_id)
        
    resources = query.all()
    return [
        {
            "id": r.id,
            "booth_id": r.booth_id,
            "name": r.name,
            "type": r.type,
            "lat": r.latitude,
            "lng": r.longitude,
            "status": r.status
        } for r in resources
    ]

@router.get("/ai-triage/{candidate_id}")
def ai_triage_candidate(candidate_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        prompt = f"""
        Scan the following candidate submission for hate speech, policy violations, or malicious intent.
        Submission: {profile.master_profile_json}
        
        Provide a "Safe" or "Flagged" status and explain why.
        """
        
        response = model.generate_content(prompt)
        return {"triage_result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts")
def create_multilingual_alert(request: AlertRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        translations = {"en": request.content}
        for lang in request.target_languages:
            if lang == "en": continue
            prompt = f"Translate the following election alert into {lang}: {request.content}"
            response = model.generate_content(prompt)
            translations[lang] = response.text
        
        alert = SystemAlert(
            officer_id=current_user.id,
            content_json=json.dumps(translations),
            constituency=current_user.assembly_constituency
        )
        db.add(alert)
        
        # Log action
        log = AuditLog(user_id=current_user.id, action="sent_alert", details=f"Alert sent to {current_user.assembly_constituency}")
        db.add(log)
        
        db.commit()
        return {"status": "ok", "translations": translations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resource-map")
def get_resource_map(current_user: User = Depends(get_current_user)):
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mock resource allocation data
    return {
        "constituency": current_user.assembly_constituency,
        "polling_booths": [
            {"name": "Booth 1", "security_personnel": 4, "status": "Secure"},
            {"name": "Booth 2", "security_personnel": 2, "status": "Needs Attention"},
            {"name": "Booth 3", "security_personnel": 5, "status": "Secure"}
        ]
    }
