from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "RailQR Mark"
    SECRET_KEY: str = "railqr-mark-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./railqr_mark.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    STATIC_DIR: str = "static"
    QR_IMAGE_DIR: str = "static/qr"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
