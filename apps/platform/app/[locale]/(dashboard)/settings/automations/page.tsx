'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Zap, Power, Trash2, Download, Sparkles, MessageSquarePlus, Bot, Settings } from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

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
    cloned_from_id: string | null;
    agent_config?: {
        tone?: 'CLINICAL' | 'EMPATHETIC' | 'DIRECT';
        mode?: 'AUTO_SEND' | 'DRAFT_ONLY';
        signature?: string;
    };
}

export default function AutomationsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || 'es';
    const [activeTab, setActiveTab] = useState<'my' | 'marketplace'>('my');
    const [myRules, setMyRules] = useState<AutomationRule[]>([]);
    const [templates, setTemplates] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [editingAgent, setEditingAgent] = useState<AutomationRule | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Load my rules
            const rulesRes = await fetch(`${API_URL}/automations/rules`, {
                credentials: 'include',
            });
            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setMyRules(data.rules || []);
            }

            // Load marketplace templates
            const marketRes = await fetch(`${API_URL}/automations/marketplace`, {
                credentials: 'include',
            });
            if (marketRes.ok) {
                const data = await marketRes.json();
                setTemplates(data.templates || []);
            }
        } catch (err) {
            console.error('Failed to load automations:', err);
            setError('Error al cargar las automatizaciones');
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(ruleId: string, currentState: boolean) {
        try {
            const res = await fetch(`${API_URL}/automations/rules/${ruleId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentState }),
            });

            if (res.ok) {
                setMyRules(rules =>
                    rules.map(r => r.id === ruleId ? { ...r, is_active: !currentState } : r)
                );
                setSuccess(!currentState ? 'Agente activado' : 'Agente desactivado');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Error al cambiar el estado');
        }
    }

    async function handleDelete(ruleId: string) {
        if (!confirm('¿Eliminar esta automatización?')) return;

        try {
            const res = await fetch(`${API_URL}/automations/rules/${ruleId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                setMyRules(rules => rules.filter(r => r.id !== ruleId));
                setSuccess('Agente eliminado');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Error al eliminar');
        }
    }

    async function handleInstall(templateId: string) {
        setInstalling(templateId);
        try {
            const res = await fetch(`${API_URL}/automations/rules/install/${templateId}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (res.ok) {
                const newRule = await res.json();
                setMyRules(rules => [...rules, newRule]);
                setSuccess('¡Agente activado! 🎉');
                setActiveTab('my');
                setTimeout(() => setSuccess(''), 3000);
            } else if (res.status === 409) {
                setError('Este agente ya está activo');
            } else {
                setError('Error al activar');
            }
        } catch (err) {
            setError('Error al instalar');
        } finally {
            setInstalling(null);
        }
    }

    function isInstalled(templateId: string): boolean {
        return myRules.some(r => r.cloned_from_id === templateId);
    }

    const triggerLabels: Record<string, string> = {
        'FORM_SUBMISSION_COMPLETED': 'Formulario enviado',
        'JOURNEY_STAGE_TIMEOUT': 'Tiempo excedido en etapa',
        'BOOKING_CONFIRMED': 'Reserva confirmada',
        'PAYMENT_SUCCEEDED': 'Pago completado',
        'PAYMENT_FAILED': 'Pago fallido',
        'LEAD_CREATED': 'Nuevo lead recibido',
        'LEAD_STAGED_TIMEOUT': 'Lead inactivo',
        'LEAD_CONVERTED': 'Lead convertido',
    };
    const actionLabels: Record<string, string> = {
        'update_journey_status': 'Actualizar estado del journey',
        'send_email': 'Enviar email',
        'send_whatsapp': 'Enviar WhatsApp',
        'create_task': 'Crear tarea',
    };

    const conditionLabels: Record<string, string> = {
        'risk_analysis.level': 'Nivel de riesgo',
        'form_type': 'Tipo de formulario',
        'journey_key': 'Journey',
        'current_stage': 'Etapa actual',
        'hours_elapsed': 'Horas transcurridas',
    };

    function renderWorkflowSteps(rule: AutomationRule) {
        const conditions = rule.conditions?.rules || [];
        const actions = rule.actions || [];

        return (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                {/* Conditions */}
                {conditions.length > 0 && (
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase min-w-[40px]">Si</span>
                        <div className="flex flex-wrap gap-1">
                            {conditions.map((c, i) => (
                                <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                    {conditionLabels[c.field] || c.field} = {c.value}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase min-w-[40px]">→</span>
                        <div className="flex flex-wrap gap-1">
                            {actions.map((a, i) => (
                                <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                    {actionLabels[a.type] || a.type}
                                    {a.params?.to && ` → ${a.params.to}`}
                                    {a.params?.status && ` → ${a.params.status}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push(`/${locale}/settings`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Volver a Configuración
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-200">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Equipo de Agentes Clínicos
                        </h1>
                        <p className="text-slate-500">Protocolos inteligentes de automatización clínica</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-2xl">✅</span>
                    <span className="text-emerald-700 font-medium">{success}</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <span className="text-red-700 font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'my'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Mis Agentes
                    {myRules.length > 0 && (
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-xs font-bold">
                            {myRules.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'marketplace'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Download className="w-4 h-4" />
                    Catálogo de Agentes
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-slate-500">Cargando agentes...</p>
                </div>
            ) : activeTab === 'my' ? (
                /* My Automations Tab */
                <div className="space-y-4">
                    {myRules.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">
                                No tienes agentes activos
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Activa protocolos desde el Catálogo para automatizar tu práctica
                            </p>
                            <button
                                onClick={() => setActiveTab('marketplace')}
                                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-lg shadow-violet-200"
                            >
                                Explorar Catálogo →
                            </button>
                        </div>
                    ) : (
                        myRules.map(rule => (
                            <div
                                key={rule.id}
                                className={`p-5 bg-white rounded-xl border-2 transition-all ${rule.is_active
                                    ? 'border-emerald-200 shadow-sm'
                                    : 'border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.is_active
                                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                                        : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        <IconRenderer name={rule.icon} className="w-6 h-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 text-lg">{rule.name}</h3>
                                        <p className="text-slate-500 text-sm mt-1">{rule.description}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Habilidad: {triggerLabels[rule.trigger_event] || rule.trigger_event}
                                        </p>
                                        {renderWorkflowSteps(rule)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        {/* Configure */}
                                        <button
                                            onClick={() => setEditingAgent(rule)}
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            title="Configurar personalidad"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </button>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => handleToggle(rule.id, rule.is_active)}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${rule.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${rule.is_active ? 'translate-x-7' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Marketplace Tab */
                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map(template => {
                        const installed = isInstalled(template.id);
                        return (
                            <div
                                key={template.id}
                                className="p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-violet-200 hover:shadow-md transition-all"
                            >
                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-violet-200">
                                    <IconRenderer name={template.icon} className="w-7 h-7" />
                                </div>

                                {/* Content */}
                                <h3 className="font-semibold text-slate-800 text-lg mb-2">{template.name}</h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{template.description}</p>

                                {/* Trigger badge */}
                                <div className="text-xs text-slate-400 mb-2">
                                    <span className="px-2 py-1 bg-slate-100 rounded-full">
                                        {triggerLabels[template.trigger_event] || template.trigger_event}
                                    </span>
                                </div>

                                {/* Workflow steps */}
                                {renderWorkflowSteps(template)}

                                {/* Install button */}
                                {installed ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                        <Power className="w-4 h-4" />
                                        Activo
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleInstall(template.id)}
                                        disabled={installing === template.id}
                                        className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {installing === template.id ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                Activando...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Activar
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {/* Request Custom Card */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-300 transition-all">
                        <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
                            <MessageSquarePlus className="w-7 h-7" />
                        </div>
                        <h3 className="font-semibold text-slate-600 text-lg mb-2">
                            ¿No encuentras lo que buscas?
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Cuéntanos qué automatización necesitas y la crearemos para ti.
                        </p>
                        <button
                            onClick={() => window.open('mailto:support@therapistos.com?subject=Solicitud de Agente', '_blank')}
                            className="w-full py-3 bg-white border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:border-violet-400 hover:text-violet-600 transition-all"
                        >
                        </button>
                    </div>
                </div>
            )}

            {/* Agent Configuration Modal */}
            {editingAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-4 border-b sticky top-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-violet-600" />
                                    Personalidad del Agente
                                </h3>
                                <button
                                    onClick={() => setEditingAgent(null)}
                                    className="p-1 hover:bg-white/50 rounded"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{editingAgent.name}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Tone Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tono de Voz
                                </label>
                                <select
                                    value={editingAgent.agent_config?.tone || 'EMPATHETIC'}
                                    onChange={(e) => setEditingAgent({
                                        ...editingAgent,
                                        agent_config: {
                                            ...editingAgent.agent_config,
                                            tone: e.target.value as 'CLINICAL' | 'EMPATHETIC' | 'DIRECT'
                                        }
                                    })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                >
                                    <option value="EMPATHETIC">🤗 Empático - Cálido y comprensivo</option>
                                    <option value="CLINICAL">🩺 Clínico - Profesional y preciso</option>
                                    <option value="DIRECT">🎯 Directo - Conciso y al grano</option>
                                </select>
                            </div>

                            {/* Draft Mode Toggle */}
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Requiere Aprobación Humana
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            Si está activo, el agente preparará el borrador pero esperará tu confirmación antes de enviar.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingAgent({
                                            ...editingAgent,
                                            agent_config: {
                                                ...editingAgent.agent_config,
                                                mode: editingAgent.agent_config?.mode === 'DRAFT_ONLY' ? 'AUTO_SEND' : 'DRAFT_ONLY'
                                            }
                                        })}
                                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingAgent.agent_config?.mode === 'DRAFT_ONLY'
                                            ? 'bg-violet-600'
                                            : 'bg-slate-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingAgent.agent_config?.mode === 'DRAFT_ONLY'
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Signature */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Firma Personalizada
                                </label>
                                <input
                                    type="text"
                                    value={editingAgent.agent_config?.signature || ''}
                                    onChange={(e) => setEditingAgent({
                                        ...editingAgent,
                                        agent_config: {
                                            ...editingAgent.agent_config,
                                            signature: e.target.value
                                        }
                                    })}
                                    placeholder="Equipo Kura"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setEditingAgent(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_URL}/automations/rules/${editingAgent.id}`, {
                                            method: 'PATCH',
                                            credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ agent_config: editingAgent.agent_config }),
                                        });

                                        if (res.ok) {
                                            setMyRules(rules =>
                                                rules.map(r => r.id === editingAgent.id ? editingAgent : r)
                                            );
                                            setSuccess('Configuración guardada');
                                            setEditingAgent(null);
                                            setTimeout(() => setSuccess(''), 3000);
                                        }
                                    } catch (err) {
                                        setError('Error al guardar');
                                    }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-colors"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
