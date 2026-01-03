# State Management Standards

> **Status**: Living Document  
> **Applies to**: `apps/platform`  
> **Version**: v1.1.20  

---

## 1. Philosophy: Server-First, Client-Enhanced

Kura OS adopts a **Server-Driven Architecture** with selective client-side state enhancement.

### 1.1 Server State: The Source of Truth

All authoritative data lives on the backend and is accessed via:
- **React Server Components (RSC)** for initial page renders
- **API calls** through `lib/api.ts` with `credentials: 'include'` for authenticated requests

**Key Pattern Observed in `lib/api.ts`:**
- Centralized `handleResponse<T>()` function manages errors
- Automatic 401 handling with `auth/logout` cleanup and redirect
- No local caching of server data in Zustand stores

### 1.2 Client State: Zustand for Interactivity

Client state via Zustand is reserved exclusively for:

| Use Case | Example |
|:---|:---|
| Multi-step wizard flows | `useBookingStore` - survives page reload mid-booking |
| UI preferences | `useUIStore` - tracks dismissed cards with time-based reset |
| High-frequency context | `usePatientStore` - active patient for AletheIA Observatory |

**Rule**: If data originates from the API, fetch it fresh. Do not mirror API data into Zustand.

---

## 2. Store Inventory

### 2.1 Persistent Stores (localStorage)

Stores using Zustand's `persist` middleware.

#### `useBookingStore`
- **File**: `stores/booking-store.ts`
- **Storage Key**: `kura-booking-store`
- **Purpose**: Public booking wizard state (4 steps: Service → Slot → Form → Payment)
- **Persistence Strategy**: `partialize` selects only essential fields
- **PII Stored**: ⚠️ Yes - `clientDetails.name`, `clientDetails.email`, `clientDetails.phone`
- **Security Feature**: `expiresAt` timestamp for zombie booking prevention

```typescript
// Anti-zombie pattern (lines 104-120)
setExpiration: (minutes) => set({ 
    expiresAt: Date.now() + (minutes * 60 * 1000) 
}),
isExpired: () => {
    const { expiresAt } = get();
    return expiresAt ? Date.now() > expiresAt : false;
}
```

#### `useUIStore`
- **File**: `stores/useUIStore.ts`
- **Storage Key**: `kuraos-ui-storage`
- **Purpose**: UI dismissal preferences with three strategies: `daily`, `session`, `permanent`
- **Persistence Strategy**: `partialize` filters out `session` dismissals from storage
- **PII Stored**: ❌ No - only card IDs and timestamps

```typescript
// Session filtering pattern (lines 78-86)
partialize: (state) => ({
    dismissedCardIds: Object.fromEntries(
        Object.entries(state.dismissedCardIds).filter(
            ([, card]) => card.strategy !== 'session'
        )
    )
})
```

### 2.2 Ephemeral Stores (Session Only)

Stores without `persist` middleware - reset on page reload.

#### `usePatientStore`
- **File**: `stores/patient-store.ts`
- **Purpose**: Active patient context for AletheIA Observatory (clinical insights, risk alerts)
- **Dual Mode**: Patient Mode (individual) + Global Mode (clinic-wide alerts)
- **PII Stored**: ❌ In-memory only, never persisted
- **Why Ephemeral**: Prevents "Patient Data Bleed" on shared computers

---

## 3. Patterns

### 3.1 The Hydration Guard Pattern

**Problem**: Next.js server-renders HTML, but persistent stores load from localStorage on the client, causing hydration mismatch errors.

**Solution**: Render a skeleton until `mounted === true`.

**Canonical Implementation** (from `BookingWizard.tsx` lines 37-100):

```tsx
export function BookingWizard() {
    const [mounted, setMounted] = useState(false);
    const { service } = useBookingStore(); // Persistent store

    // Step 1: Set mounted flag after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Step 2: Show skeleton during hydration (NOT null!)
    if (!mounted) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="space-y-4 w-full max-w-md">
                    <div className="h-2 bg-muted rounded-full animate-pulse" />
                    <div className="h-32 bg-muted rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    // Step 3: Safe to use persistent state
    return <div>{service?.title}</div>;
}
```

**Other Components Using This Pattern**:
- `ThemeHydration.tsx` - returns `null` while hydrating (acceptable for style injection)
- `TrinityNav.tsx` - navigation state
- `AletheiaObservatory.tsx` - patient context

---

## 4. Security Rules

### 4.1 PII in LocalStorage

| Classification | Rule |
|:---|:---|
| **PROHIBITED** | Clinical data: `diagnosis`, `medical_history`, `clinical_notes`, `ai_analysis` |
| **PROHIBITED** | Authentication tokens (handled via HttpOnly cookies by backend) |
| **PERMITTED (Exception)** | `useBookingStore.clientDetails` for UX continuity during wizard |

### 4.2 Patient Data Bleed Prevention

`usePatientStore` **MUST** remain ephemeral (no `persist`).

**Rationale**: On shared clinic computers, a page reload must NOT restore previous patient context. Clinicians must explicitly navigate to a patient.

### 4.3 Zombie Booking Mitigation

`useBookingStore` implements expiration timestamps to prevent abandoned bookings from persisting indefinitely.

```typescript
// Check before resuming session
if (store.isExpired()) {
    store.reset();
}
```
