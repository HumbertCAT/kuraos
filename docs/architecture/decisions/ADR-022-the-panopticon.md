# ADR-022: The Panopticon - HIPAA Access Audit System

**Status**: PROPOSED  
**Date**: 2026-01-08  
**Author**: GEM (Architect) + GAG  
**Priority**: 🔴 CRITICAL  
**Tier**: 1.5.2 (Q1 2026)  
**Effort**: 2 semanas  
**Dependency**: [ADR-011](./ADR-011-modular-monolith-api.md) - Trinity Refactor

---

## Context

HIPAA and GDPR regulations **mandate** logging of **ALL accesses** to Protected Health Information (PHI), including **read operations** (GET requests). Currently, Kura OS lacks an audit trail for clinical data access.

**Critical Gap**: Without access logs, we cannot:
- Prove compliance in a HIPAA audit
- Sign Business Associate Agreements (BAA) with US/EU clinics
- Detect unauthorized data access
- Provide patients with "who accessed my data" transparency (GDPR Article 15)

**Strategic Value**: This is the blocker between "toy CRM" and "medical infrastructure". Without Panopticon, we cannot sell to hospitals or regulated entities.

---

## Decision

Implement **The Panopticon**: An immutable, append-only audit log system that silently records **WHO** accessed **WHAT** clinical data and **WHEN**, specifically for the `/api/v1/practice` domain.

### Core Principles (The Constitution)

1. **Francotirador Precision**: Only log `/practice/*` endpoints (Patients, Clinical Entries, Journeys). Ignore auth, marketing, settings noise.
2. **PHI-Blind**: NEVER log response bodies (notes, diagnosis). Only metadata (user_id, resource_id, endpoint).
3. **Non-Blocking**: Use FastAPI `BackgroundTasks` for async write. Logging must NOT delay user response.
4. **Immutable**: No UPDATE or DELETE on `access_logs` table (conceptually append-only).
5. **Zero-Trust**: Log even 404/403 responses (attempted unauthorized access is critical intel).

---

## Architecture

### 1. Database Model

**File**: `backend/app/db/models.py`

```python
class AccessLog(Base):
    """Immutable audit trail for PHI access (HIPAA/GDPR compliance)."""
    __tablename__ = "access_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # WHO (Actor Context)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    actor_email = Column(String, nullable=True)  # Snapshot (user may be deleted later)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # WHAT (Resource Context)
    resource_type = Column(String, index=True)  # "patient", "clinical_entry", "journey"
    resource_id = Column(String, index=True)    # UUID extracted from URL path
    
    # HOW (Action Context)
    action = Column(String, index=True)  # "READ", "CREATE", "UPDATE", "DELETE"
    endpoint = Column(String)            # "/api/v1/practice/patients/{id}"
    http_method = Column(String)         # "GET", "POST", "PATCH", "DELETE"
    status_code = Column(Integer)        # 200, 404, 403 (critical for security)
    
    # WHY (Request Context - Optional)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
```

**Indexes**:
- `(actor_id, timestamp)` - "Show me all accesses by user X"
- `(resource_id, timestamp)` - "Show me who accessed patient Y"
- `(organization_id, timestamp)` - Per-org audit scope

**Migration**: `alembic revision -m "add_access_logs_table"`

---

### 2. Middleware: The Watcher

**File**: `backend/app/middleware/panopticon.py`

```python
import re
from uuid import UUID
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import BackgroundTasks
from app.db.models import AccessLog

UUID_PATTERN = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')

class PanopticonMiddleware(BaseHTTPMiddleware):
    """HIPAA Access Audit - Watches /practice/* endpoints only."""
    
    async def dispatch(self, request, call_next):
        # Filter: Only practice domain
        if not request.url.path.startswith("/api/v1/practice"):
            return await call_next(request)
        
        # Extract context BEFORE processing request
        actor = getattr(request.state, "user", None)
        resource_id = self.extract_resource_id(request.url.path)
        resource_type = self.infer_resource_type(request.url.path)
        
        # Process request
        response = await call_next(request)
        
        # Log in background (non-blocking)
        if actor:
            background_tasks = BackgroundTasks()
            background_tasks.add_task(
                self.log_access,
                actor_id=actor.id,
                actor_email=actor.email,
                ip=request.client.host,
                user_agent=request.headers.get("user-agent"),
                resource_type=resource_type,
                resource_id=resource_id,
                action=self.map_action(request.method),
                endpoint=request.url.path,
                http_method=request.method,
                status_code=response.status_code,
                org_id=actor.organization_id,
            )
            # Execute tasks after response sent
            await background_tasks()
        
        return response
    
    @staticmethod
    def extract_resource_id(path: str) -> str | None:
        """Extract UUID from URL path (e.g., /patients/{uuid})."""
        match = UUID_PATTERN.search(path)
        return match.group(0) if match else None
    
    @staticmethod
    def infer_resource_type(path: str) -> str:
        """Infer resource type from endpoint."""
        if "/patients/" in path:
            return "patient"
        elif "/clinical-entries/" in path:
            return "clinical_entry"
        elif "/journeys/" in path:
            return "journey"
        return "unknown"
    
    @staticmethod
    def map_action(http_method: str) -> str:
        """Map HTTP method to semantic action."""
        mapping = {
            "GET": "READ",
            "POST": "CREATE",
            "PATCH": "UPDATE",
            "PUT": "UPDATE",
            "DELETE": "DELETE",
        }
        return mapping.get(http_method, "UNKNOWN")
    
    @staticmethod
    async def log_access(**kwargs):
        """Write audit log to database (async background task)."""
        from app.db.session import async_session_maker
        async with async_session_maker() as db:
            log = AccessLog(**kwargs)
            db.add(log)
            await db.commit()
```

---

### 3. Integration Point

**File**: `backend/app/main.py`

```python
from app.middleware.panopticon import PanopticonMiddleware

# Add AFTER AuthMiddleware (requires user context)
app.add_middleware(PanopticonMiddleware)
```

**Critical Order**:
1. `AuthMiddleware` - Sets `request.state.user`
2. `PanopticonMiddleware` - Reads `request.state.user` for actor_id

---

### 4. Admin Audit Viewer

**File**: `backend/app/api/v1/admin/audit.py`

```python
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.db.models import AccessLog, User
from app.api.deps import get_current_superuser

router = APIRouter()

@router.get("/logs")
async def get_audit_logs(
    actor_id: str | None = None,
    resource_id: str | None = None,
    resource_type: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = Query(100, le=1000),
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
):
    """HIPAA Audit Trail - SUPERUSER ONLY."""
    query = select(AccessLog).order_by(AccessLog.timestamp.desc())
    
    if actor_id:
        query = query.where(AccessLog.actor_id == actor_id)
    if resource_id:
        query = query.where(AccessLog.resource_id == resource_id)
    if resource_type:
        query = query.where(AccessLog.resource_type == resource_type)
    if start_date:
        query = query.where(AccessLog.timestamp >= start_date)
    if end_date:
        query = query.where(AccessLog.timestamp <= end_date)
    
    query = query.limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {"logs": logs, "count": len(logs)}
```

**Frontend UI** (`apps/platform/app/[locale]/admin/audit/page.tsx`):
- Filter by user, date range, resource type
- Real-time updates (optional: polling/SSE)
- Export to CSV for compliance reports
- Highlight suspicious patterns (e.g., mass patient access)

---

## Consequences

### Positive

✅ **HIPAA Compliance**: Audit trail satisfies "Access Control" requirements (45 CFR § 164.308(a)(4))  
✅ **GDPR Article 15**: Patients can request "who accessed my data"  
✅ **BAA-Ready**: Can sign Business Associate Agreements with hospitals  
✅ **Security Intel**: Detect insider threats (e.g., admin accessing ex-partner's records)  
✅ **Zero Performance Impact**: Background tasks ensure sub-ms latency overhead

### Negative

⚠️ **Storage Growth**: ~200 bytes/access × 1000 requests/day = 73MB/year (negligible)  
⚠️ **Privacy Risk**: Logs contain metadata that must also be GDPR-protected  
⚠️ **Dev Overhead**: Adds logging to every `/practice` request (testability complexity)

### Mitigations

- **Retention Policy**: Auto-delete logs older than 7 years (HIPAA max retention)
- **Log Encryption**: Encrypt `access_logs` table at rest (PostgreSQL TDE)
- **Access Control**: Only SUPERUSER + compliance team can view logs

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create `AccessLog` model + migration
- [ ] Implement `PanopticonMiddleware` with UUID extraction
- [ ] Add middleware to `main.py` (after AuthMiddleware)
- [ ] Test: Generate access log for `GET /patients/{id}`
- [ ] Test: Verify 404/403 responses are logged

### Phase 2: Admin Viewer (Week 2)
- [ ] Create `/admin/audit/logs` endpoint
- [ ] Build frontend audit viewer UI
- [ ] Add filters: user, date, resource type
- [ ] CSV export functionality
- [ ] SUPERUSER-only access control

### Phase 3: Polish
- [ ] Implement log retention policy (7-year auto-delete)
- [ ] Add alerting for suspicious patterns (optional)
- [ ] Documentation: HIPAA compliance report template
- [ ] Smoke test: Full audit trail for sample patient workflow

---

## Alternatives Considered

### 1. Use PostgreSQL Audit Extension (pgAudit)
- ❌ **Rejected**: Logs ALL database operations (too noisy, breach risk)
- ❌ Requires superuser access (not available on Cloud SQL managed)

### 2. Application-Level Logging (Logger)
- ❌ **Rejected**: Not queryable, no structured data, retention hell

### 3. Google Cloud Audit Logs
- ❌ **Rejected**: Logs infrastructure events, not application-level PHI access
- ✅ **Complementary**: Use for DevOps auditing, not clinical compliance

---

## Success Metrics

1. **Coverage**: 100% of `/practice/*` endpoints logged
2. **Performance**: <1ms latency overhead (background tasks)
3. **Completeness**: 0 missing logs for production patient accesses
4. **Compliance**: Pass simulated HIPAA audit using log exports

---

## References

- [HIPAA Access Control Requirements](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html)
- [GDPR Article 15: Right of Access](https://gdpr-info.eu/art-15-gdpr/)
- [FastAPI BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- ADR-011: Modular Monolith API (Trinity Refactor)

---

**Last Updated**: 2026-01-08  
**Status**: Ready for Implementation (Q1 2026)
