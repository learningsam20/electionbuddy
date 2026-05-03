from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    role: Optional[str] = "citizen"
    district: Optional[str] = None
    assembly_constituency: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    language: Optional[str] = "en"
    voter_id: Optional[str] = None
    family_group_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    total_points: int
    badges_json: str
    is_active: bool
    maturity_level: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class ChatRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    audio_reply_url: Optional[str] = None

class MaturityQuizSubmit(BaseModel):
    score: int
    answers_json: str

class SocialPostRequest(BaseModel):
    topic: str
    target_language: Optional[str] = None
    platform: Optional[str] = "Twitter"

class ManifestoRequest(BaseModel):
    candidate_id: int

class VoterIssueSubmit(BaseModel):
    content: str
    audio_url: Optional[str] = None
    constituency: str

class RoleUpdateRequest(BaseModel):
    user_id: int
    new_role: str

class SystemAlertRequest(BaseModel):
    content: str
    constituency: Optional[str] = None # Optional global or targeted

class FamilyLinkRequest(BaseModel):
    family_group_id: str

class PhaseCompleteResponse(BaseModel):
    status: str
    message: str
    points_earned: Optional[int] = 0

class FamilyMemberBase(BaseModel):
    name: str
    age: int
    relation: str
    voter_id: Optional[str] = None
    is_registered: Optional[bool] = False

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMemberResponse(FamilyMemberBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class GameProgressResponse(BaseModel):
    current_stage: int
    unlocked_stages: List[int]
    total_game_points: int

class GameStageCompleteRequest(BaseModel):
    stage_id: int
    points_earned: int
