'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Zap, Power, ArrowLeft, Play, Pause,
    CheckCircle, XCircle, Clock, TrendingUp, Activity,
    Mail, Bell, Calendar, Shield, Radio,
    ChevronRight, AlertCircle
} from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';

import { API_URL } from '@/lib/api';

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    icon: string;
    trigger_event: string;
    conditions: {
        logic?: string;
        rules?: Array<{ field: string; operator: string; value: string }>;
    };
    actions: Array<{ type: string; params: Record<string, string> }>;
    is_active: boolean;
    is_system_template: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

interface ExecutionLog {
    id: string;
    patient_name: string | null;
    status: string;
    action: string;
    timestamp: string;
    error: string | null;
}

interface AutomationStats {
    total_executions: number;
    success_count: number;
    failed_count: number;
    this_month: number;
    last_execution: string | null;
}

// Action type labels
const actionLabels: Record<string, string> = {
    'send_email': 'Enviar Email',
    'send_internal_notification': 'Notificar Terapeuta',
    'update_journey_status': 'Actualizar Journey',
    'schedule_followup': 'Programar Seguimiento',
    'log_alert': 'Registrar Alerta',
};

const actionDescriptions: Record<string, string> = {
    'send_email': 'Envía un email automático al paciente',
    'send_internal_notification': 'Te notifica por email para que actúes',
    'update_journey_status': 'Cambia el estado del proceso del paciente',
    'schedule_followup': 'Programa un recordatorio de seguimiento',
    'log_alert': 'Registra una alerta en el historial clínico',
};

const actionIcons: Record<string, React.ReactNode> = {
    'send_email': <Mail className="w-5 h-5" />,
    'send_internal_notification': <Bell className="w-5 h-5" />,
    'update_journey_status': <Activity className="w-5 h-5" />,
    'schedule_followup': <Calendar className="w-5 h-5" />,
    'log_alert': <Shield className="w-5 h-5" />,
};

const triggerLabels: Record<string, string> = {
    'FORM_SUBMITTED': 'Formulario Enviado',
    'RISK_DETECTED_IN_NOTE': 'Riesgo Detectado en Nota',
    'RISK_DETECTED_IN_FORM': 'Riesgo Detectado en Formulario',
    'BOOKING_CONFIRMED': 'Reserva Confirmada',
    'BOOKING_CANCELLED': 'Reserva Cancelada',
    'PAYMENT_RECEIVED': 'Pago Recibido',
    'PAYMENT_FAILED': 'Pago Fallido',
    'JOURNEY_STAGE_CHANGED': 'Etapa del Journey Cambiada',
    'JOURNEY_STAGE_TIMEOUT': 'Tiempo Excedido en Etapa',
    'LEAD_CREATED': 'Nuevo Lead Recibido',
    'LEAD_STAGED_TIMEOUT': 'Lead Inactivo',
};

const triggerDescriptions: Record<string, string> = {
    'FORM_SUBMITTED': 'Un paciente envía un formulario desde el enlace que compartiste',
    'RISK_DETECTED_IN_NOTE': 'La IA detecta indicadores de riesgo en tus notas clínicas',
    'RISK_DETECTED_IN_FORM': 'La IA detecta indicadores de riesgo en las respuestas del paciente',
    'BOOKING_CONFIRMED': 'Un paciente confirma su reserva desde el enlace de booking',
    'BOOKING_CANCELLED': 'Un paciente cancela su cita programada',
    'PAYMENT_RECEIVED': 'Se recibe un pago exitoso del paciente',
    'PAYMENT_FAILED': 'Un intento de pago del paciente falla',
    'JOURNEY_STAGE_CHANGED': 'El paciente avanza o retrocede en su proceso terapéutico',
    'JOURNEY_STAGE_TIMEOUT': 'Un paciente lleva demasiado tiempo en la misma etapa sin avanzar',
    'LEAD_CREATED': 'Un nuevo lead llega a través del formulario de captación',
    'LEAD_STAGED_TIMEOUT': 'Un lead ha permanecido inactivo por demasiado tiempo',
};

const conditionLabels: Record<string, string> = {
    'risk_level': 'Nivel de Riesgo',
    'form_type': 'Tipo de Formulario',
    'payment_status': 'Estado del Pago',
    'journey_stage': 'Etapa del Journey',
    'journey_key': 'Journey',
    'current_stage': 'Etapa Actual',
    'hours_elapsed': 'Horas Transcurridas',
};

function generateConditionDescription(rules: Array<{ field: string; operator: string; value: string }>): string {
    if (!rules || rules.length === 0) return 'Se cumplen ciertas condiciones';

    const parts: string[] = [];

    for (const rule of rules) {
        switch (rule.field) {
            case 'journey_key':
                parts.push(`el proceso es "${rule.value}"`);
                break;
            case 'current_stage':
                const stageLabels: Record<string, string> = {
                    'AWAITING_PAYMENT': 'esperando pago',
                    'INTAKE': 'fase inicial',
                    'IN_PROGRESS': 'en progreso',
                    'COMPLETED': 'completado',
                };
                parts.push(`está en la etapa "${stageLabels[rule.value] || rule.value}"`);
                break;
            case 'hours_elapsed':
                parts.push(`han pasado ${rule.value} horas`);
                break;
            case 'risk_level':
                const riskLabels: Record<string, string> = { 'HIGH': 'alto', 'MEDIUM': 'medio', 'LOW': 'bajo' };
                parts.push(`el nivel de riesgo es ${riskLabels[rule.value] || rule.value}`);
                break;
            case 'form_type':
                parts.push(`el formulario es de tipo "${rule.value}"`);
                break;
            default:
                parts.push(`${conditionLabels[rule.field] || rule.field} es "${rule.value}"`);
        }
    }

    return parts.join(' y ');
}

export default function AutomationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Automations');
    const id = params.id as string;

    const [automation, setAutomation] = useState<AutomationRule | null>(null);
    const [stats, setStats] = useState<AutomationStats | null>(null);
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        loadAutomation();
        loadStats();
        loadLogs();
    }, [id]);

    async function loadAutomation() {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/automations/rules/${id}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setAutomation(data);
            }
        } catch (error) {
            console.error('Error loading automation:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(`${API_URL}/automations/rules/${id}/stats`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function loadLogs() {
        try {
            const response = await fetch(`${API_URL}/automations/rules/${id}/logs?limit=10`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    }

    async function handleToggle() {
        if (!automation) return;
        setToggling(true);
        try {
            const response = await fetch(`${API_URL}/automations/rules/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ is_active: !automation.is_active }),
            });
            if (response.ok) {
                setAutomation({ ...automation, is_active: !automation.is_active });
            }
        } catch (error) {
            console.error('Error toggling automation:', error);
        } finally {
            setToggling(false);
        }
    }

    const successRate = stats && stats.total_executions > 0
        ? Math.round((stats.success_count / stats.total_executions) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ai"></div>
            </div>
        );
    }

    if (!automation) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Automatización no encontrada</p>
                <button onClick={() => router.back()} className="mt-4 text-ai hover:underline">
                    ← Volver
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="type-body">Volver a Automatizaciones</span>
            </button>

            {/* Header - Glass Card with Hero Icon */}
            <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {/* Hero Icon with type-based shadow */}
                        <div className="w-16 h-16 bg-gradient-to-br from-ai to-ai/70 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-ai/30">
                            <IconRenderer name={automation.icon} className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="type-h1 text-foreground">{automation.name}</h1>
                                <span className={automation.is_active ? 'badge badge-success' : 'badge badge-muted'}>
                                    {automation.is_active ? 'Activa' : 'Pausada'}
                                </span>
                            </div>
                            <p className="type-body text-muted-foreground mt-1">{automation.description}</p>
                        </div>
                    </div>

                    {/* Toggle Button - Tactile */}
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`btn btn-md ${automation.is_active ? 'btn-warning' : 'btn-success'}`}
                    >
                        {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{automation.is_active ? 'Pausar' : 'Activar'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - Glass Style */}
            <div className="grid grid-cols-4 gap-4">
                {/* Total Executions */}
                <div className="card bg-card/50 backdrop-blur-sm border-white/5 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ai/10 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-ai" />
                        </div>
                        <div>
                            <p className="type-h2 font-mono text-foreground">{stats?.total_executions ?? 0}</p>
                            <p className="type-ui text-muted-foreground">EJECUCIONES</p>
                        </div>
                    </div>
                </div>

                {/* Success Rate */}
                <div className="card bg-card/50 backdrop-blur-sm border-white/5 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <p className="type-h2 font-mono text-foreground">{successRate}%</p>
                            <p className="type-ui text-muted-foreground">TASA ÉXITO</p>
                        </div>
                    </div>
                </div>

                {/* This Month */}
                <div className="card bg-card/50 backdrop-blur-sm border-white/5 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                            <p className="type-h2 font-mono text-foreground">{stats?.this_month ?? 0}</p>
                            <p className="type-ui text-muted-foreground">ESTE MES</p>
                        </div>
                    </div>
                </div>

                {/* Last Execution */}
                <div className="card bg-card/50 backdrop-blur-sm border-white/5 dark:border-white/5 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <p className="type-body font-mono text-foreground">
                                {stats?.last_execution
                                    ? new Date(stats.last_execution).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'Sin actividad'
                                }
                            </p>
                            <p className="type-ui text-muted-foreground">ÚLTIMA EJECUCIÓN</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logic Flow + Execution Log */}
            <div className="grid grid-cols-5 gap-6">
                {/* Neural Flow Diagram - 3 columns */}
                <div className="col-span-3 card p-6">
                    <h2 className="type-ui text-muted-foreground tracking-wider mb-6">FLUJO DE AUTOMATIZACIÓN</h2>

                    {/* The Circuit Board */}
                    <div className="relative pl-6">
                        {/* Vertical connector line */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-border"></div>

                        {/* Trigger Node */}
                        <div className="relative flex items-start gap-4 mb-6">
                            {/* Node on the line */}
                            <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-ai to-ai/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-ai/20 z-10">
                                <Zap className="w-6 h-6" />
                            </div>
                            {/* Card */}
                            <div className="ml-10 flex-1 card border-l-4 border-l-ai p-4">
                                <p className="type-ui text-ai tracking-wider">CUANDO</p>
                                <p className="type-body text-foreground mt-1">
                                    "{triggerDescriptions[automation.trigger_event] || 'Se dispara este evento'}"
                                </p>
                                <span className="badge badge-ai mt-2">
                                    {triggerLabels[automation.trigger_event] || automation.trigger_event}
                                </span>
                            </div>
                        </div>

                        {/* Conditions (if any) */}
                        {automation.conditions?.rules && automation.conditions.rules.length > 0 && (
                            <div className="relative flex items-start gap-4 mb-6">
                                {/* Diamond node */}
                                <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning/20 z-10 rotate-45">
                                    <Shield className="w-5 h-5 -rotate-45" />
                                </div>
                                {/* Card */}
                                <div className="ml-10 flex-1 card border-l-4 border-l-warning p-4">
                                    <p className="type-ui text-warning tracking-wider">SI</p>
                                    <p className="type-body text-foreground mt-1">
                                        "Solo cuando {generateConditionDescription(automation.conditions.rules)}"
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {automation.conditions.rules.map((rule, i) => (
                                            <span key={i} className="badge badge-warning">
                                                {conditionLabels[rule.field] || rule.field} = <strong>{rule.value}</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {automation.actions.map((action, index) => (
                            <div key={index} className="relative flex items-start gap-4 mb-6">
                                {/* Node */}
                                <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-success to-success/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-success/20 z-10">
                                    {actionIcons[action.type] || <Play className="w-5 h-5" />}
                                </div>
                                {/* Card with email preview style */}
                                <div className="ml-10 flex-1 card border-l-4 border-l-success p-4">
                                    <p className="type-ui text-success tracking-wider">
                                        {index === 0 ? 'ENTONCES' : 'Y TAMBIÉN'}
                                    </p>
                                    <p className="type-body text-foreground mt-1">
                                        "{actionDescriptions[action.type] || 'Ejecuta esta acción'}"
                                    </p>

                                    {/* Email Preview Window (if send_email action) */}
                                    {action.type === 'send_email' && action.params && (
                                        <div className="mt-3 bg-background border border-border rounded-lg p-3 shadow-inner">
                                            <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">Vista previa del email</span>
                                            </div>
                                            {action.params.subject && (
                                                <p className="text-sm font-medium text-foreground">Asunto: {action.params.subject}</p>
                                            )}
                                            {action.params.to && (
                                                <p className="text-xs text-muted-foreground mt-1">Para: {action.params.to}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Other params as badges */}
                                    {action.params && Object.keys(action.params).length > 0 && action.type !== 'send_email' && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {Object.entries(action.params).map(([key, value]) => (
                                                <span key={key} className="badge badge-success">
                                                    {key}: <strong>{value}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* End Node */}
                        <div className="relative flex items-start gap-4">
                            <div className="absolute -left-6 w-12 h-12 bg-muted rounded-xl flex items-center justify-center z-10">
                                <CheckCircle className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="ml-10 flex-1 card bg-muted/50 p-4">
                                <p className="type-body text-muted-foreground font-medium">Completado ✓</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Execution Log - 2 columns */}
                <div className="col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="type-ui text-muted-foreground tracking-wider">EJECUCIONES RECIENTES</h2>
                        <span className="text-xs text-muted-foreground">Últimas 24h</span>
                    </div>

                    <div className="space-y-3">
                        {logs.length === 0 ? (
                            /* Standing By State */
                            <div className="text-center py-12">
                                <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
                                <p className="type-body text-muted-foreground">Sistema en espera</p>
                                <p className="text-xs text-muted-foreground/50 mt-1">Sin ejecuciones recientes</p>
                            </div>
                        ) : logs.map((log) => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-xl border ${log.status === 'SUCCESS'
                                    ? 'bg-success/5 border-success/20'
                                    : 'bg-risk/5 border-risk/20'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.status === 'SUCCESS' ? 'bg-success/10' : 'bg-risk/10'
                                        }`}>
                                        {log.status === 'SUCCESS'
                                            ? <CheckCircle className="w-4 h-4 text-success" />
                                            : <XCircle className="w-4 h-4 text-risk" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="type-body font-medium text-foreground truncate">{log.patient_name || 'Sistema'}</p>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{actionLabels[log.action] || log.action}</p>
                                        {log.error && (
                                            <p className="text-xs text-risk mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {log.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn btn-ghost w-full mt-4 text-ai">
                        Ver todo el historial
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
