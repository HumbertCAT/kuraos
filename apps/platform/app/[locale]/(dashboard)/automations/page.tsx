'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Bot, Zap, Power, Trash2, Download, Settings, BarChart3, Activity, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import IconRenderer from '@/components/IconRenderer';
import PageHeader from '@/components/PageHeader';
import { Tooltip } from '@/components/ui/tooltip';
import { CyberButton } from '@/components/ui/CyberButton';

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
    execution_count?: number;
}

const STATUS_BADGES: Record<string, string> = {
    active: 'badge badge-success',
    paused: 'badge badge-muted',
};

export default function AutomationsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || 'es';
    const t = useTranslations('Automations');
    const tt = useTranslations('Tooltips');
    const [activeTab, setActiveTab] = useState<'my' | 'catalog'>('my');
    const [myRules, setMyRules] = useState<AutomationRule[]>([]);
    const [templates, setTemplates] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState<string | null>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [rulesRes, marketRes] = await Promise.all([
                fetch(`${API_URL}/automations/rules`, { credentials: 'include' }),
                fetch(`${API_URL}/automations/marketplace`, { credentials: 'include' }),
            ]);

            if (rulesRes.ok) {
                const data = await rulesRes.json();
                setMyRules(data.rules || []);
            }

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
                setSuccess(!currentState ? 'Agente activado' : 'Agente pausado');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Error al cambiar el estado');
        }
    }

    async function handleDelete(ruleId: string) {
        if (!confirm('¿Eliminar este agente? Esta acción no se puede deshacer.')) return;

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
        'FORM_SUBMISSION_COMPLETED': 'Formulario Enviado',
        'JOURNEY_STAGE_TIMEOUT': 'Timeout de Etapa',
        'BOOKING_CONFIRMED': 'Reserva Confirmada',
        'PAYMENT_SUCCEEDED': 'Pago Completo',
        'PAYMENT_FAILED': 'Pago Fallido',
        'LEAD_CREATED': 'Nuevo Lead',
        'LEAD_STAGED_TIMEOUT': 'Lead Inactivo',
        'LEAD_CONVERTED': 'Lead Convertido',
    };

    const actionLabels: Record<string, string> = {
        'send_email': 'Enviar Email',
        'send_whatsapp': 'Enviar WhatsApp',
        'update_journey_status': 'Actualizar Estado',
        'create_task': 'Crear Tarea',
        'block_patient': 'Bloquear Paciente',
    };

    function getMainAction(rule: AutomationRule): string {
        if (rule.actions && rule.actions.length > 0) {
            return actionLabels[rule.actions[0].type] || rule.actions[0].type;
        }
        return 'Ejecutar';
    }

    const activeCount = myRules.filter(r => r.is_active).length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
                <div className="card overflow-hidden mt-6">
                    <div className="p-8 text-center">
                        <Activity className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
                        <p className="text-muted-foreground mt-2">Cargando agentes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header with Metrics */}
            <PageHeader
                icon={Bot}
                kicker="ATRAER · SERVIR · CRECER"
                title={t('title')}
                subtitle={
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-muted-foreground">{t('subtitle')}</span>
                        <div className="flex items-center gap-1.5 ml-1">
                            <span className="badge badge-muted py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider">
                                Total: {myRules.length}
                            </span>
                            <span className="badge badge-success py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider">
                                Activos: {activeCount}
                            </span>
                        </div>
                    </div>
                }
            />

            {/* Alerts */}
            {success && (
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 animate-fade-in">
                    <span className="text-2xl">✅</span>
                    <span className="text-success font-medium">{success}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <span className="text-destructive font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto text-destructive/70 hover:text-destructive">✕</button>
                </div>
            )}

            {/* Control Deck & Table */}
            <div className="card overflow-hidden mt-6 shadow-sm">
                {/* Control Deck Toolbar */}
                <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                    {/* Segmented Control Tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-4 py-1.5 rounded-md font-medium transition-all ${activeTab === 'my'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Mis Agentes ({myRules.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`px-4 py-1.5 rounded-md font-medium transition-all ${activeTab === 'catalog'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Catálogo ({templates.length})
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <p className="font-mono text-muted-foreground uppercase tracking-wider">
                            {activeTab === 'my' ? 'Gestión de Protocolos Activos' : 'Biblioteca de Agentes'}
                        </p>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'my' ? (
                    myRules.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-foreground">No tienes agentes activos</h3>
                            <p className="text-muted-foreground mb-6">Activa protocolos desde el Catálogo para automatizar tu práctica</p>
                            <CyberButton
                                variant="highlight"
                                onClick={() => setActiveTab('catalog')}
                            >
                                Explorar Catálogo →
                            </CyberButton>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">AGENTE</th>
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase hidden md:table-cell">LÓGICA</th>
                                    <th className="px-4 py-3 text-center type-ui text-muted-foreground tracking-wider uppercase hidden lg:table-cell">EJECUCIONES</th>
                                    <th className="px-4 py-3 text-center type-ui text-muted-foreground tracking-wider uppercase">ESTADO</th>
                                    <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider uppercase">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                {myRules.map((rule) => (
                                    <tr key={rule.id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.is_active ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'}`}>
                                                    <IconRenderer name={rule.icon} className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-ui font-medium text-foreground truncate">{rule.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {rule.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                                                    {triggerLabels[rule.trigger_event] || rule.trigger_event}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/20">
                                                    {getMainAction(rule)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                                            <span className="font-mono text-sm text-muted-foreground">
                                                {rule.execution_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={rule.is_active ? STATUS_BADGES.active : STATUS_BADGES.paused}>
                                                {rule.is_active ? 'Activo' : 'Pausado'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Tooltip content={tt('agentSettings')}>
                                                    <Link
                                                        href={`/automations/${rule.id}`}
                                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </Link>
                                                </Tooltip>
                                                <Tooltip content={tt('viewLogs')}>
                                                    <Link
                                                        href={`/automations/${rule.id}`}
                                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                    </Link>
                                                </Tooltip>
                                                <Tooltip content={rule.is_active ? tt('pauseAgent') : tt('activateAgent')}>
                                                    <button
                                                        onClick={() => handleToggle(rule.id, rule.is_active)}
                                                        className={`p-2 rounded-lg transition-all ${rule.is_active
                                                            ? 'text-success hover:text-success/80 hover:bg-success/10'
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip content={tt('deleteAgent')}>
                                                    <button
                                                        onClick={() => handleDelete(rule.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    templates.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground">No hay agentes disponibles en el catálogo</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">AGENTE</th>
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase hidden md:table-cell">DISPARADOR</th>
                                    <th className="px-4 py-3 text-center type-ui text-muted-foreground tracking-wider uppercase">ESTADO</th>
                                    <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider uppercase">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-0">
                                {templates.map((template) => {
                                    const installed = isInstalled(template.id);
                                    return (
                                        <tr key={template.id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                                        <IconRenderer name={template.icon} className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="type-ui font-medium text-foreground">{template.name}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="badge badge-muted font-mono text-xs">
                                                    {triggerLabels[template.trigger_event] || template.trigger_event}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {installed ? (
                                                    <span className="badge badge-success">Instalado</span>
                                                ) : (
                                                    <span className="badge badge-muted">Disponible</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                    {installed ? (
                                                        <span className="text-xs text-muted-foreground">Ya activo</span>
                                                    ) : (
                                                        <CyberButton
                                                            variant="surface"
                                                            size="sm"
                                                            onClick={() => handleInstall(template.id)}
                                                            disabled={installing === template.id}
                                                        >
                                                            {installing === template.id ? (
                                                                <>Activando...</>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-3 h-3" />
                                                                    Activar
                                                                </>
                                                            )}
                                                        </CyberButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </div>
    );
}
