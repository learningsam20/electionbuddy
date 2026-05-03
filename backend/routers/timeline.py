from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.routers.auth import get_current_user
from backend.models import User, Election, TimelinePhase, UserAction, CandidateProfile, CandidateProgress
from backend.database import get_db
from backend.schemas import PhaseCompleteResponse
import json

router = APIRouter()

class PhaseCreate(BaseModel):
    title: str
    description: str
    points: int
    order_idx: int

class ElectionCreate(BaseModel):
    title: str
    type: str # national, state, district
    phases: List[PhaseCreate]

@router.post("/")
def create_election_timeline(election_in: ElectionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["officer", "admin"]:
        raise HTTPException(status_code=403, detail="Only officers can configure timelines.")
    
    # Create election
    election = Election(
        title=election_in.title,
        type=election_in.type,
        district=current_user.district # Tie to officer's district
    )
    db.add(election)
    db.commit()
    db.refresh(election)
    
    # Create phases
    for phase_in in election_in.phases:
        phase = TimelinePhase(
            election_id=election.id,
            title=phase_in.title,
            description=phase_in.description,
            points=phase_in.points,
            order_idx=phase_in.order_idx
        )
        db.add(phase)
    
    db.commit()
    return {"message": "Timeline configured successfully", "election_id": election.id}

@router.get("/list")
def get_timelines(district: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # Find relevant elections (e.g. National, or matching State/District)
        query = db.query(Election)
        if district:
            query = query.filter((Election.type == "national") | (Election.district == district))
        else:
            query = query.filter(Election.type == "national")
        
        elections = query.all()
        
        # Fallback for demo
        if not elections and district:
            return [{
                "id": 0,
                "title": f"Upcoming Elections in {district} (Demo)",
                "type": "district",
                "district": district,
                "phases": [
                    {
                        "id": 1001,
                        "title": "Voter List Verification",
                        "description": "Ensure your name is correctly listed in the local electoral roll.",
                        "points": 10,
                        "start_date": "2026-01-01T00:00:00",
                        "end_date": "2026-01-31T23:59:59",
                        "requirements_json": json.dumps(["Check Voter List"]),
                        "target_role": "both"
                    }
                ]
            }]

        results = []
        for el in elections:
            phases = db.query(TimelinePhase).filter(TimelinePhase.election_id == el.id).order_by(TimelinePhase.order_idx).all()
            phase_list = []
            for p in phases:
                phase_list.append({
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "points": p.points,
                    "start_date": p.start_date.isoformat() if p.start_date else None,
                    "end_date": p.end_date.isoformat() if p.end_date else None,
                    "requirements_json": p.requirements_json or "[]",
                    "target_role": p.target_role
                })
            
            results.append({
                "id": el.id,
                "title": el.title,
                "type": el.type,
                "district": el.district,
                "phases": phase_list
            })
        return results
    except Exception as e:
        print(f"CRITICAL ERROR in get_timelines: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/progress")
def get_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find all completed phases for this user
    actions = db.query(UserAction).filter(
        UserAction.user_id == current_user.id,
        UserAction.action_type.like("phase_completed_%")
    ).all()
    
    completed_ids = []
    for action in actions:
        try:
            phase_id = int(action.action_type.replace("phase_completed_", ""))
            completed_ids.append({"phase_id": phase_id})
        except:
            continue
            
    return completed_ids

@router.post("/complete/{phase_id}", response_model=PhaseCompleteResponse)
def complete_phase(phase_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    phase = db.query(TimelinePhase).filter(TimelinePhase.id == phase_id).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    
    # Check role compatibility
    if phase.target_role != "both" and phase.target_role != current_user.role:
        raise HTTPException(status_code=403, detail=f"This activity is for {phase.target_role}s only.")

    # Validation Logic
    requirements = json.loads(phase.requirements_json) if phase.requirements_json else []
    for req in requirements:
        req_lower = req.lower()
        
        if "voter id" in req_lower:
            if not current_user.voter_id:
                raise HTTPException(status_code=400, detail="Requirement not met: Please provide your Voter ID in your profile.")
        
        elif "quiz" in req_lower:
            quiz_action = db.query(UserAction).filter(
                UserAction.user_id == current_user.id,
                UserAction.action_type == "maturity_quiz_completed"
            ).first()
            if not quiz_action:
                raise HTTPException(status_code=400, detail="Requirement not met: Please complete the Voter Maturity Quiz.")
        
        elif "manifesto" in req_lower:
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
            if not profile or not profile.master_profile_json:
                raise HTTPException(status_code=400, detail="Requirement not met: Please submit your Master Manifesto in the Profile section.")
        
        # Add more generic validations if needed
    
    # If all requirements met, mark as complete
    # For candidates, we use CandidateProgress table
    if current_user.role == 'candidate':
        existing = db.query(CandidateProgress).filter(
            CandidateProgress.candidate_id == current_user.id,
            CandidateProgress.phase_id == phase_id
        ).first()
        if not existing:
            progress = CandidateProgress(candidate_id=current_user.id, phase_id=phase_id)
            db.add(progress)
    
    # Log generic action for everyone
    action = UserAction(user_id=current_user.id, action_type=f"phase_completed_{phase_id}")
    db.add(action)
    
    # Reward points
    current_user.total_points += phase.points
    db.commit()
    
    return {
        "status": "ok", 
        "message": f"Phase '{phase.title}' completed successfully!",
        "points_earned": phase.points
    }
