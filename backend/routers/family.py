from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.routers.auth import get_current_user
from backend.models import User, FamilyMember
from backend.database import get_db
from backend.schemas import FamilyMemberCreate, FamilyMemberResponse

router = APIRouter()

@router.get("/", response_model=List[FamilyMemberResponse])
def get_family_members(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()

@router.post("/", response_model=FamilyMemberResponse)
def add_family_member(member: FamilyMemberCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_member = FamilyMember(
        user_id=current_user.id,
        name=member.name,
        age=member.age,
        relation=member.relation,
        voter_id=member.voter_id,
        is_registered=member.is_registered
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@router.put("/{member_id}", response_model=FamilyMemberResponse)
def update_family_member(member_id: int, member: FamilyMemberCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_member = db.query(FamilyMember).filter(FamilyMember.id == member_id, FamilyMember.user_id == current_user.id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db_member.name = member.name
    db_member.age = member.age
    db_member.relation = member.relation
    db_member.voter_id = member.voter_id
    db_member.is_registered = member.is_registered
    
    db.commit()
    db.refresh(db_member)
    return db_member

@router.delete("/{member_id}")
def delete_family_member(member_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_member = db.query(FamilyMember).filter(FamilyMember.id == member_id, FamilyMember.user_id == current_user.id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db.delete(db_member)
    db.commit()
    return {"message": "Member removed successfully"}
