from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.routers.auth import get_current_user
from backend.models import User, UserAction, Election, CandidateProgress, CampaignMessage
from backend.database import get_db
import google.generativeai as genai
import os
import json
from pydantic import BaseModel

class ActionRequest(BaseModel):
    action_type: str

router = APIRouter()

from functools import lru_cache
from typing import Dict, Any

@router.get("/{district_id}")
@lru_cache(maxsize=32)
def get_district_stats(district_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves demographic statistics for a specific district.
    Only accessible by officers and admins.
    Cached for performance.
    """
    if current_user.role not in ["officer", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view full analytics")
    
    # Query live data from the database
    base_query = db.query(User).filter(func.lower(User.district) == district_id.lower())
    
    total_registered = base_query.count()
    male_count = base_query.filter(func.lower(User.gender) == "male").count()
    female_count = base_query.filter(func.lower(User.gender) == "female").count()
    
    # Simple age brackets
    gen_z_count = base_query.filter(User.age <= 27).count()
    millennial_count = base_query.filter(User.age > 27, User.age <= 43).count()
    gen_x_count = base_query.filter(User.age > 43, User.age <= 59).count()
    boomer_count = base_query.filter(User.age > 59).count()

    # Assembly stats
    assemblies = db.query(User.assembly_constituency).filter(func.lower(User.district) == district_id.lower()).distinct()
    assembly_stats = {}
    
    for (assembly,) in assemblies:
        if not assembly:
            continue
        asm_query = base_query.filter(User.assembly_constituency == assembly)
        assembly_stats[assembly] = {
            "total": asm_query.count(),
            "male": asm_query.filter(func.lower(User.gender) == "male").count(),
            "female": asm_query.filter(func.lower(User.gender) == "female").count()
        }

    return {
        "district_id": district_id.lower(),
        "total_registered": total_registered,
        "male_count": male_count,
        "female_count": female_count,
        "gen_z_count": gen_z_count,
        "millennial_count": millennial_count,
        "gen_x_count": gen_x_count,
        "boomer_count": boomer_count,
        "assembly_stats": assembly_stats
    }

@router.get("/my/family")
def get_family_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Calculates aggregated maturity and point statistics for the current user's family group.
    """
    if not current_user.family_group_id:
        return {"family_maturity": 0, "member_count": 0, "message": "No family group set"}
    
    family_members = db.query(User).filter(User.family_group_id == current_user.family_group_id).all()
    total_points = sum(u.total_points for u in family_members)
    member_count = len(family_members)
    
    # Calculate an anonymous maturity score (avg points per member vs a target of 100)
    avg_points = total_points / member_count if member_count > 0 else 0
    maturity_percentage = min(100, int((avg_points / 100) * 100))
    
    return {
        "family_maturity": maturity_percentage,
        "member_count": member_count,
        "total_family_points": total_points
    }

@router.post("/action")
def log_user_action(request: ActionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs a specific user interaction and awards points if applicable."""
    action = UserAction(user_id=current_user.id, action_type=request.action_type)
    db.add(action)
    
    # Reward sharing
    if request.action_type == 'share_with_fellows':
        current_user.total_points += 5
        
    db.commit()
    return {"status": "ok", "action": request.action_type}

@router.get("/officer/overview")
@lru_cache(maxsize=16)
def get_officer_overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Provides a high-level overview for election officers including citizen progress
    and candidate milestones in their district.
    """
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Only officers can view this dashboard")
    
    # District Level Stats
    district = current_user.district
    citizens = db.query(User).filter(User.role == "citizen", User.district == district)
    
    total_citizens = citizens.count()
    
    # Education Progress (Quiz completions)
    quiz_stats = db.query(UserAction.user_id, func.count(UserAction.id))\
        .filter(UserAction.action_type == "quiz_completed")\
        .group_by(UserAction.user_id).all()
    
    levels = {"Level 1": 0, "Level 2": 0, "Level 3": 0}
    for _, count in quiz_stats:
        if count < 3: levels["Level 1"] += 1
        elif count < 6: levels["Level 2"] += 1
        else: levels["Level 3"] += 1

    # Candidate Stats
    candidates = db.query(User).filter(User.role == "candidate", User.district == district)
    candidate_count = candidates.count()
    
    campaign_status = db.query(CandidateProgress).join(User).filter(User.district == district).count()

    # Upcoming Elections
    elections = db.query(Election).filter(
        (Election.type == "national") | 
        (Election.type == "state") | 
        (Election.district == district)
    ).all()

    return {
        "total_citizens": total_citizens,
        "education_levels": levels,
        "candidate_count": candidate_count,
        "campaign_milestones_completed": campaign_status,
        "upcoming_elections": [
            {"id": e.id, "title": e.title, "type": e.type} for e in elections
        ]
    }

@router.get("/officer/recommendations")
def get_ai_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates AI-driven strategic recommendations for election officers based on live district data.
    """
    if current_user.role != "officer":
        raise HTTPException(status_code=403, detail="Only officers can view this")
    
    overview = get_officer_overview(current_user, db)
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"recommendation": "Gemini API key not configured. Please check your .env file."}
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        
        prompt = f"""
        You are an AI Election Advisor. Analyze the following stats for the district of {current_user.district}:
        - Total Registered Citizens: {overview['total_citizens']}
        - Citizen Education Progress: {overview['education_levels']}
        - Total Candidates: {overview['candidate_count']}
        - Candidate Milestones Met: {overview['campaign_milestones_completed']}
        - Upcoming Elections: {overview['upcoming_elections']}
        
        Provide 3-4 concise, actionable recommendations for the Election Officer to improve democratic participation or process efficiency.
        Respond in plain text with clear bullet points.
        """
        
        response = model.generate_content(prompt)
        return {"recommendation": response.text}
    except Exception as e:
        return {"recommendation": f"Error generating recommendations: {str(e)}"}
