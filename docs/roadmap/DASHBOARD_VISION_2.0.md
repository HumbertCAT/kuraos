# 🚀 Dashboard 2.0: The Clinical Operating System

> **Estado:** Concepto / Roadmap
> **Objetivo:** Transformar el Dashboard de una "Agenda Administrativa" a un "Centro de Mando de Alto Impacto" (Investor-Ready).

## 🧠 La Filosofía: "Pasado, Presente y Futuro"

Un dashboard clínico de excelencia no solo muestra el calendario (Presente), sino que contextualiza la salud del negocio y el impacto terapéutico.

* **Pasado (Resultados):** ¿Funciona mi terapia? ¿Mi negocio crece?
* **Presente (Foco):** ¿Qué necesito saber *ahora mismo* para mi próxima sesión?
* **Futuro (Pipeline):** ¿De dónde vendrán los ingresos del próximo mes?

---

## 🏗️ Nuevos Componentes (Widgets)

### 1. The Focus Card (El Copiloto)

*Reemplaza a la lista plana de eventos cuando hay una sesión inminente.*

* **Concepto:** No me digas que tengo cita a las 11:00. **Prepárame** para ella.
* **UI:** Tarjeta destacada (Hero) que aparece 1h antes de la sesión.
* **Datos:**
  * Foto grande del paciente.
  * **Flash AletheIA:** "Riesgo medio detectado en último formulario. Sueño irregular."
  * **Acción:** Botón "Abrir Protocolo" o "Ver Notas Previas".
* **Valor:** Ahorra 10 minutos de preparación al terapeuta.

### 2. Business Health (Más allá de Ingresos)

*Evolución de las métricas financieras actuales.*

* **Ingresos (MRR):** Añadir indicador de tendencia (ej: `↗ 12% vs mes pasado`).
* **Tasa de Ocupación:** % de horas disponibles vs. reservadas. (Clave para decidir si subir precios o activar marketing).
* **Churn Risk:** Alerta de pacientes que podrían abandonar (basado en falta de reservas futuras).

### 3. Pipeline Velocity (Mini-CRM)

*Visibilidad de ventas en la pantalla principal.*

* **UI:** Resumen compacto del embudo de Nurture/Ventas.
* **Datos:**
  * 🟢 5 Nuevos Leads (Esta semana).
  * 🟡 2 Esperando Respuesta.
  * 🔵 1 Cierre Probable.
* **Valor:** Mantiene el "sombrero de vendedor" activo sin salir del dashboard.

### 4. The Impact Index (El "Holy Grail" para Inversores)

*Correlación entre actividad clínica y mejora del paciente.*

* **UI:** Gráfico de línea dual (Sparkline o Area Chart).
* **Eje X:** Últimos 3 meses.
* **Línea A (Actividad):** Número de sesiones.
* **Línea B (Bienestar):** Score promedio de AletheIA (Risk inverso).
* **Narrativa:** "Tus intervenciones correlacionan con una mejora del 15% en la estabilidad de tus pacientes".

---

## 🎨 Layout Propuesto (Grid 12-Col)

```text
[ HERO: Daily Briefing Audio ] -------------------------------- (Col 12)

[ METRICS ROW: Financial Health + Trends ] -------------------- (Col 12)

[ FOCUS CARD (Presente) ]           [ PIPELINE (Futuro) ]
(Col 8)                             (Col 4)
- Próxima Sesión Contextualizada    - Mini-CRM
- O bien: Lista Agenda Smart        - Notas Rápidas

[ IMPACT INDEX (Pasado/Resultados) ] -------------------------- (Col 12)
- Gráfico de evolución clínica
```

---

## ✅ Next Steps (Implementación)

1. **Fase 1 (Hecho ✅):** Cockpit Operativo (Agenda Lista + Notas + Briefing).
2. **Fase 2 (Próxima):** Implementar "Focus Card" (Lógica de `NextSession`).
3. **Fase 3 (Data):** Conectar métricas de CRM al Dashboard (Pipeline).
4. **Fase 4 (Advanced):** Gráfico de Impacto (Requiere histórico de AletheIA).

---

*Documento creado: 2025-12-26*
