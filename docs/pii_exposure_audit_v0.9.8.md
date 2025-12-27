# Auditoría de Exposición PII - KURA OS v0.9.8

**Fecha**: 2025-12-26  
**Tipo**: Radiografía técnica de datos sensibles  
**Propósito**: Planificación de estrategia de anonimización

---

## Resumen Ejecutivo

| Área | Riesgo | Estado |
|------|--------|--------|
| Modelo `Patient` | 🔴 ALTO | 7+ campos PII directos + JSONB flexible |
| Modelo `ClinicalEntry` | 🔴 ALTO | Texto libre y JSONB sin esquema |
| Modelo `MessageLog` | 🔴 ALTO | Contenido completo de WhatsApp |
| File Storage | ✅ BAJO | UUIDs opacos, sin PII en rutas |
| Logging | 🟡 MEDIO | Logs con `patient_id` y nombres parciales |

---

## 1. EL MAPA DEL DELITO (Schema Review)

### Clase `Patient` ([models.py:321-382](file:///Users/humbert/Documents/KuraOS/backend/app/db/models.py#L321-382))

**Campos de identificación directa:**

| Campo | Tipo | Riesgo |
|-------|------|--------|
| `first_name` | String(100) | 🔴 PII directa |
| `last_name` | String(100) | 🔴 PII directa |
| `email` | String(255) | 🔴 PII directa |
| `phone` | String(50) | 🔴 PII directa |
| `birth_date` | DateTime | 🔴 Cuasi-identificador |
| `birth_time` | String(10) | 🔴 Cuasi-identificador |
| `birth_place` | String(255) | 🔴 Cuasi-identificador |
| `profile_image_url` | String(512) | 🟡 Puede contener PII en URL |

**JSONB `profile_data`** (línea 354) — **🔴 CAJÓN DE SASTRE**:
```python
profile_data: Mapped[dict] = mapped_column(JSONB, default={})
```

Estructura documentada (puede variar):
- `gender`, `pronouns`, `nationality`, `city`, `country`, `occupation`
- `preferred_contact`, `instagram`, `linkedin`
- `emergency_contact` ← 🔴 **PII de terceros**
- `referral_source`, `previous_therapy`, `medications`, `conditions`, `goals`, `notes`

> [!CAUTION]
> **`profile_data` no tiene esquema fijo**. Cualquier frontend puede enviar campos arbitrarios. Anonimización requiere iteración recursiva sobre claves desconocidas.

---

### Clase `ClinicalEntry` ([models.py:482-530](file:///Users/humbert/Documents/KuraOS/backend/app/db/models.py#L482-530))

**Campos de texto libre:**

| Campo | Tipo | Riesgo |
|-------|------|--------|
| `content` | Text | 🔴 Notas clínicas con PII potencial |
| `entry_metadata` | JSONB | 🔴 Formularios + análisis AI |

**Relación con `Patient`:**
- ✅ Solo `patient_id` como FK — **no hay duplicación de nombre**
- ⚠️ Sin embargo, `entry_metadata.answers` puede contener respuestas como "Me llamo Carlos"

**Estructura de `entry_metadata` para FORM_SUBMISSION** ([public_forms.py:170-180](file:///Users/humbert/Documents/KuraOS/backend/app/api/v1/public_forms.py#L170-180)):
```python
entry_metadata = {
    "form_template_id": str(template.id),
    "form_title": template.title,
    "answers": submission.answers,  # ← 🔴 TEXTO LIBRE
    "risk_level": risk_level,
    "risk_flags": flags,            # ← 🔴 Pueden contener keywords médicas
    ...
}
```

---

### Clase `MessageLog` ([models.py:1367-1404](file:///Users/humbert/Documents/KuraOS/backend/app/db/models.py#L1367-1404))

| Campo | Tipo | Riesgo |
|-------|------|--------|
| `content` | Text | 🔴 Mensajes WhatsApp completos |

> [!WARNING]
> `MessageLog.content` almacena **mensajes sin procesar** incluyendo transcripciones de audio. Alta probabilidad de PII (nombres propios, direcciones, datos de salud).

---

### Clase `DailyConversationAnalysis` ([models.py:1407-1447](file:///Users/humbert/Documents/KuraOS/backend/app/db/models.py#L1407-1447))

| Campo | Tipo | Riesgo |
|-------|------|--------|
| `summary` | Text | 🔴 Resumen clínico AI |
| `risk_flags` | JSONB | 🟡 Keywords médicas |
| `suggestion` | Text | 🟡 Pueden incluir contexto personal |

---

## 2. FUGAS EN ARCHIVOS (File Storage Logic)

### Endpoint de Upload ([uploads.py](file:///Users/humbert/Documents/KuraOS/backend/app/api/v1/uploads.py))

```python
# Línea 37
unique_name = f"{uuid.uuid4()}{ext}"
file_path = os.path.join(UPLOAD_DIR, unique_name)
# URL retornada: /static/uploads/{uuid}.{ext}
```

**Resultado: ✅ CONFORME**
- Los nombres de archivo son **UUIDs opacos**
- No se incluye nombre de paciente en la ruta
- Directorio plano sin org/paciente en jerarquía

> [!NOTE]
> El campo `file.filename` original **sí se retorna** en la respuesta JSON (línea 47), pero no se almacena en disco. **Verificar si el frontend lo guarda en `entry_metadata`.**

---

### Audio via WhatsApp ([transcription.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/transcription.py))

- Audio descargado a `tempfile.NamedTemporaryFile` → eliminado tras uso
- ⚠️ **Filename temporal no contiene PII**
- ✅ Audio NO se persiste en disco

---

## 3. JSONB "CAJÓN DE SASTRE"

### Campo `answers` en FormSubmission

**Riesgo: 🔴 CRÍTICO**

Cualquier campo de formulario termina aquí. Ejemplos reales posibles:
- `"birth_date": "1990-01-15"`
- `"medications": "Sertralina 50mg"`
- `"notes": "Me llamo Carlos García, mi terapeuta anterior era Dr. Pérez"`

**Ubicaciones de guardado:**
1. `ClinicalEntry.entry_metadata["answers"]` → Patient timeline
2. `Lead.notes` (línea 375): `f"Submitted via public form. Answers: {submission.answers}"`

> [!CAUTION]
> En la creación de Leads ([public_forms.py:375](file:///Users/humbert/Documents/KuraOS/backend/app/api/v1/public_forms.py#L375)), **se concatenan TODAS las respuestas en un campo Text**:
> ```python
> notes=f"Submitted via public form. Answers: {submission.answers}"
> ```
> Esto dificulta enormemente la anonimización selectiva.

---

### Campo `profile_data` en Patient

**Fuentes de escritura identificadas:**
1. [leads.py:267-282](file:///Users/humbert/Documents/KuraOS/backend/app/api/v1/leads.py#L267-282) — Conversión Lead → Patient
2. [public_booking.py:246-260](file:///Users/humbert/Documents/KuraOS/backend/app/api/v1/public_booking.py#L246-260) — Booking público

Estructura típica:
```python
profile_data = {
    "conversion_source": "lead",
    "original_lead_id": str(lead.id),
    "original_notes": lead.notes,  # ← 🔴 Contiene answers!
}
```

---

### Campo `last_insight_json` en Patient ([models.py:364](file:///Users/humbert/Documents/KuraOS/backend/app/db/models.py#L364))

Caché de análisis AI. Puede contener:
- Resúmenes de sesiones con nombres propios mencionados
- Contexto clínico extraído de formularios

---

## 4. LOGS Y TRAZAS

### Configuración de Logging

El sistema usa `logging` estándar de Python. **No hay logging central configurado** — cada módulo define su propio `logger = logging.getLogger(__name__)`.

### Logs con PII Identificados

**🔴 twilio_webhook.py:119-121:**
```python
logger.info(
    f"✅ Stored message from patient {patient.first_name} {patient.last_name}"
)
```
→ **Nombre completo del paciente en logs de producción**

**🟡 transcription.py:52-53:**
```python
logger.info(f"📥 Downloading audio from Twilio...")
logger.info(f"📍 URL: {media_url}")
```
→ URL de Twilio puede contener IDs, no PII directa

**🟡 transcription.py:81:**
```python
logger.info(f"📝 Transcription: {content[:80]}...")
```
→ **80 primeros caracteres de audio transcrito** — puede contener PII

**🟡 twilio_webhook.py:68:**
```python
logger.info(f"🎤 Audio message from {phone_clean}, transcribing...")
```
→ Teléfono limpio (sin whatsapp:) — **PII directa**

**🟡 twilio_webhook.py:87:**
```python
logger.info(f"📱 WhatsApp from {phone_clean}: {content[:50]}...")
```
→ Teléfono + 50 primeros caracteres del mensaje

**🟡 automation_engine.py:218, 247:**
```python
logger.warning(f"HIGH RISK patient {patient_id} - therapist notified")
logger.info(f"LOW RISK patient {patient_id} - payment link sent")
```
→ UUID del paciente (pseudoanonimizado, pero correlacionable)

---

## Matriz de Impacto para Anonimización

| Tabla | Campos a Anonimizar | Dificultad | Estrategia |
|-------|---------------------|------------|-----------|
| `patients` | first_name, last_name, email, phone, birth_* | 🟡 Media | Tokenización reversible |
| `patients.profile_data` | Recursivo, esquema variable | 🔴 Alta | JSON schema + masking |
| `clinical_entries.content` | Texto libre | 🔴 Alta | NER + redaction |
| `clinical_entries.entry_metadata` | answers + análisis AI | 🔴 Alta | Schema-aware masking |
| `message_logs.content` | Mensajes completos | 🔴 Alta | NER + pseudoanonimización |
| `daily_conversation_analyses` | summary, suggestion | 🔴 Alta | AI re-generation sin PII |
| `leads.notes` | Concatenación de answers | 🔴 Alta | Separación o eliminación |

---

## Recomendaciones Inmediatas

1. **🔴 URGENTE**: Eliminar logs de nombres en `twilio_webhook.py:119-121`
2. **🔴 URGENTE**: No truncar mensajes en logs — eliminar completamente
3. **🟡 CORTO PLAZO**: Definir JSON Schema para `profile_data`
4. **🟡 CORTO PLAZO**: Separar `answers` de `Lead.notes` en campo JSONB dedicado
5. **🟢 MEDIO PLAZO**: Implementar capa de pseudoanonimización con tokens reversibles
6. **🟢 MEDIO PLAZO**: Pipeline NER para sanitizar `ClinicalEntry.content` antes de almacenar
