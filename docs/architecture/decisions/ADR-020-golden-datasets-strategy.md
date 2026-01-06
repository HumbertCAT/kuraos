# ADR-020: Golden Datasets Strategy (Clinical Intelligence Assets)

## Status

**Proposed** (v1.0 - Data Strategy)

## Context

Kura OS genera valor único a través de interacciones clínicas reales. Cada sesión terapéutica, cada análisis de AletheIA, cada corrección de un profesional es **oro puro** para:

1. **Evaluar modelos** (ADR-015: AutoSxS) - ¿Es Gemini 3 Pro mejor que 2.5 Pro para SENTINEL?
2. **Entrenar modelos especializados** (ADR-017: Fine-Tuning) - Crear `kura-oracle-v2` con conocimiento clínico específico

Sin embargo, estos datos contienen **información sensible** (nombres, diagnósticos, detalles íntimos) que están protegidos por:
- **GDPR** (Unión Europea)
- **HIPAA** (si expandimos a USA)
- **LOPD** (España)

**La Pregunta Crítica:** ¿Cómo convertimos datos clínicos en activos de entrenamiento de forma **legal y ética**?

## Decision

Implementaremos una estrategia de **Golden Datasets** con anonimización automática en pipeline mediante Cloud DLP, garantizando que los datos usados para evaluación y entrenamiento nunca contengan PII (Personally Identifiable Information).

### Principios Fundamentales

| Principio | Implementación |
|-----------|----------------|
| **Privacy by Design** | Anonimización automática ANTES de almacenar |
| **Minimización** | Solo capturamos correcciones significativas (>10% cambio) |
| **Transparencia** | Términos de servicio claros sobre uso de datos anónimos |
| **Reversibilidad** | Derecho al Olvido: borrar fuente, datasets quedan (son anónimos) |

## Architecture

### Data Flow Pipeline

```mermaid
graph TD
    subgraph "Production (Clinical Work)"
        A[Therapist uses Kura] --> B[AletheIA generates response]
        B --> C{Therapist edits?}
        C -->|Accept| D[No capture]
        C -->|Edit >10%| E[CorrectionCollector]
    end
    
    subgraph "Sanitization Layer (ADR-016)"
        E --> F[Cloud DLP]
        F --> G[Anonymized JSONL]
        G -->|Names| H["[PERSON_NAME]"]
        G -->|DNI/NIE| I["[SPAIN_NIF_NUMBER]"]
        G -->|Emails| J["[EMAIL_ADDRESS]"]
    end
    
    subgraph "Dataset Storage"
        H & I & J --> K[(GCS: kura-training-data)]
        K --> L[/corrections/oracle/2026-01.jsonl]
        K --> M[/corrections/sentinel/2026-01.jsonl]
    end
    
    subgraph "Model Lifecycle"
        L --> N[Monthly: Build Training Set]
        N --> O[Vertex AI LoRA Fine-Tuning]
        O --> P[kura-oracle-v2]
        P --> Q[AutoSxS Evaluation]
        Q -->|Win Rate >= 60%| R[Deploy to Production]
    end
```

## Implementation Details

### 1. Dataset Types

Mantenemos **dos tipos** de Golden Datasets:

#### Type 1: Evaluation Datasets (ADR-015)

**Propósito:** Comparar modelos de forma científica (AutoSxS)

**Ubicación:** `gs://kura-evaluations/`

```
/evaluation-datasets/
  ├── sentinel/
  │   ├── golden_set_v1.jsonl      # 100+ casos de riesgo clasificados
  │   └── edge_cases.jsonl         # Falsos positivos/negativos históricos
  ├── oracle/
  │   ├── session_transcripts.jsonl
  │   └── clinical_insights_gold.jsonl
  ├── now/
  │   └── briefing_contexts.jsonl
  ├── pulse/
  │   └── chat_sentiment_samples.jsonl
  ├── scan/
  │   └── form_extraction_samples.jsonl
  └── helper/
      └── platform_qa_samples.jsonl
```

**Formato JSONL:**
```json
{
  "id": "sentinel_case_042",
  "instruction": "Analiza este formulario de admisión y detecta riesgo",
  "context": "Paciente [PERSON_NAME] reporta pensamientos recurrentes de no querer despertar...",
  "response_a": "...",  // Modelo A (candidato)
  "response_b": "..."   // Modelo B (baseline)
}
```

---

#### Type 2: Training Datasets (ADR-017)

**Propósito:** Fine-tuning de modelos especializados

**Ubicación:** `gs://kura-training-data/`

```
/training-datasets/
  ├── oracle/
  │   ├── training_set_v1.jsonl      # 500+ ejemplos curados (80%)
  │   ├── validation_set_v1.jsonl    # 100 ejemplos holdout (20%)
  │   └── corrections/               # Correcciones mensuales
  │       ├── 2026-01/
  │       │   └── raw_corrections.jsonl
  │       └── 2026-02/
  ├── sentinel/
  │   ├── training_set_v1.jsonl      # 200+ casos de riesgo
  │   └── validation_set_v1.jsonl
  └── ...
```

**Formato JSONL (Messages):**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Eres ORACLE. Tu objetivo es extraer sintomatología clínica basándote en la CIE-11."
    },
    {
      "role": "user", 
      "content": "Paciente [PERSON_NAME] reporta dificultad para dormir..."
    },
    {
      "role": "model",
      "content": "{\"symptoms\": [{\"code\": \"MB23.1\", \"name\": \"Insomnio de mantenimiento\"}]}"
    }
  ],
  "metadata": {
    "unit": "oracle",
    "therapist_id": "uuid-redacted",
    "timestamp": "2026-01-15T10:23:45Z",
    "diff_ratio": 0.35
  }
}
```

---

### 2. CorrectionCollector (Data Capture)

```python
# backend/app/services/training/correction_collector.py

from google.cloud import dlp_v2

class CorrectionCollector:
    """
    Captura correcciones de terapeutas para Golden Datasets.
    Garantiza anonimización automática antes de almacenar.
    """
    
    def __init__(self, dlp_client: dlp_v2.DlpServiceClient):
        self.dlp = dlp_client
        self.privacy_shield = PrivacyShield()  # ADR-016
    
    async def log_correction(
        self,
        unit: str,
        original_input: str,
        ai_draft: str,
        therapist_correction: str,
        therapist_id: UUID,
    ) -> None:
        """
        Captura una corrección humana para entrenamiento futuro.
        
        Workflow:
        1. Calcula diferencia (skip si <10%)
        2. Sanitiza con Cloud DLP (ADR-016)
        3. Guarda en GCS como JSONL
        """
        # 1. Filtrar ediciones triviales
        diff_ratio = self._calculate_diff(ai_draft, therapist_correction)
        
        if diff_ratio < 0.10:
            return  # Menos del 10% de cambio = aceptación implícita
        
        # 2. Sanitizar PII ANTES de guardar (CRÍTICO)
        sanitized_input = await self.privacy_shield.sanitize(original_input)
        sanitized_correction = await self.privacy_shield.sanitize(therapist_correction)
        
        # 3. Construir registro JSONL
        correction = {
            "messages": [
                {"role": "system", "content": UNIT_SYSTEM_PROMPTS[unit]},
                {"role": "user", "content": sanitized_input},
                {"role": "model", "content": sanitized_correction},  # Versión humana corregida
            ],
            "metadata": {
                "unit": unit,
                "therapist_id": str(therapist_id),
                "timestamp": datetime.utcnow().isoformat(),
                "diff_ratio": diff_ratio,
            }
        }
        
        # 4. Append a GCS (streaming)
        await self._append_to_gcs(
            bucket="kura-training-data",
            path=f"corrections/{unit}/{datetime.now().strftime('%Y-%m')}.jsonl",
            data=correction,
        )
        
        logger.info(f"Correction captured for {unit} (diff: {diff_ratio:.2%})")
```

---

### 3. PrivacyShield (DLP Integration)

```python
# backend/app/services/safety/privacy_shield.py

class PrivacyShield:
    """
    Sanitiza PII usando Cloud DLP (ADR-016).
    Garantiza cumplimiento GDPR/HIPAA.
    """
    
    # InfoTypes para contexto médico español
    MEDICAL_INFO_TYPES = [
        "PERSON_NAME",
        "EMAIL_ADDRESS",
        "PHONE_NUMBER",
        "SPAIN_NIE_NUMBER",
        "SPAIN_NIF_NUMBER",
        "LOCATION",
        "DATE_OF_BIRTH",
        "MEDICAL_RECORD_NUMBER",
    ]
    
    async def sanitize(self, text: str) -> str:
        """
        Reemplaza PII con placeholders.
        
        Example:
            Input:  "Juan García (DNI 12345678A) reporta ansiedad"
            Output: "[PERSON_NAME] ([SPAIN_NIF_NUMBER]) reporta ansiedad"
        """
        response = self.dlp.deidentify_content(
            request={
                "parent": f"projects/{PROJECT_ID}/locations/europe-west1",
                "deidentify_config": {
                    "info_type_transformations": {
                        "transformations": [{
                            "primitive_transformation": {
                                "replace_with_info_type_config": {}
                            }
                        }]
                    }
                },
                "item": {"value": text},
                "inspect_config": {
                    "info_types": [{"name": t} for t in self.MEDICAL_INFO_TYPES]
                }
            }
        )
        
        return response.item.value
```

---

### 4. Monthly Dataset Builder

```python
# backend/app/services/training/dataset_builder.py

class DatasetBuilder:
    """
    Consolida correcciones mensuales en training/validation sets.
    """
    
    async def build_monthly_dataset(
        self,
        unit: str,
        month: str = "2026-01",
        train_split: float = 0.8,
    ) -> DatasetBuildResult:
        """
        Lee todas las correcciones del mes y crea train/validation split.
        
        Args:
            unit: oracle, sentinel, etc.
            month: YYYY-MM
            train_split: 80% para training, 20% para validation
        """
        # 1. Leer correcciones del mes
        corrections_path = f"gs://kura-training-data/corrections/{unit}/{month}.jsonl"
        corrections = await self._read_jsonl(corrections_path)
        
        # 2. Filtrar correcciones de calidad
        valid_corrections = [
            c for c in corrections
            if c["metadata"]["diff_ratio"] >= 0.15  # Cambios significativos
        ]
        
        # 3. Shuffle y split
        random.shuffle(valid_corrections)
        split_idx = int(len(valid_corrections) * train_split)
        
        training_set = valid_corrections[:split_idx]
        validation_set = valid_corrections[split_idx:]
        
        # 4. Guardar
        await self._write_jsonl(
            f"gs://kura-training-data/{unit}/training_set_{month}.jsonl",
            training_set,
        )
        await self._write_jsonl(
            f"gs://kura-training-data/{unit}/validation_set_{month}.jsonl",
            validation_set,
        )
        
        return DatasetBuildResult(
            training_count=len(training_set),
            validation_count=len(validation_set),
            month=month,
        )
```

---

## Legal & Compliance

### GDPR Compliance

| Article | Requirement | Kura Implementation |
|---------|-------------|---------------------|
| **Art. 6 (Lawfulness)** | Datos anónimos no son "datos personales" | Cloud DLP elimina PII antes de almacenar |
| **Art. 9 (Health Data)** | Requiere consentimiento explícito para datos de salud | Datos anonimizados = fuera del scope de Art. 9 |
| **Art. 17 (Right to Erasure)** | Borrar datos a petición | Fuente borrada, datasets quedan (anónimos) |
| **Art. 25 (Data Protection by Design)** | Privacy desde el diseño | Pipeline DLP obligatorio, no opcional |

### HIPAA Safe Harbor

Cloud DLP elimina los **18 identificadores** requeridos:

1. ✅ Names → `[PERSON_NAME]`
2. ✅ Geographic subdivisions → `[LOCATION]`
3. ✅ Dates (birth, admission) → `[DATE_OF_BIRTH]`
4. ✅ Phone numbers → `[PHONE_NUMBER]`
5. ✅ Email addresses → `[EMAIL_ADDRESS]`
6. ✅ Medical record numbers → `[MEDICAL_RECORD_NUMBER]`
7. ✅ Account numbers → `[ACCOUNT_NUMBER]`
8-18. ✅ Otros identificadores (IP, SSN, etc.)

> [!IMPORTANT]
> **Safe Harbor Rule:** Si se eliminan los 18 identificadores, los datos **no son PHI** (Protected Health Information) y pueden usarse sin restricciones HIPAA.

---

## Implementation Roadmap

### Phase 1: Foundation (v1.5.x) - Q1 2026

**Objetivo:** Infraestructura básica + primer dataset piloto

- [ ] Activar Cloud DLP API en `europe-west1`
- [ ] Implementar `PrivacyShield` con InfoTypes españoles
- [ ] Implementar `CorrectionCollector` en backend
- [ ] Frontend: Hook de captura cuando terapeuta edita respuesta AI
- [ ] **Meta:** 100 correcciones de ORACLE capturadas y sanitizadas

**Deliverable:** `gs://kura-training-data/corrections/oracle/2026-01.jsonl`

---

### Phase 2: Scaling (v1.6.x) - Q2 2026

**Objetivo:** Datasets operativos para todas las unidades

- [ ] Extender captura a SENTINEL, NOW, PULSE
- [ ] Implementar `DatasetBuilder` para consolidación mensual
- [ ] **Meta:** 500 correcciones ORACLE, 200 SENTINEL

**Deliverable:** 
- `training_set_v1.jsonl` (80%)
- `validation_set_v1.jsonl` (20%)

---

### Phase 3: Automation (v1.7.x) - Q3 2026

**Objetivo:** Ciclo completamente automatizado

- [ ] Cron job mensual: `DatasetBuilder.build_monthly_dataset()`
- [ ] Trigger automático: Si dataset >= 100 nuevos → Fine-tune
- [ ] Dashboard Admin: Visualizar tamaño de datasets por unit

---

## Metrics & Targets

### Dataset Size Targets

| Unit | Phase 1 (Pilot) | Phase 2 (Scaling) | Phase 3 (Mature) |
|------|-----------------|-------------------|------------------|
| **SENTINEL** | 50 casos | 200 casos | 500+ casos |
| **ORACLE** | 100 casos | 500 casos | 1000+ casos |
| **NOW** | 50 casos | 300 casos | 600+ casos |
| **PULSE** | 50 casos | 300 casos | 600+ casos |

### Quality Metrics

- **Diff Ratio mínimo:** 10% (capturamos solo cambios significativos)
- **Diff Ratio óptimo:** 15-40% (correcciones sustanciales)
- **Validation Split:** 20% (prevenir overfitting)

---

## Advanced Techniques (Future Enhancements)

> [!NOTE]
> **Architect Review Note (GEM):** El siguiente enfoque está planificado para v2.0. La v1.0 usa placeholders `[TAG]` por simplicidad y seguridad.

### Masking vs. Synthesis: The Quality Dilemma

**Problema con placeholders actuales:**

```
Input:  "Juan García se siente triste"
Output: "[PERSON_NAME] se siente triste"  ← Modelo aprende sintaxis robótica
```

Si entrenamos modelos con `[PERSON_NAME]`, el modelo puede empezar a generar respuestas con tags en producción:

```
"El paciente [PERSON_NAME] debería considerar terapia cognitiva..."  ❌
```

**Solución PRO: DLP Surrogate Types (v2.0)**

Cloud DLP soporta **"Crypto-based tokenization"** que reemplaza PII con valores sintéticos deterministas:

```python
# backend/app/services/safety/privacy_shield_v2.py (FUTURE)

class PrivacyShieldV2:
    """
    Versión avanzada con surrogate types para training natural.
    """
    
    async def sanitize_with_surrogates(self, text: str) -> str:
        """
        Reemplaza PII con nombres falsos pero realistas.
        
        Example:
            Input:  "Juan García (DNI 12345678A) reporta ansiedad"
            Output: "Roberto Fernández (DNI 87654321B) reporta ansiedad"
        
        Beneficios:
        - El modelo aprende gramática humana natural
        - La identidad real sigue protegida (deterministic hash)
        - Reversible con crypto key (si es necesario legalmente)
        """
        response = self.dlp.deidentify_content(
            request={
                "parent": f"projects/{PROJECT_ID}/locations/europe-west1",
                "deidentify_config": {
                    "info_type_transformations": {
                        "transformations": [{
                            "info_types": [{"name": "PERSON_NAME"}],
                            "primitive_transformation": {
                                "crypto_replace_ffx_fpe_config": {
                                    "crypto_key": self.crypto_key,
                                    "context": {"name": "clinical_training"},
                                    "surrogate_info_type": {"name": "PERSON_NAME"},
                                    # Alphabet español + números
                                    "common_alphabet": "ALPHA_NUMERIC",
                                }
                            }
                        }]
                    }
                },
                "item": {"value": text},
            }
        )
        
        return response.item.value
```

**Comparación:**

| Enfoque | v1.0 (Masking) | v2.0 (Synthesis) |
|---------|----------------|------------------|
| **Output** | `[PERSON_NAME]` se siente triste | `Roberto` se siente triste |
| **Naturalidad** | ❌ Sintaxis robótica | ✅ Lenguaje humano |
| **Seguridad** | ✅ Obvio que está sanitizado | ⚠️ Requiere auditoría de re-identificación |
| **Debug** | ✅ Fácil verificar eliminación | ⚠️ Necesita logging de mappings |
| **Costo DLP** | $1/GB | $3/GB (crypto overhead) |

**Recomendación GEM:**

> "Para v1.0, déjalo con placeholders `[TAG]`. Es más seguro y fácil de depurar. Para v2.0, cuando tengamos 1000+ ejemplos de training, investiga **DLP De-identification with surrogate types** para mejorar la naturalidad de los modelos."

---

## Consequences



### Positive

| Beneficio | Impacto |
|-----------|---------|
| **Cumplimiento Legal** | Datos anónimos → No aplica GDPR Art. 9 |
| **Ventaja Competitiva** | GPT-5 no tendrá nuestro conocimiento clínico español |
| **Mejora Continua** | Cada corrección mejora los modelos automáticamente |
| **Propiedad Intelectual** | Los datasets son un activo valorable de la empresa |

### Negative

| Riesgo | Mitigación |
|--------|------------|
| **Costo DLP** | ~$1-3/GB, pero volumen de texto es bajo |
| **Re-identificación teórica** | Usar `europe-west1` (GDPR jurisdiction) + auditorías periódicas |
| **Calidad de correcciones** | Revisión experta antes de añadir a training set (Gate) |

---

## Related Decisions

- **ADR-015 (AutoSxS):** Usa Evaluation Datasets para comparar modelos
- **ADR-016 (Shield/DLP):** Proporciona la capa de sanitización
- **ADR-017 (Fine-Tuning):** Consume Training Datasets para LoRA
- **ADR-018 (Vector Search):** Indexa datos post-sanitización

---

## References

- [Cloud DLP Documentation](https://cloud.google.com/dlp/docs)
- [GDPR Art. 6 (Lawfulness)](https://gdpr-info.eu/art-6-gdpr/)
- [HIPAA Safe Harbor Method](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/index.html)
- [Anonymization Techniques](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/what-is-personal-data/what-is-personal-data/#pd3)

---
*Authored by: Humbert Costas & Antigravity Agent*  
*Date: 2026-01-06*
