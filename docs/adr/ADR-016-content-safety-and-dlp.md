# ADR-016: Vertex AI Content Safety + Sensitive Data Protection

## Status
**Proposed** (v1.3.9 - Safety Research)

## Context

### El Problema del "Shield Hardcoded"
El sistema de protección actual de AletheIA (SENTINEL) utiliza un enfoque basado en **palabras clave** (regex/listas negras) para detectar contenido de riesgo. Este enfoque presenta limitaciones críticas:

| Problema | Ejemplo | Impacto |
|----------|---------|---------|
| **Falsos Positivos** | "Quiero matar el aburrimiento" | Bloquea contextos seguros, interrumpiendo la terapia |
| **Falsos Negativos** | Metáforas dañinas no listadas | Deja pasar riesgos reales que no están en la lista |
| **Mantenimiento** | Actualizar listas manualmente | No escala, requiere intervención humana constante |
| **Sin Contexto** | "Suicidio" en contexto educativo vs. ideación | No distingue intención, solo presencia de palabra |

### El Problema de Privacidad (PII Exposure)
Actualmente, los datos del paciente fluyen sin anonimización automática hacia:
1. Los modelos de IA (exposición en prompts)
2. La base de datos (almacenamiento en texto claro)
3. Los logs de debug (riesgo de fuga)

Esto genera riesgos de cumplimiento con **GDPR**, **HIPAA** y la normativa española de protección de datos.

## Decision
Implementaremos un **Sistema de Seguridad Inteligente** de dos capas:

### Capa 1: Vertex AI Safety Attributes
Reemplazar el Shield hardcoded por los **filtros nativos de seguridad** de Vertex AI.

| Categoría | Umbral Configurable | Uso en Kura |
|-----------|---------------------|-------------|
| `HARM_CATEGORY_DANGEROUS_CONTENT` | Low / Medium / High | **SENTINEL Primary** - Detección de autolesión |
| `HARM_CATEGORY_HARASSMENT` | Low / Medium / High | Detección de abuso/bullying en narrativas |
| `HARM_CATEGORY_HATE_SPEECH` | Low / Medium / High | Contenido discriminatorio |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | Low / Medium / High | Protección en contextos de trauma |

**Lógica de Escalamiento:**
```
Dangerous Content: HIGH   → Protocolo de Emergencia (notificar terapeuta inmediatamente)
Dangerous Content: MEDIUM → Continuar con precaución (flag para revisión)
Dangerous Content: LOW    → Terapia normal (el paciente habla de experiencias pasadas)
```

### Capa 2: Sensitive Data Protection (Cloud DLP)
Integrar **Cloud DLP** como pre-procesador antes de que el texto llegue al LLM o a la base de datos.

| InfoType | Ejemplo Detectado | Acción |
|----------|-------------------|--------|
| `PERSON_NAME` | "Mi amigo Juan me dijo..." | → "Mi amigo [PERSONA] me dijo..." |
| `EMAIL_ADDRESS` | "contactame@email.com" | → "[EMAIL]" |
| `PHONE_NUMBER` | "+34 612 345 678" | → "[TELÉFONO]" |
| `SPAIN_DNI_NUMBER` | "12345678A" | → "[DNI]" |
| `MEDICAL_RECORD_NUMBER` | "HC-2024-001234" | → "[HISTORIA_CLÍNICA]" |

## Architecture

### Pipeline de Seguridad Integrado
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PATIENT INPUT                                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: CLOUD DLP (Privacy Shield)                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Original: "Mi terapeuta Juan García (juan@mail.com) me dijo    │    │
│  │            que tome Lorazepam. Tengo ganas de no existir."      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Sanitized: "Mi terapeuta [PERSONA] ([EMAIL]) me dijo           │    │
│  │             que tome [MEDICAMENTO]. Tengo ganas de no existir." │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   LAYER 2: VERTEX AI SAFETY (Risk Shield)                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Safety Analysis:                                                │    │
│  │  • DANGEROUS_CONTENT: HIGH (0.92) ← "ganas de no existir"       │    │
│  │  • HARASSMENT: LOW (0.05)                                        │    │
│  │  • HATE_SPEECH: LOW (0.02)                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL UNIT (Decision Gate)                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  IF dangerous_content >= HIGH:                                   │    │
│  │     → EMERGENCY_PROTOCOL.trigger()                               │    │
│  │     → notify_therapist(priority="CRITICAL")                      │    │
│  │  ELIF dangerous_content >= MEDIUM:                               │    │
│  │     → flag_for_review()                                          │    │
│  │     → continue_session(caution=True)                             │    │
│  │  ELSE:                                                           │    │
│  │     → continue_session()                                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration Point (Backend Service)
```python
# backend/app/services/safety/intelligent_shield.py (PROPOSED)

from google.cloud import dlp_v2
from vertexai.generative_models import HarmCategory, HarmBlockThreshold

class IntelligentShieldService:
    """
    Sistema de seguridad inteligente de dos capas.
    Reemplaza el Shield hardcoded basado en regex.
    """
    
    # Configuración de umbrales por contexto clínico
    CLINICAL_SAFETY_SETTINGS = {
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }
    
    # InfoTypes para contexto médico español
    MEDICAL_INFO_TYPES = [
        "PERSON_NAME",
        "EMAIL_ADDRESS", 
        "PHONE_NUMBER",
        "SPAIN_DNI_NUMBER",
        "SPAIN_NIE_NUMBER",
        "LOCATION",
        "DATE_OF_BIRTH",
        # Custom InfoType para historiales clínicos
    ]
    
    async def sanitize_pii(self, text: str) -> SanitizedResult:
        """
        Capa 1: Redacta PII antes de procesar con IA.
        """
        dlp = dlp_v2.DlpServiceClient()
        
        response = dlp.deidentify_content(
            request={
                "parent": f"projects/{PROJECT_ID}/locations/europe-west1",
                "deidentify_config": {
                    "info_type_transformations": {
                        "transformations": [
                            {
                                "primitive_transformation": {
                                    "replace_with_info_type_config": {}
                                }
                            }
                        ]
                    }
                },
                "item": {"value": text},
                "inspect_config": {
                    "info_types": [{"name": t} for t in self.MEDICAL_INFO_TYPES]
                }
            }
        )
        
        return SanitizedResult(
            sanitized_text=response.item.value,
            findings=response.overview.transformation_summaries,
        )
    
    async def assess_risk(self, text: str) -> RiskAssessment:
        """
        Capa 2: Evalúa riesgo usando Safety Attributes nativos.
        """
        # Los Safety Attributes se evalúan automáticamente en cada llamada
        # a Vertex AI. Aquí configuramos los umbrales y procesamos respuestas.
        ...
```

## Implementation Phases

### Phase 1: DLP Foundation (v1.4.x)
- [ ] Habilitar Cloud DLP API en proyecto GCP
- [ ] Definir Custom InfoTypes para contexto médico español (Nº Colegiado, etc.)
- [ ] Implementar `sanitize_pii()` como middleware pre-LLM
- [ ] Tests con dataset de PII sintética

### Phase 2: Safety Integration (v1.5.x)
- [ ] Migrar SENTINEL de regex a Safety Attributes
- [ ] Configurar umbrales por tier (Basic: más restrictivo, Premium: más contexto)
- [ ] Dashboard de Safety Metrics en Admin Panel
- [ ] Protocolo de emergencia automatizado

### Phase 3: Compliance Certification (v1.6.x)
- [ ] Auditoría GDPR con DLP logs
- [ ] Documentación para certificación HIPAA
- [ ] Retención y purga automática de datos sensibles

## Consequences

### Positive
- **Comprensión de matices**: Entiende intención, no solo palabras clave
- **Privacidad automática**: Cumplimiento GDPR/HIPAA sin intervención manual
- **Reducción de falsos positivos**: Menos interrupciones en sesiones legítimas
- **Escalabilidad**: No requiere mantener listas de palabras manualmente
- **Auditabilidad**: Logs detallados de detecciones y decisiones

### Negative
- **Latencia adicional**: DLP añade ~50-100ms por request
- **Costo operativo**: DLP cobra por bytes procesados (~$1-3/GB)
- **Dependencia de Google**: Los modelos de seguridad son black-box

### Mitigations
- **Caché de sanitización**: Para textos repetitivos (templates)
- **Batch processing**: Agrupar textos cortos para optimizar costos
- **Fallback local**: Mantener Shield regex como respaldo si Google falla

## Related Decisions
- **ADR-015**: AutoSxS puede evaluar la calidad del Safety Detection
- **Taxonomy v1.3**: SENTINEL es la unidad responsable de esta capa

## References
- [Vertex AI Safety Attributes](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/responsible-ai)
- [Cloud DLP Documentation](https://cloud.google.com/dlp/docs)
- [GDPR Compliance with Cloud DLP](https://cloud.google.com/architecture/gdpr-compliance-with-dlp)

---
*Authored by: Humbert Costas & Antigravity Agent*
*Date: 2026-01-06*
