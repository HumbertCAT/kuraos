# 📊 How-To: Plan & Tier System

> **Last updated:** 2025-12-15

Este documento explica el sistema de tiers, límites, y cómo funciona el control de acceso basado en roles.

---

## 1. Los Tres Tiers

| Tier | Límite Pacientes | Precio | Características |
|------|------------------|--------|-----------------|
| **BUILDER** | 3 | Gratis | Funcionalidades básicas |
| **PRO** | 50 | €X/mes | Límites extendidos |
| **CENTER** | 150 | €X/mes | Todo + Risk Shield auto-block |

### Configuración en Base de Datos

Los límites se almacenan en la tabla `system_settings`:

```sql
-- Ver límites actuales
SELECT key, value, description FROM system_settings 
WHERE key LIKE 'TIER_LIMIT_%';

-- Resultado:
-- TIER_LIMIT_BUILDER  | 3   | Max active patients for BUILDER tier
-- TIER_LIMIT_PRO      | 50  | Max active patients for PRO tier
-- TIER_LIMIT_CENTER   | 150 | Max active patients for CENTER tier
```

### Actualizar Límites

```bash
# Desde el backend container
docker-compose exec backend python -m app.scripts.seed_tiers
```

O manualmente en PostgreSQL:
```sql
UPDATE system_settings SET value = 10 WHERE key = 'TIER_LIMIT_BUILDER';
```

---

## 2. Roles de Usuario (RBAC)

| Rol | Descripción | Acceso Clínico |
|-----|-------------|----------------|
| **OWNER** | Propietario de la organización | ✅ Ve todas las notas |
| **THERAPIST** | Terapeuta empleado | ✅ Ve notas públicas + propias |
| **ASSISTANT** | Asistente administrativo | ❌ Sin acceso clínico |

### Dependencies en Backend

```python
# En endpoints que requieren OWNER
from app.api.deps import CurrentOwner

@router.post("/billing")
async def update_billing(user: CurrentOwner): ...

# En endpoints que requieren acceso clínico (OWNER o THERAPIST)
from app.api.deps import CurrentClinicalUser

@router.post("/clinical-entries")
async def create_entry(user: CurrentClinicalUser): ...
```

---

## 3. Límite de Pacientes

### Cómo Funciona

1. Al crear un paciente (`POST /patients`), el sistema:
   - Obtiene el tier de la organización
   - Consulta el límite en `system_settings`
   - Cuenta pacientes actuales
   - Si `actual >= límite` → Error 403

### Respuesta de Error

```json
{
  "detail": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "Patient limit reached (3). Upgrade to add more patients.",
    "current": 3,
    "limit": 3,
    "tier": "BUILDER"
  }
}
```

### Frontend: Mostrar Upgrade

El componente `PlanUsageWidget` (en el menú de usuario) muestra:
- Uso actual: `X/Y pacientes`
- Barra de progreso (verde → amarillo → rojo)
- CTA "Ampliar plan" cuando usage > 50%

---

## 4. Risk Shield (Escudo de Riesgo)

### Comportamiento por Tier

| Tier | Alerta Email | Auto-Block |
|------|--------------|------------|
| BUILDER | ✅ | ❌ |
| PRO | ✅ | ❌ |
| CENTER | ✅ | ✅ |

### Lógica en AutomationEngine

```python
# automation_engine.py - línea ~140
if org.tier == OrgTier.CENTER:
    # Bloqueo automático
    await self._update_patient_journey_status(
        patient_id, "intake", "BLOCKED_HIGH_RISK"
    )
    logger.warning("AUTO-BLOCKED (CENTER tier)")
else:
    # Solo alerta, sin bloqueo
    logger.info("auto-block skipped")
```

### Email incluye hint de upgrade

Para tiers no-CENTER, el email de alerta incluye:
```
"Activa el plan Center para bloqueo automático"
```

---

## 5. Service-Therapist Assignment

### Tabla M2M

```sql
CREATE TABLE service_therapist_link (
    service_type_id UUID REFERENCES service_types(id),
    user_id UUID REFERENCES users(id),
    PRIMARY KEY (service_type_id, user_id)
);
```

### Asignación Automática

La migración asigna todos los servicios existentes al OWNER:

```sql
INSERT INTO service_therapist_link (service_type_id, user_id)
SELECT st.id, u.id 
FROM service_types st
JOIN users u ON u.organization_id = st.organization_id
WHERE u.role = 'OWNER';
```

### Filtrado en Booking Público

`GET /public/booking/services?therapist_id=X` solo devuelve servicios asignados a ese terapeuta:

```python
select(ServiceType)
.join(service_therapist_link)
.where(service_therapist_link.c.user_id == therapist_id)
```

---

## 6. Widget de Uso

### Endpoint

```
GET /api/v1/auth/me/usage
```

**Response:**
```json
{
  "active_patients": 2,
  "limit": 3,
  "usage_percent": 66.7,
  "tier": "BUILDER"
}
```

### Componente Frontend

`frontend/components/PlanUsageWidget.tsx`

Se muestra en el dropdown de usuario y cambia color según uso:
- 🟢 < 75%: verde
- 🟡 75-90%: amarillo
- 🔴 > 90%: rojo

---

## 7. Migrar a Nuevo Tier

Para cambiar el tier de una organización:

```sql
UPDATE organizations 
SET tier = 'PRO' 
WHERE id = 'org-uuid-here';
```

El cambio es inmediato - el nuevo límite se aplicará en la siguiente creación de paciente.

---

## 8. Troubleshooting

### "PLAN_LIMIT_REACHED" inesperado

1. Verificar tier actual de la org:
```sql
SELECT tier FROM organizations WHERE id = 'X';
```

2. Verificar límite configurado:
```sql
SELECT value FROM system_settings WHERE key = 'TIER_LIMIT_BUILDER';
```

3. Contar pacientes reales:
```sql
SELECT COUNT(*) FROM patients WHERE organization_id = 'X';
```

### Servicios no aparecen en calendario

Verificar que el terapeuta tiene servicios asignados:
```sql
SELECT st.title FROM service_types st
JOIN service_therapist_link stl ON st.id = stl.service_type_id
WHERE stl.user_id = 'therapist-uuid';
```

Si está vacío, asignar manualmente:
```sql
INSERT INTO service_therapist_link (service_type_id, user_id)
VALUES ('service-uuid', 'therapist-uuid');
```
