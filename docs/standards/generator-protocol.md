# ♾️ The Generator Protocol: Agentic Development Cycle

> **Concepto:** Metodología de Desarrollo Aumentado por IA (AI-Augmented Development Cycle).
> **Objetivo:** Estandarizar la colaboración entre el Humano (Director), el Arquitecto (Estrategia) y el Constructor (Ejecución).

---

## 🔄 El Ciclo Infinito (The Infinity Loop)

La clave es separar la **Inteligencia** de la **Ejecución**.

### FASE 1: Inteligencia (Human + Architect AI)
1.  **💡 Spark (La Idea):** El Director de Producto (Tú) define una necesidad.
2.  **🗣️ Dialectic (El Debate):** Refinamiento socrático con el Arquitecto (Gemini). Definición de objetivos de negocio y UX.
3.  **📜 The Prompt (La Instrucción):** El Arquitecto genera el `GAG PROMPT` maestro, inyectando el contexto técnico.

### FASE 2: Planificación (Builder AI)
4.  **🗺️ The Plan:** GAG (Builder) analiza el código y propone un `implementation_plan.md`.
5.  **⚖️ The Audit (Human Review):** Validación humana. ¿Cumple el plan con la Regla de Oro? ¿Toca lo que debe?
    *   *Regla:* Iterar el plan hasta que sea perfecto. "Measure twice, cut once".

### FASE 3: Ejecución & Pulido
6.  **⚡ Execution:** GAG escribe el código.
7.  **💎 Polish:** Verificación visual y corrección de detalles finos (UI Harmonization).

---

## �️ Herramientas de Optimización (Phase 2)

Para eliminar la fricción, estandarizamos las entradas.

### 1. Librería de Prompts (`.prompts/`)
Archivos de contexto que "doman" a la IA para que no olvide las reglas.

*   `system_context.md`: La "Constitución" (Stack, Estilos, Prohibiciones). Se inyecta al inicio de cada sesión.
*   `architect_role.md`: Define la personalidad estratégica.
*   `component_template.md`: Estructura base para nuevos componentes React.

### 2. Validadores Automáticos (Pre-Flight Checks)
Scripts simples para asegurar calidad antes de la revisión humana.

**Design System Compliance:**
*   `grep "text-["`: Detectar pixel values prohibidos.
*   `grep "bg-[#"`: Detectar hex codes arbitrarios.

**API Refactor Audit:**
Cuando cambias campos de respuesta de API (ej: `patient.ai_insights` → `patient.last_insight_json`):
*   `grep -r "old_field_name" apps/platform/`: Encontrar consumidores del campo legacy.
*   Actualizar todos los consumidores antes de hacer commit.

---

## 🔮 La Meta-App: "Kura Factory" (Phase 3)

El futuro es automatizar la orquestación. Una herramienta local (`kura-factory`) que gestiona el ciclo.

### Arquitectura Conceptual

**1. The Constitution (Base de Conocimiento):**
Kura Factory indexa `.prompts/system_context.md` y sabe "cómo debe ser" el código de Kura OS.

**2. The Prompt Engine (Generador):**
Tú dices: *"Arregla la tabla de clientes"*.
Kura Factory lee tus archivos + Constitución → Genera el Prompt Perfecto para GAG.

**3. The Gatekeeper (Validador):**
Lee el `implementation_plan.md` de GAG.
Si detecta una violación (ej: `bg-blue-500`), **rechaza el plan automáticamente** y pide a GAG que corrija. Tú solo ves planes válidos.

### Por qué esto cambia el juego
Pasas de **Codificar** a **Dirigir**. Tu input es Estrategia, tu output es Producto Terminado de Alta Calidad.
El "trabajo sucio" (linting, compliance, boilerplate) lo gestiona la máquina.
