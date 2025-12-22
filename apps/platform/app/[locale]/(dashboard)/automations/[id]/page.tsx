'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Zap, Power, Trash2, ArrowLeft, Play, Pause,
    CheckCircle, XCircle, Clock, TrendingUp, Activity,
    Mail, Bell, Calendar, Shield, HeartHandshake, Banknote,
    ChevronRight, AlertCircle
} from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

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

// Execution log interface
interface ExecutionLog {
    id: string;
    patient_name: string | null;
    status: string;
    action: string;
    timestamp: string;
    error: string | null;
}

// Stats interface
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

// Human-readable action descriptions
const actionDescriptions: Record<string, string> = {
    'send_email': 'Envía un email automático al paciente',
    'send_internal_notification': 'Te notifica por email para que actúes',
    'update_journey_status': 'Cambia el estado del proceso del paciente',
    'schedule_followup': 'Programa un recordatorio de seguimiento',
    'log_alert': 'Registra una alerta en el historial clínico',
};

// Action type icons
const actionIcons: Record<string, React.ReactNode> = {
    'send_email': <Mail className="w-4 h-4" />,
    'send_internal_notification': <Bell className="w-4 h-4" />,
    'update_journey_status': <Activity className="w-4 h-4" />,
    'schedule_followup': <Calendar className="w-4 h-4" />,
    'log_alert': <Shield className="w-4 h-4" />,
};

// Trigger event labels
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
};

// Human-readable trigger descriptions
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
};

// Condition field labels
const conditionLabels: Record<string, string> = {
    'risk_level': 'Nivel de Riesgo',
    'form_type': 'Tipo de Formulario',
    'payment_status': 'Estado del Pago',
    'journey_stage': 'Etapa del Journey',
    'journey_key': 'Journey',
    'current_stage': 'Etapa Actual',
    'hours_elapsed': 'Horas Transcurridas',
};

// Generate human-readable condition description
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!automation) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Automatización no encontrada</p>
                <button onClick={() => router.back()} className="mt-4 text-purple-600 hover:underline">
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
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Automatizaciones</span>
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                            <IconRenderer name={automation.icon} className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{automation.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${automation.is_active
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {automation.is_active ? 'Activa' : 'Pausada'}
                                </span>
                            </div>
                            <p className="text-slate-500 mt-1">{automation.description}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggle}
                            disabled={toggling}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer ${automation.is_active
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                        >
                            {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span>{automation.is_active ? 'Pausar' : 'Activar'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.total_executions ?? 0}</p>
                            <p className="text-xs text-slate-500">Ejecuciones Totales</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{successRate}%</p>
                            <p className="text-xs text-slate-500">Tasa de Éxito</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats?.this_month ?? 0}</p>
                            <p className="text-xs text-slate-500">Este Mes</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {stats?.last_execution
                                    ? new Date(stats.last_execution).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'Sin ejecuciones'
                                }
                            </p>
                            <p className="text-xs text-slate-500">Última Ejecución</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Flow + Execution Log */}
            <div className="grid grid-cols-5 gap-6">
                {/* Visual Flow Diagram - 3 columns */}
                <div className="col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Flujo de Automatización</h2>

                    <div className="relative">
                        {/* Flow Container */}
                        <div className="flex flex-col gap-3">
                            {/* Trigger */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <p className="text-xs font-medium text-purple-400 uppercase tracking-wide">Cuando</p>
                                    <p className="text-slate-700 text-sm mt-1 italic">
                                        "{triggerDescriptions[automation.trigger_event] || 'Se dispara este evento'}"
                                    </p>
                                    <p className="text-slate-400 text-xs mt-2">
                                        {triggerLabels[automation.trigger_event] || automation.trigger_event}
                                    </p>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center ml-5">
                                <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-amber-300"></div>
                            </div>

                            {/* Conditions (if any) */}
                            {automation.conditions?.rules && automation.conditions.rules.length > 0 && (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Si</p>
                                            <p className="text-slate-700 text-sm mt-1 italic">
                                                "Solo cuando {generateConditionDescription(automation.conditions.rules)}"
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {automation.conditions.rules.map((rule, i) => (
                                                    <span key={i} className="bg-white border border-amber-200 text-slate-500 px-3 py-1 rounded-full text-xs">
                                                        {conditionLabels[rule.field] || rule.field} = <strong>{rule.value}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center ml-5">
                                        <div className="w-0.5 h-6 bg-gradient-to-b from-amber-300 to-emerald-300"></div>
                                    </div>
                                </>
                            )}

                            {/* Actions */}
                            {automation.actions.map((action, index) => (
                                <div key={index}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                            {actionIcons[action.type] || <Play className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                                                {index === 0 ? 'Entonces' : 'Y también'}
                                            </p>
                                            <p className="text-slate-700 text-sm mt-1 italic">
                                                "{actionDescriptions[action.type] || 'Ejecuta esta acción'}"
                                            </p>
                                            <p className="text-slate-400 text-xs mt-2">
                                                {actionLabels[action.type] || action.type}
                                            </p>
                                            {action.params && Object.keys(action.params).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {Object.entries(action.params).map(([key, value]) => (
                                                        <span key={key} className="bg-white border border-emerald-200 text-slate-500 px-2 py-0.5 rounded text-xs">
                                                            {key}: <strong>{value}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow between actions */}
                                    {index < automation.actions.length - 1 && (
                                        <div className="flex items-center ml-5">
                                            <div className="w-0.5 h-4 bg-emerald-200"></div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* End */}
                            <div className="flex items-center ml-5 mt-2">
                                <div className="w-0.5 h-4 bg-gradient-to-b from-emerald-300 to-slate-200"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <p className="text-slate-400 font-medium">Completado ✓</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Execution Log - 2 columns */}
                <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Ejecuciones Recientes</h2>
                        <span className="text-xs text-slate-400">Últimas 24h</span>
                    </div>

                    <div className="space-y-3">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <p>Sin ejecuciones todavía</p>
                            </div>
                        ) : logs.map((log) => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-xl border ${log.status === 'SUCCESS'
                                    ? 'bg-emerald-50/50 border-emerald-100'
                                    : 'bg-red-50/50 border-red-100'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.status === 'SUCCESS' ? 'bg-emerald-100' : 'bg-red-100'
                                        }`}>
                                        {log.status === 'SUCCESS'
                                            ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            : <XCircle className="w-4 h-4 text-red-600" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-slate-900 text-sm truncate">{log.patient_name || 'Sistema'}</p>
                                            <span className="text-xs text-slate-400">
                                                {new Date(log.timestamp).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{actionLabels[log.action] || log.action}</p>
                                        {log.error && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {log.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1 cursor-pointer">
                        Ver todo el historial
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
