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
