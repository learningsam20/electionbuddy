from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from datetime import datetime

from backend.routers.auth import get_current_user
from backend.models import User, UserAction, VoterIssue, CandidateProfile
from backend.database import get_db
from backend.schemas import MaturityQuizSubmit, SocialPostRequest, ManifestoRequest, VoterIssueSubmit, FamilyLinkRequest

router = APIRouter()

@router.post("/maturity-quiz")
def submit_maturity_quiz(request: MaturityQuizSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Log the action
    action = UserAction(user_id=current_user.id, action_type="maturity_quiz_completed")
    db.add(action)
    
    # Update maturity level based on score (1-10 scale)
    # Simple logic: increase level if score is high
    if request.score > 7:
        current_user.maturity_level += 1
    
    current_user.total_points += request.score * 10
    db.commit()
    
    return {"status": "ok", "new_level": current_user.maturity_level, "points_earned": request.score * 10}

@router.post("/social-posts")
def generate_social_post(request: SocialPostRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        lang = request.target_language or current_user.language
        platform = request.platform or "Twitter"
        prompt = f"""
        Generate a smart, non-partisan social media post for {platform} to encourage voting in India. 
        Topic: {request.topic}
        Language: {lang}
        The post should be engaging, include relevant hashtags suitable for {platform}, and maintain a neutral, democratic tone.
        """
        
        response = model.generate_content(prompt)
        return {"post": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manifesto-summarizer")
def summarize_manifesto(request: ManifestoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == request.candidate_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        prompt = f"""
        Distill the following candidate profile and manifesto into quick, unbiased bullet points.
        Include "Top 3 Promises" and "Past Track Record" if available.
        
        Profile Data: {profile.master_profile_json}
        
        Respond in a clear, easy-to-read format suitable for a mobile app.
        """
        
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-issue")
def submit_voter_issue(request: VoterIssueSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = VoterIssue(
        user_id=current_user.id,
        content=request.content,
        audio_url=request.audio_url,
        constituency=request.constituency
    )
    db.add(issue)
    
    # Log action
    action = UserAction(user_id=current_user.id, action_type="issue_submitted")
    db.add(action)
    
    db.commit()
    return {"status": "ok", "message": "Issue submitted successfully"}

@router.get("/polling-booth")
def get_polling_booth(current_user: User = Depends(get_current_user)):
    # Mock data for demonstration
    return {
        "booth_name": "Kothrud Public School, Room 4",
        "address": "Paud Road, Kothrud, Pune",
        "coordinates": {"lat": 18.5074, "lng": 73.8077},
        "distance": "1.2 km",
        "estimated_wait_time": "15 mins"
    }

@router.post("/link-family")
def link_family(request: FamilyLinkRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.family_group_id = request.family_group_id
    db.commit()
    return {"status": "ok", "message": f"Successfully linked to family group: {request.family_group_id}"}
