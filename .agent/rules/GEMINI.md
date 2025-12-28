# KURA OS Agent Rules

## Language
- Reply in Spanish unless asked otherwise
- Code comments in English

## Code Style
- NO hardcoded colors → use semantic tokens (`bg-card`, not `bg-white`)
- ALL queries MUST filter by `organization_id` (multi-tenancy)
- Patients = SOFT DELETE only (HIPAA/GDPR)
- Leads = HARD DELETE allowed

## Architecture
- Clinical data (patients) ≠ Marketing data (leads)
- Use `useTerminology()` hook → never hardcode "paciente"
- JWT in httpOnly cookies
- Production uses Cloud SQL Unix sockets

## Releases
- ALWAYS update: CHANGELOG → README → ROADMAP
- Use `/publish-release` workflow for any release
- Tag format: `vX.Y.Z`

## Security
- Never commit credentials to git
- Secrets in Google Secret Manager only
- `.env` is for LOCAL development only
