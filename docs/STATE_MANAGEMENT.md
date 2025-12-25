# State Management Guide

## Zustand

> **Zustand** (del alemán "estado") es una librería minimalista para gestionar el **Estado Global** en aplicaciones React.

### ¿Por qué Zustand?

| Feature | Zustand | Redux | Context API |
|---------|---------|-------|-------------|
| Boilerplate | Mínimo | Alto | Medio |
| Re-renders | Optimizado | Manual | Todos los consumers |
| DevTools | Sí | Sí | No |
| Bundle size | ~3KB | ~15KB | 0 (built-in) |
| Learning curve | Baja | Alta | Baja |

### Stores en Kura OS

| Store | Location | Purpose |
|-------|----------|---------|
| `usePatientStore` | `stores/patient-store.ts` | Active patient for AletheIA Observatory |

---

## usePatientStore

Gestiona el paciente activo en la sesión. El sidebar AletheIA Observatory consume este store.

### State Shape

```typescript
type PatientState = {
  activePatientId: string | null;
  patientName: string | null;
  insights: AletheiaUIData | null;
  isLoading: boolean;
  error: string | null;
};
```

### Actions

| Action | Trigger | Effect |
|--------|---------|--------|
| `setActivePatient(id, name)` | Patient page loads | Sets patient, auto-fetches insights |
| `fetchInsights()` | Called by setActivePatient | GET /insights/patient/{id} |
| `refreshInsights()` | User clicks refresh | Force re-analysis |
| `clearPatient()` | Leave patient page | Reset to standby |

### Usage Example

```tsx
// In a component
import { usePatientStore } from '@/stores/patient-store';

function PatientPage({ patientId, patientName }) {
  const { setActivePatient, clearPatient } = usePatientStore();

  useEffect(() => {
    setActivePatient(patientId, patientName);
    return () => clearPatient(); // Cleanup on unmount
  }, [patientId]);
}
```

### Consuming State

```tsx
function SidebarWidget() {
  const { insights, isLoading, patientName } = usePatientStore();

  if (!patientName) return <StandbyState />;
  if (isLoading) return <Skeleton />;
  return <InsightsDisplay data={insights} />;
}
```

---

## Future Stores (Roadmap)

| Store | Purpose |
|-------|---------|
| `useBookingStore` | Active booking wizard state |
| `useNotificationStore` | Toast queue and alerts |
| `usePreferencesStore` | User UI preferences (persisted) |

---

*Last updated: 2024-12-25*
