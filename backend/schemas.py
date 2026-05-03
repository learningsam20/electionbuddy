from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = "citizen"
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    assembly_constituency: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=120) # Must be 18+ to participate in elections
    gender: Optional[str] = None
    language: Optional[str] = "en"
    voter_id: Optional[str] = Field(None, pattern=r"^[A-Z]{3}[0-9]{7}$") # Standard Indian Voter ID format
    family_group_id: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    total_points: int
    badges_json: str
    is_active: bool
    maturity_level: int

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    audio_reply_url: Optional[str] = None

class MaturityQuizSubmit(BaseModel):
    score: int = Field(..., ge=0, le=100)
    answers_json: str

class SocialPostRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    target_language: Optional[str] = None
    platform: Optional[str] = "Twitter"

class ManifestoRequest(BaseModel):
    candidate_id: int

class VoterIssueSubmit(BaseModel):
    content: str = Field(..., min_length=10, max_length=1000)
    audio_url: Optional[str] = None
    constituency: str = Field(..., min_length=2)

class RoleUpdateRequest(BaseModel):
    user_id: int
    new_role: str

class SystemAlertRequest(BaseModel):
    content: str = Field(..., min_length=5, max_length=500)
    constituency: Optional[str] = None 

class FamilyLinkRequest(BaseModel):
    family_group_id: str = Field(..., min_length=4)

class PhaseCompleteResponse(BaseModel):
    status: str
    message: str
    points_earned: Optional[int] = 0

class FamilyMemberBase(BaseModel):
    name: str = Field(..., min_length=2)
    age: int = Field(..., ge=0, le=120)
    relation: str = Field(..., min_length=2)
    voter_id: Optional[str] = None
    is_registered: Optional[bool] = False

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMemberResponse(FamilyMemberBase):
    id: int
    user_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class GameProgressResponse(BaseModel):
    current_stage: int
    unlocked_stages: List[int]
    total_game_points: int

class GameStageCompleteRequest(BaseModel):
    stage_id: int
    points_earned: int = Field(..., ge=0)
