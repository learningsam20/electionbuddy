from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.routers.auth import get_current_user
from backend.models import User
from backend.database import get_db

router = APIRouter()

from functools import lru_cache

@router.get("/")
@lru_cache(maxsize=32)
def get_leaderboard(district: str = None, limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves the top citizens by points in a specific district.
    Results are cached to reduce database load.
    Usernames are partially masked for privacy when viewed by others.
    """
    # Default to user's district if none provided
    query_district = district if district else current_user.district
    
    # Query top citizens in the district
    top_users = db.query(User)\
        .filter(User.role == "citizen", User.district == query_district)\
        .order_by(desc(User.total_points))\
        .limit(limit)\
        .all()
        
    result = []
    for idx, user in enumerate(top_users):
        display_name = user.name
        # Mask surname if not current user themselves
        if user.id != current_user.id:
            name_parts = user.name.split(' ')
            if len(name_parts) > 1:
                display_name = f"{name_parts[0]} {' '.join(['XXX' for _ in name_parts[1:]])}"
        
        result.append({
            "rank": idx + 1,
            "name": display_name,
            "total_points": user.total_points,
            "assembly_constituency": user.assembly_constituency
        })
        
    return result
