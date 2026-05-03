from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.routers.auth import get_current_user
from backend.models import User, Telemetry
from backend.database import get_db

router = APIRouter()

@router.get("/telemetry")
def get_telemetry_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can view telemetry")
    
    total_requests = db.query(Telemetry).count()
    
    # Calculate error rate (500s or 400s)
    error_count = db.query(Telemetry).filter(Telemetry.status_code >= 400).count()
    error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
    
    # Average Latency
    avg_latency = db.query(func.avg(Telemetry.latency_ms)).scalar() or 0
    
    # Top Endpoints
    top_endpoints = db.query(Telemetry.endpoint, func.count(Telemetry.id).label('hits'))\
                      .group_by(Telemetry.endpoint)\
                      .order_by(func.count(Telemetry.id).desc())\
                      .limit(5)\
                      .all()
                      
    return {
        "total_requests": total_requests,
        "error_rate": round(error_rate, 2),
        "average_latency_ms": round(avg_latency, 2),
        "top_endpoints": [{"path": e.endpoint, "hits": e.hits} for e in top_endpoints]
    }
