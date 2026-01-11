# Clinical Stream — Future Design (Deferred)

> [!NOTE]
> **Status**: Deferred to v1.8.x or later  
> **Origin**: v1.7.5 session (2026-01-11)  
> **Draft Components**: `~/Desktop/ClinicalStream_v1.7.5_draft/`

## Concepto

Rediseño radical de la página de paciente con arquitectura mobile-first.

### Mobile Layout
```
┌─────────────────────────┐
│     PatientHUD          │  ← Cabecera compacta, Risk Badge expandible
├─────────────────────────┤
│                         │
│   ClinicalTimeline      │  ← Feed vertical infinito
│      (Full Screen)      │
│                         │
├─────────────────────────┤
│      ClinicalFAB        │  ← Speed Dial: +Nota, +Sesión, +Form
└─────────────────────────┘
```

### Desktop Layout
```
┌───────────────────────────────────────────────┐
│  PatientHUD (8 cols)    │ ContextPanel (4 cols)│
├─────────────────────────┼─────────────────────┤
│                         │                     │
│  ClinicalTimeline       │  Sticky Summary     │
│  (Scrollable)           │  Quick Actions      │
│                         │  AI Insights        │
│                         │                     │
└─────────────────────────┴─────────────────────┘
```

## Componentes Draft

| Componente | Descripción |
|------------|-------------|
| `PatientHUD.tsx` | Cabecera compacta con Risk Badge expandible |
| `ClinicalTimeline.tsx` | Feed vertical con optimizaciones |
| `ClinicalFAB.tsx` | Speed Dial móvil |
| `PatientContextPanel.tsx` | Panel sticky desktop |

## Motivo del Defer

- Diseño requiere más iteración
- Feedback inicial: "demasiado simplificado"
- Priorizar estabilidad y PWA antes de rediseños grandes

## Próximos Pasos

1. Revisar el diseño con calma (post-v1.7.x)
2. Prototipar en Figma antes de implementar
3. Considerar user testing con el nuevo flow
