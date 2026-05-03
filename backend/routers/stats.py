from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.routers.auth import get_current_user
from backend.models import User, UserAction
from backend.database import get_db
from pydantic import BaseModel

class ActionRequest(BaseModel):
    action_type: str

router = APIRouter()

@router.get("/{district_id}")
def get_district_stats(district_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def get_family_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    action = UserAction(user_id=current_user.id, action_type=request.action_type)
    db.add(action)
    db.commit()
    return {"status": "ok", "action": request.action_type}
