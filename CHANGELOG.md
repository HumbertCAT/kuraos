# Changelog

All notable changes to KURA OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-23

### 🎉 Initial Public Release

KURA OS is now live! A complete operating system for therapists to manage their practice.

### Added

#### Core Platform
- **Authentication System**: JWT-based authentication with HttpOnly cookies, shared across `*.kuraos.ai` subdomains
- **Multi-tenant Architecture**: Organizations with SOLO/TEAM types, user roles (OWNER, ADMIN, THERAPIST, ASSISTANT)
- **Patient Management**: Full CRUD for patients with clinical journey tracking
- **Clinical Entries**: Session notes, preparation guides, integration notes with AI analysis
- **AI-Powered Insights**: Patient risk assessment, engagement scoring, and therapeutic suggestions

#### Booking & Scheduling
- **Service Types**: Create services (1:1 or group) with customizable duration, pricing, and forms
- **Availability Schedules**: Weekly recurring availability with specific date overrides
- **Public Booking Page**: Unauthenticated booking flow for clients at `/book/{therapist_id}`
- **Booking Management**: View, approve, and manage bookings from the dashboard

#### Forms & Automation
- **Form Builder**: Create intake forms with various field types
- **Form Assignments**: Send forms to patients with expiring tokens
- **Public Form Submissions**: Clients can submit forms without authentication

#### Settings & Billing
- **User Preferences**: Locale, AI output preferences, profile settings
- **Stripe Integration**: Payment processing for services
- **Credit System**: AI credits with monthly quotas and purchased credits

#### Admin Panel (Superuser)
- **Organization Management**: View and manage all organizations
- **System Settings**: Configure tier limits and global settings
- **Database Migrations**: In-app migration controls

### Infrastructure
- **Frontend**: Next.js 16 with Turbopack, deployed on Vercel
- **Backend**: FastAPI with async SQLAlchemy, deployed on Google Cloud Run
- **Database**: PostgreSQL on Cloud SQL
- **Authentication**: JWT tokens in HttpOnly cookies with `.kuraos.ai` domain sharing

### Fixed (Pre-release)
- Mixed Content errors resolved with `ProxyHeadersMiddleware` for correct HTTPS redirects
- Service creation 500 errors fixed by adding missing `schedule_id` and `scheduling_type` columns
- Public booking 404 errors fixed by correcting API paths and auto-linking therapists to services
- CORS configuration updated to support `localhost:3001` for local development
- Trailing slash redirects handled to prevent 307 loops

### Security
- All API calls enforce HTTPS for production domain
- HttpOnly cookies prevent XSS token theft
- CORS properly configured for production and development origins

---

## [Unreleased]

### Planned
- Google OAuth integration
- Calendar sync (Google Calendar, Outlook)
- Email notifications and reminders
- Video session integration
- Mobile app (React Native)
