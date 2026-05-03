from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.routers.auth import get_current_user
from backend.models import User
from backend.database import get_db

router = APIRouter()

@router.get("/")
def get_leaderboard(district: str = None, limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Default to user's district if none provided
    query_district = district if district else current_user.district
    
    # Query top citizens in the district
    top_users = db.query(User)\
        .filter(User.role == "citizen", User.district == query_district)\
        .order_by(desc(User.total_points))\
        .limit(limit)\
        .all()
        
    return [
        {
            "rank": idx + 1,
            "name": user.name,
            "total_points": user.total_points,
            "assembly_constituency": user.assembly_constituency
        }
        for idx, user in enumerate(top_users)
    ]
