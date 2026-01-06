# ADR-019: Hybrid High-Performance Architecture & Observability

## Status

**Proposed** (v1.0 - Performance & Scalability)

## Context

Actualmente, Kura OS opera bajo un modelo monolítico heredado donde el rendimiento depende de la capacidad de respuesta de una sola instancia de Cloud Run.

| Problema | Impacto |
|----------|---------|
| **Deployments lentos** | No hay separación clara entre código y assets |
| **Latencia geográfica** | Usuarios lejos de `europe-west4` experimentan tiempos de carga mayores |
| **Ceguera operacional** | Si una petición tarda 3 segundos, no sabemos si fue DB, código o red externa |
| **Cache "Sticky"** | En desarrollo rápido, cambios de frontend no se reflejan por cachés agresivas sin purga manual |

> [!NOTE]
> **Filosofía**: "Podemos gastar más, pero gastemos con cabeza". Priorizar visibilidad (gratis) antes que infraestructura (cara).

## Decision

Adoptar una arquitectura **Híbrida Cloud-Native** que desacopla el contenido estático del dinámico, instrumentada con observabilidad desde el día uno.

### Pilares de la Decisión

| Pilar | Estrategia |
|-------|-----------|
| **Static First** | Todo lo pre-renderizable (HTML, CSS, JS, Imágenes) → **Cloud Storage + Cloud CDN** |
| **Dynamic on Demand** | Solo lógica de negocio y APIs → **Cloud Run** |
| **Observability First** | **Cloud Trace** y **Profiler** para detectar cuellos de botella |
| **Admin Ops Control** | Capacidades de infraestructura (Invalidar CDN, Flush Cache) en Admin Panel |

## Architecture

```mermaid
graph TD
    User((Doctor)) --> LB[Cloud Load Balancer]
    
    subgraph "The Edge (Milisegundos)"
        LB -->|/assets/*, *.html| CDN[Cloud CDN]
        CDN --> GCS[Cloud Storage Bucket<br/>Static Assets]
    end
    
    subgraph "The Core (Lógica)"
        LB -->|/api/*| CR[Cloud Run Service<br/>Kura API]
        
        CR -->|Traza| TRACE[Cloud Trace / Profiler]
        
        CR -->|Read/Write| SQL[(Cloud SQL)]
        CR -->|Cache (Phase 3)| REDIS[(Memorystore Redis)]
    end
    
    subgraph "Admin Ops Actions"
        Dev((Ingeniero GAG)) -->|Click 'Purge CDN'| CR
        CR -->|API Call| CDN
    end
```

## Implementation Phases

### Phase 1: La Verdad (Observability) 🚀

**Target:** v1.4.x (INMEDIATO)  
**Esfuerzo:** 1 semana  
**Costo:** ~0€ (Gratis primeras 2.5M trazas)

**Objetivo:** Ver *exactamente* dónde se va el tiempo en cada petición.

**Implementación:**

```python
# backend/app/main.py

from google.cloud import trace_v1
from google.cloud import profiler

# 1. Activar Cloud Profiler (CPU/Memory)
try:
    profiler.start(
        service='kura-backend',
        service_version='1.4.0',
        verbose=3,
    )
except Exception as e:
    print(f"Profiler no inicializado: {e}")

# 2. Instrumentar rutas críticas
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI()
FastAPIInstrumentor.instrument_app(app)

# 3. Trazar llamadas custom
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@router.post("/api/v1/intelligence/analyze")
async def analyze_entry(entry_id: UUID):
    with tracer.start_as_current_span("aletheia_oracle_analysis"):
        # El tiempo aquí quedará trazado
        result = await oracle_service.analyze(entry_id)
        return result
```

**Resultado:** Waterfalls de latencia en Cloud Console.

**Prioridad:** 🔴 CRITICAL (Foundation for optimization)

---

### Phase 2: La Velocidad (Static CDN) 🏗️

**Target:** v1.5.x  
**Esfuerzo:** 2 semanas  
**Costo:** ~$5-20/mes (egress + requests)

**Objetivo:** Carga instantánea de UI y recursos pesados.

**Implementación:**

1. **Build Pipeline (Cloud Build):**

```yaml
# cloudbuild.yaml (EXTEND)

steps:
  # Backend build (existing)
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kura-backend', './backend']
  
  # Frontend build (NEW)
  - name: 'node:18'
    dir: 'apps/platform'
    args: ['npm', 'ci']
  
  - name: 'node:18'
    dir: 'apps/platform'
    args: ['npm', 'run', 'build']
  
  # Upload to GCS (NEW)
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['-m', 'rsync', '-r', '-c', '-d', 
           'apps/platform/out/', 
           'gs://kura-static-prod/']
  
  # Invalidate CDN (NEW - Ops Button automated)
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['compute', 'url-maps', 'invalidate-cdn-cache', 
           'kura-lb', '--path', '/*', '--async']
```

2. **Load Balancer Configuration:**

```
URL Map:
  /api/*     → Cloud Run Backend Service
  /assets/*  → Cloud Storage Backend Bucket
  /*         → Cloud Storage Backend Bucket (index.html fallback)
```

**Prioridad:** 🟠 HIGH (User Experience)

---

### Phase 3: La Escala (Redis Cache) 🧊

**Target:** v1.7.x (Cuando tengamos 10k+ usuarios concurrentes)  
**Esfuerzo:** 2 semanas  
**Costo:** ~$50-150/mes (Memorystore Basic)

**Objetivo:** Proteger la base de datos con capa de caché.

**Implementación:**

```python
# backend/app/services/cache/redis_service.py

import redis.asyncio as redis
from functools import wraps
import pickle

class KuraCacheService:
    """
    Servicio de caché con patrón Cache-Aside.
    """
    
    def __init__(self, host: str, port: int = 6379):
        self.redis = redis.Redis(
            host=host,
            port=port,
            decode_responses=False,  # Para pickle
        )
    
    def cached(self, ttl: int = 300):
        """
        Decorator para cachear resultados de funciones async.
        
        Args:
            ttl: Time to live en segundos (default: 5min)
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generar cache key
                cache_key = f"{func.__name__}:{args}:{kwargs}"
                
                # Intentar leer de caché
                cached_value = await self.redis.get(cache_key)
                if cached_value:
                    return pickle.loads(cached_value)
                
                # Si no existe, ejecutar función
                result = await func(*args, **kwargs)
                
                # Guardar en caché
                await self.redis.setex(
                    cache_key,
                    ttl,
                    pickle.dumps(result),
                )
                
                return result
            return wrapper
        return decorator
    
    async def flush_all(self):
        """Para el Ops Button."""
        await self.redis.flushall()


# Uso:
cache = KuraCacheService(host="10.0.0.3")  # Memorystore IP

@cache.cached(ttl=600)  # 10 minutos
async def get_patient_timeline(patient_id: UUID):
    # Esta función solo se ejecutará si no está en caché
    return await db.fetch_timeline(patient_id)
```

**Prioridad:** 🟡 MEDIUM (Nice to have, pero no urgente)

---

## Admin Ops Implementation (The "Buttons")

Para que el desarrollo sea ágil, los ingenieros necesitan botones de pánico en el Admin Panel de Kura.

### 1. Botón: "Forzar Actualización Visual" (Invalidate CDN)

**Cuándo usarlo:** Acabas de subir un cambio de CSS/JS y el cliente sigue viendo la versión vieja.

```python
# backend/app/api/v1/admin/infrastructure.py

from google.cloud import compute_v1

@router.post("/infrastructure/purge-cdn")
async def purge_cdn_cache(
    current_user: Admin = Depends(require_admin),
):
    """
    Invalida TODA la caché de la CDN.
    
    ⚠️ Cuidado: La siguiente carga será lenta para el primer usuario.
    """
    client = compute_v1.UrlMapsClient()
    
    # Invalidar todo (/*)
    invalidation_rule = compute_v1.CacheInvalidationRule(path="/*")
    
    request = compute_v1.InvalidateCacheUrlMapRequest(
        project=settings.GCP_PROJECT_ID,
        url_map="kura-lb",
        cache_invalidation_rule_resource=invalidation_rule,
    )
    
    operation = client.invalidate_cache(request=request)
    
    await log_admin_action(
        user_id=current_user.id,
        action="CDN_PURGE",
        metadata={"operation_id": operation.name},
    )
    
    return {
        "status": "initiated",
        "operation_id": operation.name,
        "eta_seconds": 10,
    }
```

**Frontend (Admin Panel):**

```tsx
// apps/platform/app/[locale]/(dashboard)/admin/infrastructure/page.tsx

async function handlePurgeCDN() {
  if (!confirm('¿Invalidar toda la CDN? Esto hará que la próxima carga sea lenta.')) {
    return;
  }
  
  const response = await fetch('/api/v1/admin/infrastructure/purge-cdn', {
    method: 'POST',
  });
  
  const data = await response.json();
  toast.success(`CDN purge iniciado. ETA: ${data.eta_seconds}s`);
}

<Button onClick={handlePurgeCDN} variant="destructive">
  🔥 Purge CDN
</Button>
```

---

### 2. Botón: "Limpiar Memoria" (Flush Redis)

**Cuándo usarlo:** Datos corruptos o antiguos persistentes en caché.

```python
# backend/app/api/v1/admin/infrastructure.py

@router.post("/infrastructure/flush-cache")
async def flush_redis_cache(
    current_user: Admin = Depends(require_admin),
):
    """
    Borra todas las claves de Redis. Tabula rasa.
    """
    try:
        await cache_service.flush_all()
        
        await log_admin_action(
            user_id=current_user.id,
            action="REDIS_FLUSH",
        )
        
        return {"status": "success", "message": "Cache cleared"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error flushing cache: {str(e)}",
        )
```

---

## Consequences

### Positive

| Beneficio | Impacto |
|-----------|---------|
| **Velocidad Extrema** | Assets desde Edge, latencia reducida >80% |
| **Debug Real** | Trace elimina "en mi local funciona". Vemos el fallo en producción |
| **Independencia** | Developers pueden limpiar cachés sin tickets a sistemas |
| **Escalabilidad** | Cloud Run escala solo cuando hay "trabajo real", ahorrando dinero |

### Negative

| Aspecto | Impacto | Mitigación |
|---------|---------|------------|
| **Complejidad de Deploy** | Pipeline tiene dos destinos (Bucket + Cloud Run) | Automatizar en Cloud Build |
| **Consistencia Eventual** | CDN tarda segundos en propagarse globalmente | Acceptable para uso normal |
| **Costo de Invalidez** | Google cobra si se abusa (miles/día) | Uso manual es gratis/despreciable |

## Related Decisions

- **ADR-014 (Async Resource Lifecycle):** Lazy loading complementa la estrategia de CDN
- **ADR-018 (Vector Search):** Trace ayudará a medir cuánto tarda realmente la búsqueda vectorial
- **v1.3.9.4 (CI/CD Automation):** Cloud Build pipeline ya existe, solo se extiende

## References

- [Cloud CDN Documentation](https://cloud.google.com/cdn/docs)
- [Cloud Trace Best Practices](https://cloud.google.com/trace/docs/setup)
- [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)

---
*Authored by: Humbert Costas & Antigravity Agent*  
*Reviewed by: Arquitecto GEM*  
*Date: 2026-01-06*
