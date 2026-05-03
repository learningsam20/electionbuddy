from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.routers.auth import get_current_user
from backend.models import User, Election, TimelinePhase
from backend.database import get_db

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

@router.get("/")
def get_timelines(district: Optional[str] = None, db: Session = Depends(get_db)):
    # Find relevant elections (e.g. National, or matching State/District)
    # For hackathon, just return all matching the district or national
    elections = db.query(Election).all()
    results = []
    for el in elections:
        phases = db.query(TimelinePhase).filter(TimelinePhase.election_id == el.id).order_by(TimelinePhase.order_idx).all()
        results.append({
            "id": el.id,
            "title": el.title,
            "type": el.type,
            "district": el.district,
            "phases": [{"id": p.id, "title": p.title, "description": p.description, "points": p.points} for p in phases]
        })
    return results
