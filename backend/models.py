from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="citizen") # citizen, officer, candidate, admin
    name = Column(String)
    district = Column(String)
    assembly_constituency = Column(String)
    age = Column(Integer)
    gender = Column(String)
    language = Column(String, default="en")
    total_points = Column(Integer, default=0)
    badges_json = Column(String, default="[]")
    is_active = Column(Boolean, default=True)
    voter_id = Column(String, nullable=True)
    family_group_id = Column(String, nullable=True)

class UserAction(Base):
    __tablename__ = "user_actions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action_type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CandidateProgress(Base):
    __tablename__ = "candidate_progress"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    phase_id = Column(Integer, ForeignKey("timeline_phases.id"))
    status = Column(String, default="completed")
    timestamp = Column(DateTime, default=datetime.utcnow)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    generated_by_id = Column(Integer, ForeignKey("users.id"))
    phase = Column(String)
    questions_json = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Election(Base):
    __tablename__ = "elections"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String) # national, state, district
    district = Column(String) # applicable if state or district

class TimelinePhase(Base):
    __tablename__ = "timeline_phases"
    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"))
    title = Column(String)
    description = Column(String)
    points = Column(Integer, default=10)
    order_idx = Column(Integer)
    
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String) # user or model
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    latency_ms = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CampaignMessage(Base):
    __tablename__ = "campaign_messages"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    status = Column(String, default="pending") # approved, quarantined
    flagged_reason = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
