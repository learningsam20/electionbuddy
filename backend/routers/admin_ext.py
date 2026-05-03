from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import json
from datetime import datetime, timedelta

from backend.routers.auth import get_current_user
from backend.models import User, Telemetry, CloudUsage, AuditLog, SystemAlert, UserAlertStatus
from backend.database import get_db

from backend.schemas import RoleUpdateRequest, SystemAlertRequest

router = APIRouter()

@router.post("/system-alerts")
def create_system_alert(req: SystemAlertRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    alert = SystemAlert(
        officer_id=current_user.id,
        content_json=json.dumps({"text": req.content, "priority": "high"}),
        constituency=req.constituency or "GLOBAL"
    )
    db.add(alert)
    db.commit()
    
    # Log the action
    audit = AuditLog(user_id=current_user.id, action="CREATE_ALERT", details=f"Broadcast: {req.content[:50]}...")
    db.add(audit)
    db.commit()
    
    return {"message": "Alert broadcasted successfully"}

@router.get("/system-alerts")
def get_system_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find alerts relevant to user's constituency or GLOBAL
    alerts = db.query(SystemAlert).filter(
        (SystemAlert.constituency == "GLOBAL") | 
        (SystemAlert.constituency == current_user.district) |
        (SystemAlert.constituency == current_user.voter_id)
    ).order_by(SystemAlert.timestamp.desc()).limit(10).all()
    
    results = []
    for a in alerts:
        # Check user-specific status
        status_entry = db.query(UserAlertStatus).filter(
            UserAlertStatus.user_id == current_user.id,
            UserAlertStatus.alert_id == a.id
        ).first()
        
        status = status_entry.status if status_entry else "unread"
        snoozed_until = status_entry.snoozed_until if status_entry else None
        
        # Filter out snoozed alerts if they are still in snooze period
        if status == "snoozed" and snoozed_until and snoozed_until > datetime.utcnow():
            continue

        results.append({
            "id": a.id,
            "text": json.loads(a.content_json).get("text"),
            "constituency": a.constituency,
            "timestamp": a.timestamp,
            "status": status
        })
    return results

@router.post("/alerts/{alert_id}/status")
def update_alert_status(alert_id: int, status: str, snooze_hours: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if status not in ["read", "unread", "snoozed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    entry = db.query(UserAlertStatus).filter(
        UserAlertStatus.user_id == current_user.id,
        UserAlertStatus.alert_id == alert_id
    ).first()
    
    if not entry:
        entry = UserAlertStatus(user_id=current_user.id, alert_id=alert_id)
        db.add(entry)
    
    entry.status = status
    if status == "snoozed":
        entry.snoozed_until = datetime.utcnow() + timedelta(hours=snooze_hours)
    else:
        entry.snoozed_until = None
    
    db.commit()
    return {"message": f"Alert status updated to {status}"}

@router.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can manage roles")
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "district": u.district} for u in users]

@router.post("/update-role")
def update_user_role(req: RoleUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can manage roles")
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = req.new_role
    db.commit()
    return {"message": f"Role for {user.name} updated to {req.new_role}"}

@router.get("/telemetry")
def get_detailed_telemetry(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Latency stats
    avg_latency = db.query(func.avg(Telemetry.latency_ms)).scalar() or 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "avg_api_latency_ms": round(avg_latency, 2),
        "role_breakdown": {
            "citizen": db.query(User).filter(User.role == "citizen").count(),
            "candidate": db.query(User).filter(User.role == "candidate").count(),
            "officer": db.query(User).filter(User.role == "officer").count(),
            "admin": db.query(User).filter(User.role == "admin").count()
        }
    }

@router.get("/cloud-costs")
def get_cloud_costs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    costs = db.query(CloudUsage).all()
    return {
        "total_cost": sum(c.cost for c in costs),
        "breakdown": [
            {"service": c.service_name, "usage": c.usage_value, "cost": c.cost} for c in costs
        ]
    }

@router.get("/anomaly-detection")
def detect_anomalies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mock anomaly detection logic
    # In a real app, this would analyze Telemetry for spikes from single IPs
    return {
        "status": "Safe",
        "anomalies_detected": 0,
        "recent_spikes": []
    }

@router.get("/audit-logs")
def get_audit_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp
        } for l in logs
    ]
