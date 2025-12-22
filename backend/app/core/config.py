from typing import List, Optional, Union
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TherapistOS"
    API_V1_STR: str = "/api/v1"

    # Database - using str to support Cloud SQL Unix socket format
    # Format: postgresql+asyncpg://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE
    DATABASE_URL: str

    # Security
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS - raw string, parsed in main.py (avoids pydantic-settings JSON parsing issues)
    BACKEND_CORS_ORIGINS: str = ""

    # Google AI
    GOOGLE_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-2.5-flash"  # Options: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash-exp
    GOOGLE_PROJECT_ID: Optional[str] = None
    GOOGLE_LOCATION: str = "us-central1"

    # Google OAuth (Calendar Integration)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = (
        "http://localhost:8001/api/v1/integrations/google/callback"
    )

    # Stripe Payments
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_ID_PRO: Optional[str] = None
    STRIPE_PRICE_ID_CENTER: Optional[str] = None

    # Brevo Email (transactional emails)
    BREVO_API_KEY: Optional[str] = None
    EMAIL_FROM_ADDRESS: str = "noreply@therapistos.com"
    EMAIL_FROM_NAME: str = "TherapistOS"

    # Frontend URL (for links in emails)
    # Dev: http://localhost:3001, Prod: https://therapistos.app
    FRONTEND_URL: str = "http://localhost:3001"

    # OpenAI (Whisper audio transcription)
    OPENAI_API_KEY: Optional[str] = None

    # Twilio WhatsApp
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_WHATSAPP_NUMBER: Optional[str] = None

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")


settings = Settings()
