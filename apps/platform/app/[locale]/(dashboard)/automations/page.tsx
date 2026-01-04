'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Zap, Power, Trash2, Download, Sparkles, MessageSquarePlus, Bot, Settings, BarChart3, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import IconRenderer from '@/components/IconRenderer';
import PageHeader from '@/components/PageHeader';
import { Tooltip } from '@/components/ui/tooltip';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';

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
    const t = useTranslations('Automations');
    const tt = useTranslations('Tooltips');
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
            <div className="mt-3 pt-3 border-t border-border space-y-2">
                {/* Conditions */}
                {conditions.length > 0 && (
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase min-w-[40px]">Si</span>
                        <div className="flex flex-wrap gap-1">
                            {conditions.map((c, i) => (
                                <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                                    {conditionLabels[c.field] || c.field} = {c.value}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase min-w-[40px]">→</span>
                        <div className="flex flex-wrap gap-1">
                            {actions.map((a, i) => (
                                <span key={i} className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
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
        <div className="space-y-6">
            <PageHeader
                icon={Bot}
                title={t('title')}
                subtitle={t('subtitle')}
            />

            {/* Alerts */}
            {success && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-2xl">✅</span>
                    <span className="text-success font-medium">{success}</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <span className="text-destructive font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto text-destructive/70 hover:text-destructive">✕</button>
                </div>
            )}

            {/* Tabs - Standardized */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'my'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Mis Agentes
                    {myRules.length > 0 && (
                        <span className="px-2 py-0.5 bg-brand/10 text-brand rounded-full text-xs font-bold">
                            {myRules.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'marketplace'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Download className="w-4 h-4" />
                    Catálogo de Agentes
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="text-muted-foreground">Cargando agentes...</p>
                </div>
            ) : activeTab === 'my' ? (
                /* My Automations Tab */
                <div className="space-y-4">
                    {myRules.length === 0 ? (
                        <CyberCard className="text-center py-16 border-2 border-dashed">
                            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground/70 mb-2">
                                No tienes agentes activos
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Activa protocolos desde el Catálogo para automatizar tu práctica
                            </p>
                            <CyberButton
                                variant="highlight"
                                onClick={() => setActiveTab('marketplace')}
                            >
                                Explorar Catálogo →
                            </CyberButton>
                        </CyberCard>
                    ) : (
                        myRules.map(rule => (
                            <CyberCard
                                key={rule.id}
                                className={`p-5 ${rule.is_active ? 'border-success/30' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.is_active
                                        ? 'bg-brand text-white'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <IconRenderer name={rule.icon} className="w-6 h-6" />
                                    </div>

                                    {/* Content - Clickable to navigate to stats */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer group"
                                        onClick={() => router.push(`/${locale}/automations/${rule.id}`)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <h3 className="type-ui font-semibold text-foreground text-lg group-hover:text-brand transition-colors">{rule.name}</h3>
                                            <BarChart3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="type-body text-muted-foreground text-sm mt-1">{rule.description}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Habilidad: {triggerLabels[rule.trigger_event] || rule.trigger_event}
                                        </p>
                                        {renderWorkflowSteps(rule)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Configure */}
                                        <Tooltip content={tt('configurePersonality')}>
                                            <button
                                                onClick={() => setEditingAgent(rule)}
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <Settings className="w-5 h-5" />
                                            </button>
                                        </Tooltip>

                                        {/* Toggle */}
                                        <Tooltip content={rule.is_active ? tt('deactivateAgent') : tt('activateAgent')}>
                                            <button
                                                onClick={() => handleToggle(rule.id, rule.is_active)}
                                                className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${rule.is_active ? 'bg-success' : 'bg-muted'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 w-6 h-6 bg-card rounded-full shadow-sm transition-transform ${rule.is_active ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </Tooltip>

                                        {/* Delete */}
                                        <Tooltip content={tt('deleteAgent')}>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </CyberCard>
                        ))
                    )}
                </div>
            ) : (
                /* Marketplace Tab */
                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map(template => {
                        const installed = isInstalled(template.id);
                        return (
                            <CyberCard
                                key={template.id}
                                className="p-5 hover:border-brand/30 transition-all"
                            >
                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center text-white mb-4">
                                    <IconRenderer name={template.icon} className="w-7 h-7" />
                                </div>

                                {/* Content */}
                                <h3 className="font-semibold text-foreground text-lg mb-2">{template.name}</h3>
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{template.description}</p>

                                {/* Trigger badge */}
                                <div className="text-xs text-muted-foreground mb-2">
                                    <span className="px-2 py-1 bg-muted rounded-full">
                                        {triggerLabels[template.trigger_event] || template.trigger_event}
                                    </span>
                                </div>

                                {/* Workflow steps */}
                                {renderWorkflowSteps(template)}

                                {/* Install button */}
                                <div className="mt-4">
                                    {installed ? (
                                        <div className="flex items-center gap-2 text-success font-medium">
                                            <Power className="w-4 h-4" />
                                            Activo
                                        </div>
                                    ) : (
                                        <CyberButton
                                            variant="surface"
                                            size="md"
                                            className="w-full"
                                            onClick={() => handleInstall(template.id)}
                                            disabled={installing === template.id}
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
                                        </CyberButton>
                                    )}
                                </div>
                            </CyberCard>
                        );
                    })}

                    {/* Request Custom Card */}
                    <CyberCard className="p-5 border-2 border-dashed hover:border-brand/30 transition-all">
                        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                            <Plus className="w-7 h-7" />
                        </div>
                        <h3 className="font-semibold text-foreground/70 text-lg mb-2">
                            ¿No encuentras lo que buscas?
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Cuéntanos qué automatización necesitas y la crearemos para ti.
                        </p>
                        <CyberButton
                            variant="ghost"
                            className="w-full"
                            onClick={() => window.open('mailto:support@kuraos.ai?subject=Solicitud de Agente', '_blank')}
                        >
                            Solicitar Agente
                        </CyberButton>
                    </CyberCard>
                </div>
            )}

            {/* Agent Configuration Modal */}
            {editingAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <CyberCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="bg-muted px-6 py-4 border-b border-border sticky top-0 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-brand" />
                                    Personalidad del Agente
                                </h3>
                                <button
                                    onClick={() => setEditingAgent(null)}
                                    className="p-1 hover:bg-card rounded"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{editingAgent.name}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Tone Selection */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
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
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-brand focus:border-transparent"
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
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Requiere Aprobación Humana
                                        </label>
                                        <p className="text-xs text-muted-foreground">
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
                                            ? 'bg-brand'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${editingAgent.agent_config?.mode === 'DRAFT_ONLY'
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Signature */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
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
                                    className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-brand focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-muted rounded-b-xl">
                            <CyberButton
                                variant="ghost"
                                onClick={() => setEditingAgent(null)}
                            >
                                Cancelar
                            </CyberButton>
                            <CyberButton
                                variant="default"
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
                            >
                                Guardar
                            </CyberButton>
                        </div>
                    </CyberCard>
                </div>
            )}
        </div>
    );
}
