/**
 * MDX Content Utility for Help Center
 * 
 * Content is inlined to avoid fs.readFileSync issues in Vercel serverless.
 * For future: Consider Contentlayer, CMS, or fetch from API.
 */

/**
 * Chapter metadata for navigation.
 */
export const HELP_CHAPTERS = [
  { slug: 'primeros-pasos', title: 'Primeros Pasos', icon: '🚀', description: 'Configura tu cuenta en 5 minutos' },
  { slug: 'pacientes', title: 'Pacientes', icon: '👥', description: 'Soul Record y perfiles de pacientes' },
  { slug: 'diario-clinico', title: 'Diario Clínico', icon: '📝', description: 'Notas, audio y análisis IA' },
  { slug: 'formularios', title: 'Formularios', icon: '📋', description: 'Crea y envía formularios' },
  { slug: 'reservas', title: 'Reservas', icon: '📅', description: 'Calendario y servicios' },
  { slug: 'automatizaciones', title: 'Automatizaciones', icon: '⚡', description: 'Playbooks y reglas' },
  { slug: 'whatsapp', title: 'WhatsApp & AletheIA', icon: '💬', description: 'Monitorización y alertas' },
  { slug: 'facturacion', title: 'Facturación', icon: '💳', description: 'Planes y créditos' },
];

/**
 * Inline content map - avoids fs.readFileSync which fails on Vercel serverless.
 */
const HELP_CONTENT: Record<string, string> = {
  'primeros-pasos': `
# Primeros Pasos

> Configura tu cuenta de KURA OS en 5 minutos.

## 1. Crear tu primer paciente

1. Ve a **Pacientes** en el menú lateral
2. Haz clic en **+ Nuevo Paciente**
3. Rellena nombre y email → **Guardar**

💡 **Tip:** El email del paciente se usará para enviarle formularios y recordatorios.

---

## 2. Grabar tu primera nota clínica

1. Abre la ficha del paciente que acabas de crear
2. En el **Diario Clínico**, escribe una nota o usa el 🎙️ para grabar audio
3. Haz clic en **Enviar** para guardarla

La IA analizará automáticamente tu nota y detectará riesgos clínicos.

---

## 3. Enviar un formulario de intake

1. En la ficha del paciente, haz clic en **Enviar Formulario**
2. Selecciona una plantilla (ej: "Intake Psicodélico")
3. Copia el enlace o envíalo por WhatsApp

Cuando el paciente lo complete, aparecerá en su timeline.

---

## Próximos pasos

- 📅 [Configurar tu calendario de reservas](/settings)
- ⚡ [Activar automatizaciones](/automations)
- 💬 [Conectar WhatsApp](/settings)
`,

  'pacientes': `
# Pacientes

> Soul Record: el perfil 360° de cada paciente.

## La Ficha del Paciente

Cada paciente tiene un **Soul Record** que incluye:

- **Datos básicos**: Nombre, email, teléfono
- **Journey Status**: En qué fase del tratamiento está
- **Timeline clínico**: Todas las notas, formularios y análisis
- **AletheIA Insights**: Riesgo, engagement, temas clave

## Crear un nuevo paciente

1. Ve a **Pacientes** > **+ Nuevo Paciente**
2. Rellena los campos requeridos
3. Opcionalmente, asigna un Journey (retiro, coaching, etc.)

## Buscar pacientes

Usa la barra de búsqueda para encontrar por nombre o email.

## Acciones rápidas

- **Ver Chat Original**: Abre el historial de WhatsApp
- **Contactar**: Envía mensaje directo
- **Editar**: Modifica datos del paciente
`,

  'diario-clinico': `
# Diario Clínico

> Notas, audio y análisis IA en un solo lugar.

## Tipos de entradas

- **Notas de texto**: Editor rico estilo Notion (TipTap)
- **Audio**: Graba notas de voz que se transcriben automáticamente
- **Formularios**: Respuestas de intake aparecen aquí
- **Análisis IA**: Resúmenes generados por AletheIA

## Grabar una nota

1. Abre la ficha del paciente
2. Ve a la pestaña **Diario Clínico**
3. Escribe tu nota o haz clic en 🎙️ para grabar
4. Haz clic en **Enviar**

## Análisis automático

Cada nota es analizada por AletheIA para detectar:
- Riesgos clínicos (ideación suicida, autolesión)
- Temas recurrentes
- Nivel de engagement
`,

  'formularios': `
# Formularios

> Crea y envía formularios de intake sin fricción.

## Crear un formulario

1. Ve a **Formularios** > **+ Nuevo**
2. Añade campos: texto, selección, escala, etc.
3. Configura el scoring de riesgo (opcional)
4. Guarda la plantilla

## Enviar a un paciente

1. Abre la ficha del paciente
2. Haz clic en **Enviar Formulario**
3. Selecciona la plantilla
4. Copia el enlace o comparte por WhatsApp

## Formularios públicos (Lead Generation)

Los formularios pueden ser públicos para captar leads:
- Comparte en tu Instagram bio
- Usa QR codes en eventos
- Los envíos crean leads automáticamente
`,

  'reservas': `
# Reservas

> Calendario y servicios integrados.

## Crear un servicio

1. Ve a **Servicios** > **+ Nuevo**
2. Define: nombre, duración, precio
3. Vincula un formulario de intake (opcional)
4. Activa el pago online con Stripe

## Gestionar disponibilidad

1. Ve a **Calendario**
2. Configura tus horarios disponibles
3. Añade excepciones (vacaciones, etc.)

## Página de reservas pública

Cada terapeuta tiene una URL pública:
\`https://app.kuraos.ai/book/[tu-id]\`

Los clientes pueden:
1. Ver servicios disponibles
2. Elegir fecha y hora
3. Pagar online
4. Recibir confirmación
`,

  'automatizaciones': `
# Automatizaciones

> Playbooks y reglas que trabajan por ti.

## ¿Qué son los Agentes?

Los Agentes son automatizaciones pre-configuradas que reaccionan a eventos:

| Agente | Trigger | Acción |
|--------|---------|--------|
| 🛡️ Escudo de Seguridad | Riesgo alto en formulario | Bloquea paciente + alerta |
| 💸 Cobrador Automático | 48h sin pago | Envía recordatorio |
| ❤️ Fidelización | 7 días post-retiro | Envía encuesta |

## Activar un agente

1. Ve a **Agentes** > **Catálogo**
2. Elige el agente que necesitas
3. Haz clic en **Instalar**
4. Actívalo con el toggle

## Modo Draft

Algunos agentes tienen modo "Borrador" que requiere tu aprobación antes de actuar.
`,

  'whatsapp': `
# WhatsApp & AletheIA

> Monitorización y alertas en tiempo real.

## Conectar WhatsApp

1. Ve a **Configuración** > **Integraciones**
2. Escanea el QR con WhatsApp Business
3. Los mensajes empezarán a sincronizarse

## Sentinel Pulse

El **Pulso Emocional** muestra la tendencia de los últimos 7 días:
- 🟢 Verde: Sentimiento positivo
- 🔴 Rojo: Sentimiento en riesgo
- El punto pulsante indica el estado actual

## Alertas automáticas

AletheIA analiza los mensajes y genera alertas:
- **Críticas**: Ideación negativa detectada
- **Warning**: Patrones de evitación
- **Info**: Cambios de tema significativos

## Risk Assessment

El score de riesgo (-1 a +1) se calcula diariamente basado en:
- Sentimiento de los mensajes
- Frecuencia de comunicación
- Palabras clave de alerta
`,

  'facturacion': `
# Facturación

> Planes y créditos de AletheIA.

## Planes disponibles

| Plan | Pacientes | Créditos IA | Precio |
|------|-----------|-------------|--------|
| **Builder** | 10 | 100/mes | Gratis |
| **Pro** | 50 | 500/mes | €29/mes |
| **Center** | Ilimitados | 2000/mes | €99/mes |

## Créditos de AletheIA

Cada análisis de IA consume créditos:
- Análisis de nota: 1 crédito
- Transcripción de audio: 2 créditos
- Daily Briefing: 5 créditos

## Comprar créditos adicionales

Si te quedas sin créditos antes de fin de mes:
1. Ve a **Configuración** > **Mi Plan**
2. Haz clic en **Comprar Créditos**
3. Elige un paquete

## Gestionar suscripción

Puedes cambiar de plan o cancelar en cualquier momento desde **Mi Plan**.
`,
};

/**
 * Get help content by slug.
 * Returns the content string or null if not found.
 */
export function getHelpContent(slug: string): string | null {
  return HELP_CONTENT[slug] || null;
}

/**
 * Parse markdown-like content to React elements.
 * A simple parser for basic markdown syntax.
 */
export function parseMarkdown(content: string): React.ReactNode[] {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-semibold text-foreground mt-8 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-4 border-brand pl-4 italic text-muted-foreground my-4">{line.slice(2)}</blockquote>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="my-8 border-border" />);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="ml-4 text-foreground">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={i} className="ml-4 list-decimal text-foreground">{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.startsWith('💡') || line.startsWith('⚠️')) {
      elements.push(<div key={i} className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl my-4">{line}</div>);
    } else if (line.startsWith('|')) {
      // Table handling - basic
      elements.push(<div key={i} className="overflow-x-auto my-4"><pre className="text-sm">{line}</pre></div>);
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      // Bold text and links
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand hover:underline">$1</a>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>');
      elements.push(<p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: processed }} />);
    }
  });
  
  return elements;
}
