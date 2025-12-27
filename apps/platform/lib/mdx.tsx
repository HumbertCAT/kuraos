/**
 * Help Center Content and Navigation Utilities
 * 
 * Content is inlined for Vercel serverless compatibility.
 * Uses 4 Pillars structure: Getting Started, Core, Intelligence, Account.
 */

/**
 * 4 Pillars Navigation Structure
 */
export const HELP_NAV = {
  'getting-started': {
    title: 'Primeros Pasos',
    icon: '🚀',
    items: ['first-5-minutes', 'understanding-journeys', 'demo-mode'],
  },
  'core': {
    title: 'Módulos Core',
    icon: '📋',
    items: ['patients', 'clinical-journal', 'bookings', 'forms', 'leads'],
  },
  'intelligence': {
    title: 'Inteligencia',
    icon: '🧠',
    items: ['aletheia', 'sentinel-pulse', 'agents', 'chatbot'],
  },
  'account': {
    title: 'Cuenta',
    icon: '⚙️',
    items: ['settings', 'integrations', 'plans', 'credits'],
  },
};

/**
 * Chapter metadata for all help articles
 */
export const HELP_CHAPTERS: Record<string, {
  title: string;
  icon: string;
  description: string;
  pillar: string;
}> = {
  // Getting Started
  'first-5-minutes': {
    title: 'Tu Primera Sesión',
    icon: '🚀',
    description: 'Crea tu primer paciente y nota clínica',
    pillar: 'getting-started',
  },
  'understanding-journeys': {
    title: 'El Sistema de Journeys',
    icon: '🗺️',
    description: 'Entiende los viajes terapéuticos',
    pillar: 'getting-started',
  },
  'demo-mode': {
    title: 'Modo Demo',
    icon: '🎪',
    description: 'Carga datos de demostración',
    pillar: 'getting-started',
  },

  // Core Modules
  'patients': {
    title: 'Soul Record',
    icon: '👥',
    description: 'El perfil 360° de cada paciente',
    pillar: 'core',
  },
  'clinical-journal': {
    title: 'Diario Clínico',
    icon: '📝',
    description: 'Notas, audio y análisis IA',
    pillar: 'core',
  },
  'bookings': {
    title: 'Reservas',
    icon: '📅',
    description: 'Calendario y servicios',
    pillar: 'core',
  },
  'forms': {
    title: 'Formularios',
    icon: '📋',
    description: 'Intake y scoring de riesgo',
    pillar: 'core',
  },
  'leads': {
    title: 'CRM y Leads',
    icon: '🎯',
    description: 'Kanban y conversiones',
    pillar: 'core',
  },

  // Intelligence
  'aletheia': {
    title: 'AletheIA Observatory',
    icon: '🔭',
    description: 'Tu copiloto clínico con IA',
    pillar: 'intelligence',
  },
  'sentinel-pulse': {
    title: 'Pulso Emocional',
    icon: '💓',
    description: 'Monitorización en tiempo real',
    pillar: 'intelligence',
  },
  'agents': {
    title: 'Agentes y Playbooks',
    icon: '⚡',
    description: 'Automatizaciones inteligentes',
    pillar: 'intelligence',
  },
  'chatbot': {
    title: 'Asistente IA',
    icon: '🤖',
    description: 'Ayuda contextual 24/7',
    pillar: 'intelligence',
  },

  // Account
  'settings': {
    title: 'Configuración',
    icon: '⚙️',
    description: 'Perfil y preferencias',
    pillar: 'account',
  },
  'integrations': {
    title: 'Integraciones',
    icon: '🔌',
    description: 'WhatsApp, Stripe, Calendar',
    pillar: 'account',
  },
  'plans': {
    title: 'Planes',
    icon: '💎',
    description: 'Builder, Pro, Center',
    pillar: 'account',
  },
  'credits': {
    title: 'Créditos IA',
    icon: '🎫',
    description: 'Uso y compra de créditos',
    pillar: 'account',
  },
};

/**
 * Inline content for all help articles.
 * To be expanded with real content.
 */
const HELP_CONTENT: Record<string, string> = {
  // ============================================
  // GETTING STARTED
  // ============================================
  'first-5-minutes': `
# Tu Primera Sesión

> Configura tu cuenta de KURA OS y crea tu primer paciente en 5 minutos.

## ¿Qué vas a aprender?

En esta guía completarás tu primera sesión:
1. Crear un paciente
2. Escribir una nota clínica
3. Ver el análisis de AletheIA

---

## 1. Crear tu primer paciente

1. Haz clic en **Clientes** en el menú lateral
2. Pulsa el botón **+ Nuevo Paciente**
3. Rellena los datos básicos:
   - **Nombre completo**
   - **Email** (para formularios y recordatorios)
   - **Teléfono** (opcional, para WhatsApp)
4. Haz clic en **Guardar**

💡 **Tip:** El email es importante porque se usará para enviar formularios de intake y recordatorios de citas.

---

## 2. Grabar tu primera nota clínica

1. Abre la ficha del paciente que acabas de crear
2. Ve a la pestaña **Diario Clínico**
3. Tienes dos opciones:
   - **Escribir**: Usa el editor de texto enriquecido
   - **Grabar**: Haz clic en 🎙️ para grabar audio
4. Haz clic en **Enviar** para guardar

---

## 3. Ver el análisis de AletheIA

Una vez guardada la nota, mira el panel derecho (**AletheIA Observatory**):

- **Risk Score**: Nivel de riesgo detectado (-1 a +1)
- **Temas clave**: Palabras y conceptos identificados
- **Flags**: Alertas clínicas si las hay

🎉 **¡Felicidades!** Has completado tu primera sesión en KURA OS.

---

## Próximos pasos

- 🗺️ [Entiende el sistema de Journeys](/help/understanding-journeys)
- 📅 [Configura tu calendario](/help/bookings)
- 💬 [Conecta WhatsApp](/help/integrations)
`,

  'understanding-journeys': `
# El Sistema de Journeys

> Los Journeys son el corazón de KURA OS: representan el viaje terapéutico de cada paciente.

## ¿Qué es un Journey?

Un **Journey** es una plantilla de tratamiento con fases definidas. Por ejemplo:

- **Retiro de Ibiza**: Screening → Pago → Preparación → Ceremonia → Integración
- **Coaching Ejecutivo**: Intake → Sesiones → Evaluación → Cierre
- **Terapia Integrativa**: Primera Consulta → Tratamiento → Mantenimiento

---

## Estados de un Journey

Cada paciente puede estar en uno de estos estados:

| Estado | Significado |
|--------|-------------|
| 🟡 **AWAITING_PAYMENT** | Pendiente de pago |
| 🔵 **PREPARATION** | En fase de preparación |
| 🟢 **ACTIVE_MEMBER** | Miembro activo |
| 🔴 **BLOCKED_MEDICAL** | Bloqueado por razones médicas |

---

## El Boarding Pass

En la ficha de cada paciente verás el **Journey Boarding Pass**: una visualización estilo tarjeta de embarque que muestra:

- En qué fase está el paciente
- Cuáles ha completado (✓)
- Cuáles le quedan por delante

---

## Crear un nuevo Journey

1. Ve a **Configuración** > **Journeys**
2. Haz clic en **+ Nuevo Journey**
3. Define las fases y sus nombres
4. Guarda la plantilla

Los Journeys definidos aparecerán como opciones al crear pacientes.
`,

  'demo-mode': `
# Modo Demo

> Carga datos de demostración para explorar KURA OS o hacer demos a inversores.

## ¿Para qué sirve?

El **Modo Demo** (Golden Seed Protocol) crea pacientes arquetipo con historiales completos:

- **Marcus Thorne**: CEO, 45 años. Burnout ejecutivo → Despertar espiritual
- **Elena Velázquez**: Artista, 38 años. Depresión con contraindicación Litio
- **Julian Soler**: Fundador, 52 años. Crisis financiera → Estancamiento
- **Sarah Jenkins**: Coach, 41 años. Miembro activo en integración

---

## Cómo activarlo

Actualmente el Modo Demo se activa desde el backend:

\`\`\`bash
python scripts/reboot_local_universe_PREMIUM.py
\`\`\`

💡 **Próximamente**: Botón en el Dashboard para cargar datos demo con un clic.

---

## Casos de uso

- **Onboarding personal**: Explora la plataforma con datos reales
- **Demos a inversores**: Muestra el poder de AletheIA
- **Testing**: Prueba nuevas funcionalidades
`,

  // ============================================
  // CORE MODULES
  // ============================================
  'patients': `
# Soul Record

> El perfil 360° de cada paciente: datos, historial clínico, y análisis de IA.

## La Ficha del Paciente

Al abrir un paciente verás el **Clinical Canvas** (lienzo clínico), dividido en dos columnas:

| Columna Izquierda | Columna Derecha |
|-------------------|-----------------|
| Journey Boarding Pass | Pulso Emocional (Sentinel Pulse) |
| Timeline clínico | Datos de engagement |

---

## Componentes principales

### Patient Hero
La cabecera muestra:
- Foto y nombre
- Sesiones totales
- Próxima cita
- Engagement %
- Botones: Editar, Email, Contactar

### Journey Boarding Pass
Visualización tipo tarjeta de embarque:
- Fases completadas (✓)
- Fase actual (pulsando)
- Fases futuras (fantasma)

### Sentinel Pulse
Gráfico de los últimos 7 días:
- Línea verde = sentimiento positivo
- Línea roja = sentimiento en riesgo
- Punto "Now" = estado actual

---

## Acciones disponibles

- **Ver Chat Original**: Abre el historial de WhatsApp
- **Contactar**: Envía mensaje directo
- **Editar**: Modifica datos del paciente
- **Enviar Formulario**: Comparte un intake
`,

  'clinical-journal': `
# Diario Clínico

> Notas, audio y análisis de IA en un solo lugar.

## Tipos de entradas

El Diario Clínico agrupa todo lo relacionado con la historia clínica:

- **Notas de texto**: Editor rico estilo Notion (TipTap)
- **Audio**: Grabaciones que se transcriben automáticamente
- **Formularios**: Respuestas de intake
- **Análisis IA**: Resúmenes generados por AletheIA

---

## Crear una nota

1. Abre la ficha del paciente
2. Ve a la pestaña **Diario Clínico**
3. Escribe tu nota o haz clic en 🎙️ para grabar
4. Haz clic en **Enviar**

---

## Análisis automático

Cada nota es analizada por AletheIA para detectar:

- **Riesgos clínicos**: Ideación suicida, autolesión
- **Temas recurrentes**: Ansiedad, duelo, relaciones
- **Nivel de engagement**: Qué tan activo está el paciente

---

## Historial cronológico

Todas las entradas aparecen en orden cronológico, con indicadores de:
- Tipo de entrada (nota, audio, formulario)
- Si ha sido analizada por IA
- Flags de riesgo si los hay
`,

  'bookings': `
# Reservas

> Calendario, servicios y página pública de reservas con pagos integrados.

## Servicios

Cada servicio define:
- **Nombre**: Ej. "Sesión Individual 60min"
- **Duración**: 30, 60, 90 minutos
- **Precio**: En tu moneda local
- **Formulario de intake**: Opcional, se envía tras reservar

---

## Disponibilidad

Configura cuándo estás disponible:
1. Ve a **Calendario** > **Disponibilidad**
2. Marca los días y horas habituales
3. Añade excepciones (vacaciones, eventos)

---

## Página pública de reservas

Cada terapeuta tiene una URL pública:

\`https://app.kuraos.ai/book/[tu-id]\`

Los clientes pueden:
1. Ver servicios disponibles
2. Elegir fecha y hora
3. Pagar online (Stripe)
4. Recibir confirmación automática

---

## Sincronización con Google Calendar

Conecta tu Google Calendar para:
- Ver tu disponibilidad real (eventos bloqueados)
- Crear eventos automáticamente al confirmar reservas
`,

  'forms': `
# Formularios

> Crea formularios de intake con scoring de riesgo y compártelos sin fricción.

## Tipos de campos

- **Texto**: Nombre, email, notas libres
- **Selección**: Opciones múltiples o únicas
- **Escala**: 1-5, 1-10 para evaluaciones
- **Fecha**: Cumpleaños, fechas de eventos
- **Checkbox**: Consentimientos, términos

---

## Scoring de riesgo

Puedes configurar reglas para detectar riesgo:

- Si "¿Has pensado en hacerte daño?" = Sí → **Riesgo Alto**
- Si "Nivel de ansiedad" ≥ 8 → **Riesgo Medio**

Las alertas aparecen automáticamente en el Observatory.

---

## Compartir formularios

1. Abre la ficha del paciente
2. Haz clic en **Enviar Formulario**
3. Selecciona la plantilla
4. Copia el enlace o comparte por WhatsApp

---

## Formularios públicos (Lead Gen)

Los formularios pueden ser públicos:
- Comparte en tu Instagram bio
- Usa QR codes en eventos
- Los envíos crean leads automáticamente
`,

  'leads': `
# CRM y Leads

> Kanban visual para gestionar prospectos antes de convertirlos en pacientes.

## El Tablero Kanban

Los leads se organizan en columnas:

| Columna | Significado |
|---------|-------------|
| **Nuevo** | Acaba de llegar |
| **Contactado** | Has hablado con él |
| **Cualificado** | Listo para agendar |
| **Convertido** | Ya es paciente |

---

## Acciones en cada lead

- **Mover**: Arrastra entre columnas
- **Contactar**: WhatsApp o email
- **Convertir**: Crea paciente desde el lead

---

## Auto-conversión

Cuando un lead reserva y paga:
1. Se crea el paciente automáticamente
2. El lead se marca como "Convertido"
3. Las notas del lead pasan al paciente

---

## Speed-to-Lead

Indicadores de urgencia:
- 🔥 **Nuevo** (< 1h): Contesta rápido
- 👻 **Ghost** (> 48h sin respuesta): Necesita seguimiento
`,

  // ============================================
  // INTELLIGENCE
  // ============================================
  'aletheia': `
# AletheIA Observatory

> Tu copiloto clínico con IA: analiza cada interacción y te da contexto.

## ¿Qué es el Observatory?

Es el panel lateral derecho que aparece cuando ves un paciente. Contiene:

- **Risk Assessment**: Score de -1 (crisis) a +1 (excelente)
- **Summary**: Resumen narrativo del estado actual
- **Themes**: Temas clave detectados en las conversaciones
- **Engagement**: % de participación del paciente

---

## Modos del Observatory

### Modo Paciente
Cuando tienes un paciente abierto:
- Muestra datos específicos de ese paciente
- Actualiza en tiempo real con nuevas notas

### Modo Global (Clinic Radar)
En el Dashboard:
- Alertas de toda tu práctica
- Pacientes que necesitan atención
- Pendientes de automatizaciones

---

## Cómo funciona

1. Cada nota/mensaje es procesado por Gemini
2. Se extraen: sentimiento, temas, riesgos
3. Los resultados se almacenan y agregan
4. El Observatory muestra el resumen

---

## Acciones inteligentes

Basado en el análisis, AletheIA sugiere:
- "Revisar bloqueo médico"
- "Enviar recordatorio de pago"
- "Considerar ajuste de medicación"
`,

  'sentinel-pulse': `
# Pulso Emocional

> Visualización en tiempo real de la evolución emocional del paciente.

## El Widget

El **Sentinel Pulse** es un gráfico SVG que muestra los últimos 7 días:

- **Línea verde**: Días positivos (score > 0)
- **Línea roja**: Días negativos (score < 0)
- **Punto pulsante "Now"**: Estado actual

---

## Estados del widget

| Estado | Significado |
|--------|-------------|
| 🟢 **Activo** | Hay datos de monitorización |
| 👻 **Dormant** | Paciente nuevo sin datos |
| 🔒 **Locked** | Función PRO (upgrade necesario) |

---

## Cómo se calcula

El score diario viene de:
1. Análisis de sentimiento de mensajes
2. Respuestas a formularios de check-in
3. Patrones de comunicación

---

## Alertas integradas

Si el score cae por debajo de -0.5:
- Aparece un **flag de riesgo**
- Se notifica al Observatory
- Se puede activar un Agente automático
`,

  'agents': `
# Agentes y Playbooks

> Automatizaciones inteligentes que trabajan 24/7.

## ¿Qué son los Agentes?

Son recetas de automatización pre-configuradas:

| Agente | Trigger | Acción |
|--------|---------|--------|
| 🛡️ **Escudo de Seguridad** | Riesgo alto | Bloquea + alerta |
| 💸 **Cobrador** | 48h sin pago | Envía recordatorio |
| ❤️ **Fidelización** | Post-retiro | Envía encuesta |
| 🤝 **Concierge** | Nuevo lead | Welcome + booking |

---

## Instalar un Agente

1. Ve a **Agentes** > **Catálogo**
2. Elige el agente que necesitas
3. Haz clic en **Instalar**
4. Actívalo con el toggle

---

## Modo Draft

Algunos agentes tienen modo "Borrador":
- No actúan automáticamente
- Crean una tarea pendiente
- Tú decides si ejecutar o no

---

## Crear Playbooks personalizados

Próximamente: Constructor visual de automatizaciones.
`,

  'chatbot': `
# Asistente IA

> Ayuda contextual 24/7 integrada en la plataforma.

## ¿Cómo funciona?

El chatbot flotante (esquina inferior derecha) es tu asistente:
- Responde preguntas sobre KURA OS
- Conoce el contexto (en qué página estás)
- Usa Gemini 2.5 Flash

---

## Preguntas rápidas

Al abrir el chat verás sugerencias:
- "¿Cómo creo una nueva ficha?"
- "¿Cómo conecto WhatsApp?"
- "¿Cómo grabo una nota de voz?"

---

## Es GRATIS

El Asistente IA está incluido en todos los planes.
No consume créditos de AletheIA.
Es infraestructura de retención.

---

## Limitaciones

- Solo conoce KURA OS (no da consejos clínicos)
- No accede a datos de pacientes
- Respuestas en español e inglés
`,

  // ============================================
  // ACCOUNT
  // ============================================
  'settings': `
# Configuración

> Perfil, organización y preferencias de la plataforma.

## Tu Perfil

En **Configuración** puedes editar:
- Nombre completo
- Email
- Foto de perfil
- Zona horaria
- Idioma preferido

---

## Organización

Si tienes un equipo (plan Center):
- Nombre de la clínica
- Logo
- URL de booking personalizada

---

## Preferencias

- **Tema**: Claro / Oscuro / Sistema
- **Notificaciones**: Email, push
- **Terminología**: "Pacientes" vs "Clientes"
`,

  'integrations': `
# Integraciones

> Conecta WhatsApp, Stripe y Google Calendar.

## WhatsApp

Conecta WhatsApp Business para:
- Recibir mensajes en la plataforma
- AletheIA analiza automáticamente
- Sentinel Pulse se actualiza

**Setup**: Escanea el QR en Configuración > Integraciones.

---

## Stripe

Para cobrar online:
1. Conecta tu cuenta de Stripe
2. Se habilitan pagos en booking
3. Los webhooks actualizan estados automáticamente

---

## Google Calendar

Conecta para:
- Ver disponibilidad real
- Crear eventos al confirmar reservas
- Sincronización bidireccional
`,

  'plans': `
# Planes

> Builder (gratis), Pro (€29/mes), Center (€99/mes).

## Comparación

| Feature | Builder | Pro | Center |
|---------|---------|-----|--------|
| Pacientes | 10 | 50 | Ilimitados |
| Créditos IA | 100/mes | 500/mes | 2000/mes |
| Sentinel Pulse | ❌ | ✅ | ✅ |
| Equipos | ❌ | ❌ | ✅ |

---

## Cómo cambiar de plan

1. Ve a **Configuración** > **Mi Plan**
2. Haz clic en **Cambiar Plan**
3. Elige el nuevo plan
4. Confirma el pago

---

## Cancelación

Puedes cancelar en cualquier momento.
El acceso continúa hasta fin del período pagado.
`,

  'credits': `
# Créditos IA

> Cómo funcionan los créditos de AletheIA.

## ¿Qué son los créditos?

Cada análisis de IA consume créditos:

| Acción | Créditos |
|--------|----------|
| Análisis de nota | 1 |
| Transcripción audio | 2 |
| Daily Briefing | 5 |
| Risk Assessment refresh | 1 |

---

## Ver tu uso

En **Configuración** > **Mi Plan** verás:
- Créditos usados este mes
- Créditos restantes
- Historial de uso

---

## Comprar más créditos

Si te quedas sin créditos:
1. Ve a **Mi Plan** > **Comprar Créditos**
2. Elige un paquete
3. Paga con Stripe

Los créditos extra no caducan.

---

## Tips para ahorrar

- El Asistente IA (chatbot) es GRATIS
- Agrupa notas cortas en una sola
- El Daily Briefing se puede desactivar
`,
};

/**
 * Get help content by slug.
 */
export function getHelpContent(slug: string): string | null {
  return HELP_CONTENT[slug] || null;
}

/**
 * Get chapter metadata by slug.
 */
export function getChapter(slug: string) {
  return HELP_CHAPTERS[slug] || null;
}

/**
 * Get all slugs for static generation.
 */
export function getAllSlugs(): string[] {
  return Object.keys(HELP_CHAPTERS);
}

/**
 * Parse markdown-like content to HTML string.
 * Returns HTML that can be used with dangerouslySetInnerHTML.
 */
export function parseMarkdownToHtml(content: string): string {
  const lines = content.trim().split('\n');
  const htmlParts: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      htmlParts.push(`<h1 class="text-2xl font-bold text-foreground mb-4">${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlParts.push(`<h2 class="text-xl font-semibold text-foreground mt-8 mb-4">${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlParts.push(`<h3 class="text-lg font-medium text-foreground mt-6 mb-3">${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ')) {
      htmlParts.push(`<blockquote class="border-l-4 border-brand pl-4 italic text-muted-foreground my-4">${escapeHtml(line.slice(2))}</blockquote>`);
    } else if (line.startsWith('---')) {
      htmlParts.push(`<hr class="my-8 border-border" />`);
    } else if (line.startsWith('- ')) {
      htmlParts.push(`<li class="ml-4 text-foreground list-disc">${processInline(line.slice(2))}</li>`);
    } else if (line.match(/^\d+\. /)) {
      htmlParts.push(`<li class="ml-4 list-decimal text-foreground">${processInline(line.replace(/^\d+\. /, ''))}</li>`);
    } else if (line.startsWith('💡') || line.startsWith('⚠️') || line.startsWith('🎉')) {
      htmlParts.push(`<div class="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl my-4">${escapeHtml(line)}</div>`);
    } else if (line.startsWith('|') && !line.includes('---')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length > 0) {
        const cellsHtml = cells.map((cell, j) =>
          `<span class="${j === 0 ? 'font-medium' : 'text-muted-foreground'}">${escapeHtml(cell)}</span>`
        ).join('');
        htmlParts.push(`<div class="grid grid-cols-2 gap-2 py-1 border-b border-border text-sm">${cellsHtml}</div>`);
      }
    } else if (line.startsWith('```')) {
      // Skip code block markers
    } else if (line.trim() === '') {
      htmlParts.push('<br />');
    } else {
      htmlParts.push(`<p class="my-2">${processInline(line)}</p>`);
    }
  });

  return htmlParts.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
}

