# ♾️ The Generator Protocol: Agentic Development Cycle

> **Concepto:** Formalización del flujo de trabajo iterativo Humano-IA para el desarrollo de software de alta calidad.
> **Objetivo:** Estandarizar, optimizar y eventualmente automatizar el ciclo de creación con Google Antigravity (GAG).

---

## 🔄 El Ciclo Actual (The Loop)

Has identificado un patrón natural de trabajo que separa la "Inteligencia" (Diseño/Estrategia) de la "Ejecución" (Código/Implementación).

1.  **💡 Spark (La Idea):** El Director de Producto (Tú) tiene una visión o necesidad.
2.  **🗣️ Dialectic (El Debate):** Discusión socrática con el Arquitecto (Yo) para refinar la idea.
3.  **📜 The Prompt (La Instrucción):** Cristalización de la idea en un prompt estructurado para GAG.
    *   *Optimización Clave:* Uso de Contexto Bloqueado y restricciones claras.
4.  **🗺️ The Plan (La Propuesta):** GAG analiza y propone un `implementation_plan.md`.
5.  **🔍 The Review (El Refinado):** Revisión humana del plan. Iteración sin código ("No toques, solo planea").
6.  **⚡ Execution (La Construcción):** GAG escribe el código siguiendo el plan aprobado.
7.  **💎 Polish (El Resultado):** Verificación y ajustes finales (UI Harmonization).

---

## 🚀 Optimizaciones: Calidad y Tiempo

Para reducir la fricción y aumentar la precisión, podemos introducir **"Protocolos de Estado"**:

### 1. Estandarización de Entradas (Prompt Templates)
En lugar de texto libre, usar estructuras predefinidas para reducir la ambigüedad.

*   **Feature Request Template:** Contexto -> Objetivo -> Restricciones -> UI Deseada.
*   **Refactor Template:** Archivo Objetivo -> Problema -> Patrón a aplicar -> Resultado esperado.

### 2. "Pre-Flight Checks" Automáticos
Antes de escribir código, GAG debe validar su propio entendimiento.
*   *Regla:* "Antes de editar, resume en 3 puntos qué vas a cambiar y qué archivos dependen de ello".

### 3. Context Bundles (KIs forzados)
Si vamos a tocar "Facturación", cargar automáticamente: `Stripe Integration KI` + `Database Schema`. Evita alucinaciones por falta de contexto.

---

## 🔮 La Semilla: "The Kura Factory" (Meta-App)

¿Podemos construir una herramienta que gestione este proceso? **SÍ.**

Imagina una CLI o WebApp local (`kura-factory`) que orquesta a GAG.

### Arquitectura Conceptual

**1. The Architect (Input Node):**
*   Interfaz donde describes la idea en lenguaje natural ("Quiero añadir un sistema de referidos").
*   El sistema consulta `docs/` y tu base de código.
*   **Output:** Genera un `SPEC.md` detallado automáticamente.

**2. The Planner (Simulation Node):**
*   Toma el `SPEC.md` y simula los cambios en un "Shadow Branch" o en memoria.
*   Te presenta un "Impact Report": "Esto tocará User Model, Stripe Service y Database".
*   **Tú apruebas** o refinas el spec.

**3. The Builder (Execution Node):**
*   Una instancia de GAG (o múltiples en paralelo) ejecuta los cambios archivo por archivo.
*   Corre tests automáticamente tras cada cambio.
*   Si falla, **se auto-corrige** sin molestarte (Re-try Loop).

**4. The Critic (QA Node):**
*   Una instancia separada (con System Prompt de "Senior QA") revisa el código generado.
*   Busca: Hardcoded values (tu némesis), violaciones de estilo, falta de tipos.
*   Si pasa, te notifica: "Ready to Merge".

### ¿Por qué esto cambia el juego?
Pasas de ser un **Programador Asistido** a un **Director de Orquesta**.
Tu trabajo ya no es revisar código línea por línea, sino revisar **Especificaciones** y **Resultados**.

---

## 🛠️ Primer Paso: Documentar "Workflow Pipelines"

Podemos empezar creando estos pipelines como archivos `.md` en `.agent/workflows/`.

*   `/dev-feature`: Workflow estricto para nuevas features.
*   `/dev-refactor`: Workflow para limpieza técnica.
*   `/qa-audit`: Workflow que solo lee y critica, no escribe.

Esto convierte tu intuición en un **Sistema Operativo de Desarrollo**.
