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
    maturity_level = Column(Integer, default=1)

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
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    requirements_json = Column(String, default="[]")
    target_role = Column(String, default="both") # citizen, candidate, both
    
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

class CampaignMessage(Base) :
    __tablename__ = "campaign_messages"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    status = Column(String, default="pending") # approved, rejected, quarantined
    flagged_reason = Column(String, nullable=True)
    ai_review_json = Column(String, nullable=True) # Detailed AI analysis
    media_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class VoterIssue(Base):
    __tablename__ = "voter_issues"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(String)
    audio_url = Column(String, nullable=True)
    constituency = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    master_profile_json = Column(String)
    campaign_specific_json = Column(String)
    youtube_urls = Column(String)
    news_urls = Column(String)
    verified_quiz_results = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemAlert(Base):
    __tablename__ = "system_alerts"
    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"))
    content_json = Column(String)
    constituency = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CloudUsage(Base):
    __tablename__ = "cloud_usage"
    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String)
    usage_value = Column(Float)
    cost = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class BoothResource(Base):
    __tablename__ = "booth_resources"
    id = Column(Integer, primary_key=True, index=True)
    booth_id = Column(String, index=True)
    district = Column(String, index=True)
    name = Column(String)
    type = Column(String) # control_room, guard_room, booth
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="Operational")

class FamilyMember(Base):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    age = Column(Integer)
    relation = Column(String)
    voter_id = Column(String, nullable=True)
    is_registered = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserAlertStatus(Base):
    __tablename__ = "user_alert_status"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    alert_id = Column(Integer, ForeignKey("system_alerts.id"))
    status = Column(String, default="unread") # read, unread, snoozed
    snoozed_until = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserGameProgress(Base):
    __tablename__ = "user_game_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    current_stage = Column(Integer, default=1)
    unlocked_stages_json = Column(String, default="[1]")
    total_game_points = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
