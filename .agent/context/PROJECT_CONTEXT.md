# KURA OS Project Context

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind v4 |
| Backend | FastAPI, SQLAlchemy 2.0, PostgreSQL 15 |
| AI | Google Gemini via ProviderFactory |
| Auth | JWT cookies + Google OAuth |
| Payments | Stripe |
| Messaging | Twilio WhatsApp |

## Design System
- Tokens: `app/globals.css`
- Typography: Playfair (headings), Inter (body), JetBrains Mono (stats)
- Components: CyberCard, VitalSignCard, SentinelPulse

## Key Files
| Purpose | Path |
|---------|------|
| Settings | `backend/app/core/config.py` |
| Theme | `apps/platform/app/globals.css` |
| Migrations | `backend/alembic/` |
| Translations | `apps/platform/messages/{locale}.json` |

## Production
| Service | Platform |
|---------|----------|
| Backend | Cloud Run (`kura-backend`) |
| Frontend | Vercel |
| Database | Cloud SQL (Unix sockets) |
| Secrets | Google Secret Manager |
