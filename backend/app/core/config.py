import os
import json
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "INFRANEX AI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "infranex-civic-intelligence-secure-jwt-secret-key-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./infranex.db")
    BACKEND_CORS_ORIGINS: List[str] = [
        "https://infranexai.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    MAX_REQUEST_BODY_BYTES: int = 15 * 1024 * 1024  # 15 MB anti-DoS limit
    AI_MODEL_WEIGHTS_PATH: str = os.getenv("AI_MODEL_WEIGHTS_PATH", "")

settings = Settings()
