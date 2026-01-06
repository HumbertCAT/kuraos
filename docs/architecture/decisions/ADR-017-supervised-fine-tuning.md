# ADR-017: Vertex AI Supervised Fine-Tuning (SFT)

## Status
**Proposed** (v1.3.9 - Model Specialization Research)

## Context

### El Círculo Virtuoso de los Datasets
Con ADR-015 (AutoSxS) estamos creando **Golden Datasets** para evaluar modelos: cientos de ejemplos de "buena respuesta" vs "mala respuesta" curados por expertos clínicos.

Estos datasets son **oro puro** que actualmente solo usamos para evaluación. Pero su verdadero potencial es entrenar modelos especializados.

### El Problema Actual
| Aspecto | Estado Actual | Limitación |
|---------|---------------|------------|
| **Modelo** | Gemini Pro/Ultra genérico | Optimizado para tareas generales, no clínicas |
| **Costo** | Alto (modelos grandes) | Cada token de Pro/Ultra es caro |
| **Latencia** | Media-Alta | Modelos grandes = más tiempo de inferencia |
| **Conocimiento** | Genérico | No conoce nuestro dominio terapéutico específico |

### La Oportunidad
**Supervised Fine-Tuning (SFT)** permite tomar un modelo base eficiente (ej. Gemini 1.5 Flash) y especializarlo en nuestro dominio usando nuestros propios ejemplos.

## Decision
Implementaremos un **Pipeline de Fine-Tuning Continuo** para crear versiones especializadas de cada AletheIA Unit.

### Estrategia de Fine-Tuning por Unidad

| Unit | Modelo Base | Modelo Tuned | Dataset Source |
|------|-------------|--------------|----------------|
| **ORACLE** | Gemini 1.5 Flash | `gemini-flash-oracle-v1` | Resúmenes clínicos corregidos por humanos |
| **NOW** | Gemini 1.5 Flash | `gemini-flash-now-v1` | Briefings validados por terapeutas |
| **PULSE** | Gemini 1.5 Flash | `gemini-flash-pulse-v1` | Análisis de sentimiento con ground truth |
| **SCAN** | Gemini 1.5 Flash | `gemini-flash-scan-v1` | Extracciones de formularios verificadas |
| **HELPER** | Gemini 1.5 Flash | `gemini-flash-helper-v1` | QA de plataforma curado |
| **SENTINEL** | Gemini 2.5 Pro | `gemini-pro-sentinel-v1` | Casos de riesgo con clasificación experta |

> [!NOTE]
> **SENTINEL** usa modelo Pro como base debido a la criticidad clínica. La seguridad del paciente no admite compromisos en capacidad de razonamiento.

### El Ciclo de Mejora Continua
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CICLO VIRTUOSO DE FINE-TUNING                        │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  1. DEPLOY   │  → Modelo tuned en producción
    │    Model     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  2. COLLECT  │  → Respuestas del modelo + feedback del terapeuta
    │   Feedback   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  3. EVALUATE │  → AutoSxS detecta degradación o errores
    │   (AutoSxS)  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  4. CURATE   │  → Humanos corrigen errores y añaden al dataset
    │   Dataset    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  5. RETRAIN  │  → Fine-tune con dataset expandido
    │  (Fine-Tune) │
    └──────┬───────┘
           │
           └─────────────────────────────────→ (vuelve a 1)

```

## Architecture

### Dataset Format (JSONL para SFT)
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Eres ORACLE, el motor de análisis clínico de AletheIA. Analiza la siguiente transcripción de sesión terapéutica y extrae: temas latentes, patrones de comportamiento, progreso terapéutico y señales de riesgo."
    },
    {
      "role": "user", 
      "content": "Transcripción de sesión del 15/01/2026:\n\n[PACIENTE]: Esta semana me he sentido mejor. Logré salir de casa tres veces, aunque todavía me cuesta mucho. La medicación parece estar ayudando con la ansiedad..."
    },
    {
      "role": "assistant",
      "content": "## Análisis Clínico\n\n### Temas Latentes\n- **Agorafobia en remisión**: El paciente muestra signos de mejora gradual...\n\n### Progreso Terapéutico\n- Incremento en actividades de exposición (3 salidas vs 0 la semana anterior)..."
    }
  ]
}
```

### Pipeline de Fine-Tuning
```python
# backend/app/services/training/fine_tuning_service.py (PROPOSED)

from google.cloud import aiplatform

class AletheIAFineTuningService:
    """
    Servicio de Fine-Tuning para crear modelos AletheIA especializados.
    """
    
    UNIT_TRAINING_CONFIGS = {
        "oracle": {
            "base_model": "gemini-1.5-flash-001",
            "dataset_uri": "gs://kura-training/oracle/training_set_v1.jsonl",
            "validation_uri": "gs://kura-training/oracle/validation_set_v1.jsonl",
            "epochs": 3,
            "learning_rate_multiplier": 1.0,
        },
        "sentinel": {
            "base_model": "gemini-2.5-pro-001",
            "dataset_uri": "gs://kura-training/sentinel/training_set_v1.jsonl",
            "validation_uri": "gs://kura-training/sentinel/validation_set_v1.jsonl",
            "epochs": 5,  # Más épocas para criticidad
            "learning_rate_multiplier": 0.5,  # Más conservador
        },
        # ... otras unidades
    }
    
    async def create_tuning_job(
        self,
        unit: str,
        version: str,
    ) -> TuningJob:
        """
        Crea un job de fine-tuning para una unidad específica.
        """
        config = self.UNIT_TRAINING_CONFIGS[unit]
        
        aiplatform.init(project="kura-os-prod", location="europe-west4")
        
        tuning_job = aiplatform.TuningJob.create(
            display_name=f"tune-{unit}-{version}",
            base_model=config["base_model"],
            training_dataset_uri=config["dataset_uri"],
            validation_dataset_uri=config["validation_uri"],
            hyper_parameters={
                "epoch_count": config["epochs"],
                "learning_rate_multiplier": config["learning_rate_multiplier"],
            },
        )
        
        return tuning_job
    
    async def evaluate_and_promote(
        self,
        tuned_model: str,
        baseline_model: str,
        unit: str,
    ) -> PromotionDecision:
        """
        Usa AutoSxS (ADR-015) para decidir si promover el modelo tuned.
        """
        evaluation_service = AletheIAEvaluationService()
        result = await evaluation_service.run_evaluation(
            unit=unit,
            candidate_model=tuned_model,
            baseline_model=baseline_model,
        )
        
        if result.should_promote:
            await self.update_routing(unit, tuned_model)
            
        return PromotionDecision(
            promoted=result.should_promote,
            win_rate=result.win_rate,
            new_model=tuned_model if result.should_promote else None,
        )
```

### Data Pipeline (GCS Structure)
```
┌─────────────────────────────────────────────────────────────────┐
│                      TRAINING DATA LAKE                         │
│                       (GCS Bucket)                              │
├─────────────────────────────────────────────────────────────────┤
│  /training-datasets/                                            │
│    ├── oracle/                                                  │
│    │   ├── training_set_v1.jsonl    (500+ ejemplos curados)    │
│    │   ├── validation_set_v1.jsonl  (100 ejemplos holdout)     │
│    │   └── corrections/             (errores corregidos)       │
│    │       ├── 2026-01/                                        │
│    │       └── 2026-02/                                        │
│    ├── sentinel/                                                │
│    │   ├── training_set_v1.jsonl    (200+ casos de riesgo)     │
│    │   └── validation_set_v1.jsonl                             │
│    ├── now/                                                     │
│    ├── pulse/                                                   │
│    ├── scan/                                                    │
│    └── helper/                                                  │
│                                                                 │
│  /model-versions/                                               │
│    ├── oracle/                                                  │
│    │   ├── v1.0.0/  (baseline)                                 │
│    │   ├── v1.1.0/  (tuned 2026-01)                           │
│    │   └── v1.2.0/  (tuned 2026-02)                           │
│    └── sentinel/                                                │
│        └── v1.0.0/                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Dataset Curation (v1.5.x)
- [ ] Definir formato JSONL estándar para cada unidad
- [ ] Crear interfaz de corrección para terapeutas (feedback loop)
- [ ] Curar dataset inicial de ORACLE (500 ejemplos)
- [ ] Establecer split training/validation (80/20)

### Phase 2: First Tuning (v1.6.x)
- [ ] Ejecutar primer fine-tuning de ORACLE
- [ ] Evaluar con AutoSxS contra modelo base
- [ ] Promover a staging si win_rate >= 60%
- [ ] Monitorizar métricas de producción

### Phase 3: Continuous Improvement (v1.7.x)
- [ ] Pipeline automatizado: Corrección → Dataset → Tuning → Evaluation → Promotion
- [ ] Dashboard de versiones de modelos
- [ ] Rollback automático si degradación detectada
- [ ] Fine-tuning de unidades adicionales (SENTINEL, NOW)

## Consequences

### Positive
- **Especialización de dominio**: Modelos que "piensan" como terapeutas
- **Reducción de costos**: Flash tuned es 10x más barato que Pro genérico
- **Mejora continua**: El sistema aprende de sus errores infinitamente
- **Latencia reducida**: Modelos más pequeños = respuestas más rápidas
- **Diferenciación**: Competidores usan modelos genéricos; nosotros tenemos especialistas

### Negative
- **Esfuerzo de curaduría**: Requiere tiempo de expertos clínicos para corregir
- **Costo de entrenamiento**: Cada job de tuning cuesta ~$10-50
- **Riesgo de overfitting**: Modelos demasiado especializados pueden fallar en edge cases
- **Versionamiento complejo**: Múltiples versiones de múltiples unidades

### Mitigations
- **Gamificación de curaduría**: Incentivar correcciones en el flujo normal del terapeuta
- **Batch training**: Agrupar correcciones y entrenar mensualmente
- **Validation holdout**: Siempre reservar datos para detectar overfitting
- **Model Registry**: Versionado semántico y rollback automatizado

## Related Decisions
- **ADR-015**: AutoSxS es el gate de promoción de modelos tuned
- **ADR-016**: DLP sanitiza datos antes del entrenamiento (privacidad)
- **Taxonomy v1.3**: Cada unidad tiene su propio modelo especializado

## References
- [Vertex AI Fine-Tuning](https://cloud.google.com/vertex-ai/docs/generative-ai/models/tune-models)
- [Gemini Fine-Tuning Best Practices](https://cloud.google.com/vertex-ai/docs/generative-ai/models/gemini-supervised-tuning)

---
*Authored by: Humbert Costas & Antigravity Agent*
*Date: 2026-01-06*
