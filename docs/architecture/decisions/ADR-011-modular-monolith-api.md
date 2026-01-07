# ADR-011: Modular Monolith API Structure

## Status
ACCEPTED (v1.3.6)

## Context
Kura OS ha superado la fase de MVP. La estructura actual de la API (`backend/app/api/v1/*.py`) es plana y mezcla dominios con diferentes niveles de sensibilidad:
- **Público:** Leads, Webhooks, Auth (Bajo riesgo de PHI).
- **Clínico:** Pacientes, Notas, Citas (Alto riesgo de PHI - HIPAA).

Esta mezcla impide:
1. **Aislamiento de Seguridad:** Riesgo de fugas de datos por importaciones cruzadas accidentales.
2. **Auditoría Granular:** Dificultad para interceptar solo el tráfico clínico para logging de acceso (HIPAA).
3. **Mantenibilidad:** Carga cognitiva alta para desarrolladores nuevos.

## Decision
Adoptaremos una arquitectura de **Monolito Modular** alineada con los 3 Pilares de Negocio (Trinity Strategy):

### Estructura de Carpetas Objetivo
```text
backend/app/api/v1/
├── core/           # System Identity (Auth, Admin, Webhooks)
├── connect/        # Pilar I: ATRAER (Leads, Public Forms, Campaigns)
├── practice/       # Pilar II: SERVIR (Patients, Bookings, Clinical) [HIPAA ZONE]
├── grow/           # Pilar III: CRECER (Analytics, Referrals)
└── intelligence/   # The Brain (AletheIA, Insights)
```

### Reglas de Importación
- **PROHIBIDO:** Importar modelos de `practice/` desde `connect/` o `grow/`.
- **PERMITIDO:** `intelligence/` puede acceder a todo (es el cerebro transversal).
- **OBLIGATORIO:** Todo endpoint en `practice/` debe pasar por `AuditMiddleware`.

## Consequences

### Positivas
- **Seguridad:** Frontera física clara. Todo lo que está en `practice/` es PHI y debe ser tratado como material radiactivo.
- **Escalabilidad:** Facilita la generación de SDKs de cliente modulares (`api.practice.patients.get`).
- **Organización:** Reduce el ruido visual y cognitivo.
- **Auditoría:** Permite aplicar middlewares de logging solo a la zona HIPAA sin impactar performance global.

### Negativas
- Requiere refactorizar todas las importaciones en `main.py` y actualizar referencias en tests.
- One-time migration effort (~1.5 semanas).

## Compliance Note

Esta separación física es un **control compensatorio** fundamental para auditorías de seguridad. Demuestra "Data Isolation" y "Least Privilege" a nivel de arquitectura.