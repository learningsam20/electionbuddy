import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    """
    Central configuration for the ElectionBuddy application.
    Loaded from environment variables or .env file.
    """
    PROJECT_NAME: str = "ElectionBuddy"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./election.db"
    
    # Security
    SECRET_KEY: str = "supersecretkey-for-election-buddy-demo"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # AI - Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Demo Data
    LOAD_DEMO_DATA: bool = True
    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
