# ADR-018: Vertex AI Vector Search (Long-Term Clinical Memory)

## Status
**Proposed** (v1.3.9 - Memory Architecture Research)

## Context

### El Problema del Olvido
Los LLMs tienen una **ventana de contexto limitada** (memoria a corto plazo). Incluso los modelos más avanzados (Gemini 2.5 Pro con 2M tokens) no pueden procesar años de historial clínico de un paciente en cada llamada.

| Escenario | Problema Actual |
|-----------|-----------------|
| Paciente menciona: "Me siento igual que aquella vez que perdí mi trabajo" | El modelo no tiene acceso a esa sesión de hace 3 años |
| Terapeuta busca: "episodios de ansiedad" | Búsqueda por palabras trae demasiados resultados irrelevantes |
| ORACLE analiza sesión actual | No tiene contexto de patrones históricos del paciente |

### Búsqueda Semántica vs. Búsqueda por Palabras

| Tipo | Query | Resultados |
|------|-------|------------|
| **Keyword Search** | "trabajo" | Todas las menciones de "trabajo" (cientos) |
| **Vector Search** | "Me siento igual que aquella vez que perdí mi trabajo" | Sesiones sobre pérdida, duelo laboral, depresión asociada a desempleo (aunque no contengan la palabra "trabajo") |

La búsqueda vectorial encuentra **significado semántico**, no coincidencias de texto.

## Decision
Implementaremos **Vertex AI Vector Search** como sistema de **memoria a largo plazo** para las unidades ORACLE, NOW y PULSE.

### Arquitectura de Memoria

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLINICAL MEMORY ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────────┐
    │                      VECTOR DATABASE                               │
    │                   (Vertex AI Vector Search)                        │
    ├───────────────────────────────────────────────────────────────────┤
    │                                                                    │
    │   Patient A                                                        │
    │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
    │   │ Session │ │ Session │ │ Session │ │ ORACLE  │ │ Intake  │    │
    │   │ 2023-01 │ │ 2023-06 │ │ 2024-03 │ │ Summary │ │  Form   │    │
    │   │  [vec]  │ │  [vec]  │ │  [vec]  │ │  [vec]  │ │  [vec]  │    │
    │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
    │        ↑           ↑           ↑           ↑           ↑          │
    │        └───────────┴───────────┴───────────┴───────────┘          │
    │                              │                                     │
    │                      Embeddings API                                │
    │                    (text-embedding-005)                            │
    │                                                                    │
    └───────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Semantic Query
                                   ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │                        RETRIEVAL LAYER                             │
    │  ┌─────────────────────────────────────────────────────────────┐  │
    │  │  Query: "El paciente expresa sentimientos similares a        │  │
    │  │         cuando perdió su empleo"                             │  │
    │  │                                                               │  │
    │  │  Retrieved (Top-K=5):                                         │  │
    │  │  1. Session 2023-01: "Despido traumático..." (score: 0.94)   │  │
    │  │  2. Session 2023-03: "Luto por la identidad laboral" (0.89)  │  │
    │  │  3. ORACLE 2023-01: "Depresión reactiva a pérdida" (0.87)    │  │
    │  └─────────────────────────────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Enriched Context
                                   ▼
    ┌───────────────────────────────────────────────────────────────────┐
    │                      ALETHEIA UNITS                                │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
    │  │  ORACLE  │  │   NOW    │  │  PULSE   │                        │
    │  │(análisis)│  │(briefing)│  │(chat)    │                        │
    │  │          │  │          │  │          │                        │
    │  │ "Con     │  │ "Hoy el  │  │ "Recuerdo│                        │
    │  │ contexto │  │ paciente │  │ que en   │                        │
    │  │ de 2023" │  │ similar a│  │ 2023..." │                        │
    │  └──────────┘  │ enero 23"│  └──────────┘                        │
    │                └──────────┘                                       │
    └───────────────────────────────────────────────────────────────────┘
```

### Tipos de Documentos Indexados

| Tipo | Fuente | Frecuencia de Indexación |
|------|--------|--------------------------|
| **Session Transcript** | SCRIBE output | Post-sesión |
| **ORACLE Analysis** | ORACLE output | Post-análisis |
| **Intake Forms** | SCAN output | Al completar form |
| **Chat Messages** | PULSE input | Real-time |
| **Clinical Notes** | Terapeuta manual | Al guardar |

### Metadata para Filtrado

Cada vector incluye metadata para filtrado híbrido:

```json
{
  "vector": [0.123, -0.456, ...],  // 768 dims
  "metadata": {
    "patient_id": "uuid",
    "organization_id": "uuid",
    "document_type": "session_transcript",
    "date": "2023-01-15",
    "therapist_id": "uuid",
    "sentiment": "negative",
    "risk_level": "medium",
    "themes": ["trabajo", "pérdida", "identidad"]
  }
}
```

## Architecture

### Vector Search Service
```python
# backend/app/services/memory/vector_search_service.py (PROPOSED)

from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel

class ClinicalMemoryService:
    """
    Memoria a largo plazo para AletheIA usando Vector Search.
    Permite recuperación semántica del historial clínico completo.
    """
    
    EMBEDDING_MODEL = "text-embedding-005"
    VECTOR_DIMENSIONS = 768
    
    def __init__(self):
        self.embedding_model = TextEmbeddingModel.from_pretrained(self.EMBEDDING_MODEL)
        self.index = aiplatform.MatchingEngineIndex("kura-clinical-memory")
        self.endpoint = aiplatform.MatchingEngineIndexEndpoint("kura-memory-endpoint")
    
    async def index_document(
        self,
        document: ClinicalDocument,
    ) -> IndexResult:
        """
        Indexa un nuevo documento clínico en la memoria vectorial.
        """
        # Generar embedding
        embedding = self.embedding_model.get_embeddings([document.content])[0].values
        
        # Preparar datapoint con metadata
        datapoint = {
            "id": str(document.id),
            "embedding": embedding,
            "restricts": [
                {"namespace": "patient_id", "allow": [str(document.patient_id)]},
                {"namespace": "org_id", "allow": [str(document.organization_id)]},
            ],
            "numeric_restricts": [
                {"namespace": "timestamp", "value_int": document.timestamp},
            ],
        }
        
        # Upsert al índice
        await self.index.upsert_datapoints([datapoint])
        
        return IndexResult(indexed=True, vector_id=str(document.id))
    
    async def retrieve_context(
        self,
        query: str,
        patient_id: UUID,
        organization_id: UUID,
        top_k: int = 5,
        min_score: float = 0.7,
    ) -> List[RetrievedDocument]:
        """
        Recupera documentos semánticamente relevantes del historial del paciente.
        
        Args:
            query: Texto de búsqueda (ej. fragmento de sesión actual)
            patient_id: Filtro obligatorio por paciente
            organization_id: Filtro obligatorio por organización (multi-tenancy)
            top_k: Número máximo de documentos a recuperar
            min_score: Umbral mínimo de similitud
            
        Returns:
            Lista de documentos ordenados por relevancia semántica
        """
        # Generar embedding del query
        query_embedding = self.embedding_model.get_embeddings([query])[0].values
        
        # Buscar con filtros de seguridad
        results = await self.endpoint.find_neighbors(
            deployed_index_id="kura-memory-deployed",
            queries=[query_embedding],
            num_neighbors=top_k,
            filter=[
                {"namespace": "patient_id", "allow": [str(patient_id)]},
                {"namespace": "org_id", "allow": [str(organization_id)]},
            ],
        )
        
        # Filtrar por score mínimo y recuperar contenido
        documents = []
        for match in results[0]:
            if match.distance >= min_score:
                doc = await self.get_document_by_id(match.id)
                documents.append(RetrievedDocument(
                    content=doc.content,
                    score=match.distance,
                    metadata=doc.metadata,
                ))
        
        return documents


class EnrichedOracleService:
    """
    ORACLE enriquecido con memoria a largo plazo.
    """
    
    def __init__(self):
        self.memory = ClinicalMemoryService()
        self.oracle = OracleUnit()
    
    async def analyze_with_memory(
        self,
        current_session: str,
        patient_id: UUID,
        organization_id: UUID,
    ) -> EnrichedAnalysis:
        """
        Analiza la sesión actual con contexto histórico recuperado.
        """
        # 1. Recuperar contexto relevante
        historical_context = await self.memory.retrieve_context(
            query=current_session,
            patient_id=patient_id,
            organization_id=organization_id,
            top_k=5,
        )
        
        # 2. Construir prompt enriquecido
        enriched_prompt = f"""
        ## Sesión Actual
        {current_session}
        
        ## Contexto Histórico Relevante
        {self._format_historical_context(historical_context)}
        
        ## Instrucciones
        Analiza la sesión actual considerando el contexto histórico.
        Identifica patrones recurrentes, progreso terapéutico y conexiones
        con experiencias pasadas del paciente.
        """
        
        # 3. Ejecutar ORACLE con contexto enriquecido
        analysis = await self.oracle.analyze(enriched_prompt)
        
        return EnrichedAnalysis(
            analysis=analysis,
            sources=historical_context,
        )
```

## Implementation Phases

### Phase 1: Index Foundation (v1.5.x)
- [ ] Crear Matching Engine Index en europe-west4
- [ ] Definir schema de metadata (patient_id, org_id, doc_type, date)
- [ ] Implementar indexación post-SCRIBE (transcripciones)
- [ ] Implementar indexación post-ORACLE (análisis)

### Phase 2: Retrieval Integration (v1.6.x)
- [ ] Enriquecer ORACLE con `retrieve_context()`
- [ ] Enriquecer NOW con historial relevante para briefings
- [ ] UI: Mostrar "Fuentes" de la memoria en análisis
- [ ] Métricas de retrieval quality

### Phase 3: Advanced Memory (v1.7.x)
- [ ] Real-time indexación de PULSE (chat)
- [ ] Búsqueda temporal (documentos de hace X meses)
- [ ] "Memory consolidation": Resúmenes periódicos que condensan historial
- [ ] Cross-patient patterns (anonimizados) para insights clínicos

## Consequences

### Positive
- **Memoria infinita**: Acceso a años de historial sin límite de contexto
- **Continuidad terapéutica**: Conexiones que ni el terapeuta humano recordaría
- **Búsqueda por significado**: "Momentos de pérdida" en lugar de "trabajo despido"
- **Multi-tenancy seguro**: Filtros obligatorios por patient_id y org_id
- **Escalabilidad**: ScaNN de Google escala a billones de vectores

### Negative
- **Costo de embeddings**: Cada documento requiere llamada a Embedding API (~$0.0001/doc)
- **Costo de hosting**: Matching Engine endpoint tiene costo fijo (~$200/mes mínimo)
- **Latencia de retrieval**: Añade ~100-200ms a cada análisis
- **Complejidad de debugging**: "¿Por qué recuperó este documento y no aquel?"

### Mitigations
- **Batch embeddings**: Procesar documentos en lotes nocturnos
- **Shared endpoints**: Un endpoint por región para múltiples organizaciones
- **Async retrieval**: Pre-cargar contexto mientras usuario escribe
- **Explainability UI**: Mostrar scores y fragmentos que activaron la recuperación

## Security Considerations

> [!CAUTION]
> **Aislamiento de Datos es CRÍTICO**. Cada query DEBE incluir filtros de `patient_id` Y `organization_id`. Un error aquí expone historial clínico de otros pacientes.

### Filtros Obligatorios
```python
# SIEMPRE incluir ambos filtros
filter=[
    {"namespace": "patient_id", "allow": [str(patient_id)]},      # REQUIRED
    {"namespace": "org_id", "allow": [str(organization_id)]},     # REQUIRED
]
```

### DLP Integration (ADR-016)
Los documentos se indexan **después** de pasar por el pipeline de sanitización DLP. Los vectores nunca contienen PII en texto claro.

## Related Decisions
- **ADR-015**: AutoSxS puede evaluar la calidad de retrieval
- **ADR-016**: DLP sanitiza antes de indexar
- **ADR-017**: Modelos tuned pueden generar mejores embeddings en el futuro
- **Taxonomy v1.3**: ORACLE, NOW y PULSE consumen esta memoria

## References
- [Vertex AI Vector Search](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Text Embeddings API](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)
- [ScaNN: Efficient Vector Similarity Search](https://ai.googleblog.com/2020/07/announcing-scann-efficient-vector.html)

---
*Authored by: Humbert Costas & Antigravity Agent*
*Date: 2026-01-06*
