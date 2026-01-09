from typing import List, Optional, Union
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Kura OS"
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
    GOOGLE_LOCATION: str = "europe-west1"

    # v1.1.1 Intelligence Engine settings
    VERTEX_AI_ENABLED: bool = True  # Enable Vertex AI Model Garden
    AI_COST_MARGIN: float = 1.5  # Margin multiplier for user billing (1.5 = 50% margin)

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
    EMAIL_FROM_ADDRESS: str = "noreply@kuraos.ai"
    EMAIL_FROM_NAME: str = "Kura OS"

    # Frontend URL (for links in emails)
    # Dev: http://localhost:3001, Prod: https://app.kuraos.ai
    FRONTEND_URL: str = "http://localhost:3001"
    DEFAULT_LOCALE: str = "es"  # For localized frontend routes

    # OpenAI (Whisper audio transcription, TTS for Daily Briefing)
    OPENAI_API_KEY: Optional[str] = None

    # DEPRECATED v1.3.11: Use GOOGLE_API_KEY via ProviderFactory instead
    # Legacy variable kept for backwards compatibility, will be removed in v1.4
    GEMINI_API_KEY: Optional[str] = None  # @deprecated

    # Google Cloud Storage (media files - audio, transcriptions)
    GCS_BUCKET_NAME: str = "kura-production-media"

    # Twilio WhatsApp (Legacy - being replaced by Meta Cloud API)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_WHATSAPP_NUMBER: Optional[str] = None

    # Meta Cloud API (WhatsApp Business / Instagram Direct)
    # v1.6.5: Direct integration replacing Twilio
    META_APP_SECRET: Optional[str] = None  # For HMAC-SHA256 signature validation
    META_ACCESS_TOKEN: Optional[str] = None  # For outbound Graph API calls
    META_VERIFY_TOKEN: Optional[str] = None  # For webhook verification challenge
    META_PHONE_NUMBER_ID: Optional[str] = None  # WhatsApp Business phone number ID

    # Tier Commission Fees (static business constants)
    TIER_FEE_BUILDER: float = 0.05  # 5% platform fee for free tier
    TIER_FEE_PRO: float = 0.02  # 2% platform fee for PRO
    TIER_FEE_CENTER: float = 0.01  # 1% platform fee for CENTER

    # Note: env_file not needed - Docker injects envs via docker-compose.yml env_file directive
    # For local non-Docker development, set envs manually or use: export $(cat .env | xargs)
    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
