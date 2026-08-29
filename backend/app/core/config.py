import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# On Vercel, writeable directory is /tmp
IS_VERCEL = bool(os.getenv("VERCEL"))
if IS_VERCEL:
    DEFAULT_DB_PATH = "/tmp/dayforge.db"
    UPLOAD_DIR = Path("/tmp/uploads")
else:
    DEFAULT_DB_PATH = str(BASE_DIR / "dayforge.db")
    UPLOAD_DIR = BASE_DIR / "app" / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "DayForge"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dayforge-super-secret-key-2026-build-habits-level-yourself")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (supports SQLite local/tmp or PostgreSQL like Neon/Supabase)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}")
    
    # CORS (allows Vercel preview domains and production origins)
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*"
    ]
    
    # File Storage
    UPLOAD_PATH: Path = UPLOAD_DIR
    MAX_AVATAR_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
