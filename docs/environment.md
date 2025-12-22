# Environment Variables Setup

This document lists the required environment variables for TherapistOS.

## Setup Instructions

1. Copy this template to create your `.env` file in the project root
2. Fill in the values according to your environment

## Required Variables

```bash
# ===================
# Backend Configuration
# ===================
PROJECT_NAME=TherapistOS
SECRET_KEY=your-super-secret-key-change-this-in-production

# Database (PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=therapistos
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/therapistos

# Google AI (for Observatory)
GOOGLE_PROJECT_ID=
GOOGLE_LOCATION=us-central1

# CORS (comma-separated list of allowed origins)
BACKEND_CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# ===================
# Frontend Configuration
# ===================
NEXT_PUBLIC_API_URL=http://localhost:8001

# ===================
# Docker Compose Ports (Claude version)
# ===================
# Backend: 8001
# Frontend: 3001
# PostgreSQL: 5433
```

## Security Notes

- **Never commit `.env` files to git**
- Change `SECRET_KEY` in production
- Use strong passwords for `POSTGRES_PASSWORD`
- Keep `GOOGLE_PROJECT_ID` credentials secure
