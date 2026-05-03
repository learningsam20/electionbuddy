from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from pydantic import BaseModel
from typing import List, Optional

from backend.routers.auth import get_current_user
from backend.models import User, CandidateProfile, VoterIssue
from backend.database import get_db

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    master_profile: dict
    youtube_urls: List[str]
    news_urls: List[str]

class CampaignAssistantRequest(BaseModel):
    topic: str
    format: str # speech, press_release, social_post

@router.post("/profile")
def update_profile(request: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can update profiles")
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.master_profile_json = json.dumps(request.master_profile)
    profile.youtube_urls = json.dumps(request.youtube_urls)
    profile.news_urls = json.dumps(request.news_urls)
    
    db.commit()
    return {"status": "ok", "message": "Profile updated"}

@router.get("/issue-heatmap")
def get_issue_heatmap(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Aggregated issues for the candidate's constituency
    issues = db.query(VoterIssue).filter(VoterIssue.constituency == current_user.assembly_constituency).all()
    
    # Simple grouping logic for demo
    heatmap = {}
    for issue in issues:
        # In a real app, we'd use Gemini to categorize issues
        # For now, we'll just return the list
        pass
    
    return {
        "constituency": current_user.assembly_constituency,
        "total_issues": len(issues),
        "issues": [
            {"id": i.id, "content": i.content, "timestamp": i.timestamp} for i in issues
        ]
    }

@router.post("/campaign-assistant")
def campaign_assistant(request: CampaignAssistantRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        prompt = f"""
        You are an AI Campaign Assistant. Help Candidate {current_user.name} draft a {request.format} about {request.topic}.
        Candidate Profile: {profile.master_profile_json if profile else "Not provided"}
        
        Ensure the content is professional, localized, and aligns with the candidate's verified past work.
        """
        
        response = model.generate_content(prompt)
        return {"content": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment-tracking")
def track_sentiment(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile or not profile.news_urls:
        return {"sentiment": "No news URLs to analyze"}
    
    # Analyze sentiment of news URLs using Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        urls = json.loads(profile.news_urls)
        prompt = f"""
        Analyze the sentiment of the following news articles related to candidate {current_user.name}:
        {urls}
        
        Provide an overall sentiment score (Positive/Neutral/Negative) and a brief justification.
        """
        
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def list_candidates(constituency: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.role == "candidate")
    if constituency:
        query = query.filter(User.assembly_constituency == constituency)
    
    candidates = query.all()
    results = []
    for c in candidates:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == c.id).first()
        results.append({
            "id": c.id,
            "name": c.name,
            "party": "Independent", # Default or fetch from profile
            "constituency": c.assembly_constituency,
            "bio": json.loads(profile.master_profile_json).get("bio") if profile and profile.master_profile_json else "Candidate dedicated to development.",
            "manifesto_url": "#",
            "video_url": json.loads(profile.youtube_urls)[0] if profile and profile.youtube_urls else "#",
            "achievements": json.loads(profile.master_profile_json).get("track_record") if profile and profile.master_profile_json else []
        })
    return results
