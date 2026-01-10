# Walkthrough v1.7.0 — Mobile-First Architecture

**Released:** 2026-01-10  
**Theme:** "The Native Pivot"

---

## Summary

v1.7.0 transforms Kura OS into a mobile-first Progressive Web App with responsive navigation.

## Changes Made

### Phase 0: PWA Foundation
- Installed `next-pwa` for Progressive Web App support
- Created `public/manifest.json` with Kura OS branding
- Generated app icons (192x192, 512x512)
- Configured `next.config.ts` with PWA wrapper
- Added TypeScript declarations for next-pwa

### Phase 1: Layout Shell
- **`MobileNavBar.tsx`**: Bottom navigation (5 tabs: Home, Leads, Patients, Agenda, Menu)
- **`MobileHeader.tsx`**: Top bar with back, search, observatory triggers
- **`DashboardLayout.tsx`**: Refactored with responsive shell switching

## Files Changed

| File | Action |
|------|--------|
| `components/layout/MobileNavBar.tsx` | NEW |
| `components/layout/MobileHeader.tsx` | NEW |
| `app/[locale]/(dashboard)/layout.tsx` | MODIFIED |
| `public/manifest.json` | NEW |
| `public/icons/icon-*.png` | NEW |
| `next.config.ts` | MODIFIED |
| `next-pwa.d.ts` | NEW |

## Deployment

- **Backend:** Cloud Run `kura-backend-00187-z7s`
- **Frontend:** Vercel `platform-pqjcqws1s`
- **URLs:** api.kuraos.ai / app.kuraos.ai

## Verification

To test mobile view:
1. Open https://app.kuraos.ai on mobile
2. Or use Chrome DevTools → Device Toolbar → 375px width
3. Bottom navigation bar should be visible
4. Desktop sidebar should be hidden
