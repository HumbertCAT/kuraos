'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, AlertTriangle, RefreshCw, Bot, Radio, ChevronRight, Activity, X, Edit, Send, Clock, Sparkles } from 'lucide-react';
import { CyberButton } from './ui/CyberButton';
import { usePatientStore, GlobalAlert } from '@/stores/patient-store';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import BriefingPlayer from './BriefingPlayer';

/**
 * AletheiaObservatory - Right Sidebar HUD Component
 * 
 * Two modes:
 * - Patient Mode: Shows individual patient insights (when activePatientId exists)
 * - Global Mode: Shows clinic-wide alerts, briefing, and pending actions (default on dashboard)
 */

interface PendingAction {
    id: string;
    rule_id: string;
    rule_name: string;
    action_type: string;
    recipient_id: string;
    recipient_type: string;
    recipient_name: string;
    recipient_email: string | null;
    draft_content: {
        subject?: string;
        body?: string;
    };
    ai_generated_content: {
        subject?: string;
        body?: string;
    } | null;
    status: string;
    created_at: string;
}

const STORAGE_KEY = 'aletheia-sidebar-collapsed';

export default function AletheiaObservatory() {
    const {
        // Patient Mode
        patientName,
        activePatientId,
        insights,
        isLoading,
        error,
        refreshInsights,
        // Global Mode
        globalInsights,
        isLoadingGlobal,
        fetchGlobalInsights,
    } = usePatientStore();

    // Collapse state with localStorage
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Pending Actions state (for Global Mode)
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [loadingActions, setLoadingActions] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);

    // Hydrate collapse state from localStorage
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') setIsCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem(STORAGE_KEY, String(newState));
    };

    // Fetch global insights and pending actions on mount when no patient is selected
    useEffect(() => {
        if (!activePatientId) {
            fetchGlobalInsights();
            loadPendingActions();
        }
    }, [activePatientId, fetchGlobalInsights]);

    async function loadPendingActions() {
        try {
            const data = await api.pendingActions.list();
            setPendingActions(data.actions || []);
        } catch (err) {
            console.error('Failed to load pending actions:', err);
        } finally {
            setLoadingActions(false);
        }
    }

    async function handleApprove(actionId: string) {
        setProcessing(actionId);
        try {
            await api.pendingActions.approve(actionId);
            setPendingActions(pendingActions.filter(a => a.id !== actionId));
            setSelectedAction(null);
        } catch (err) {
            console.error('Failed to approve action:', err);
        } finally {
            setProcessing(null);
        }
    }

    async function handleReject(actionId: string) {
        setProcessing(actionId);
        try {
            await api.pendingActions.reject(actionId);
            setPendingActions(pendingActions.filter(a => a.id !== actionId));
            setSelectedAction(null);
        } catch (err) {
            console.error('Failed to reject action:', err);
        } finally {
            setProcessing(null);
        }
    }

    // Computed values from insights
    const riskScore = insights?.riskScore ?? 0;
    const riskLevel = insights?.riskLevel ?? 'low';
    const isHighRisk = riskLevel === 'high';
    const isMediumRisk = riskLevel === 'medium';
    const riskPercentage = Math.abs(riskScore) * 100;

    // Count alerts for pulsating indicator
    const alertCount = (globalInsights?.activeAlerts?.length ?? 0) + pendingActions.length;

    // Don't render until mounted (hydration)
    if (!mounted) return null;

    // ============ COLLAPSED STATE (Vertical Tab) ============
    if (isCollapsed) {
        return (
            <aside
                onClick={toggleCollapse}
                className="hidden xl:flex w-12 flex-col items-center justify-center border-l border-sidebar-border bg-sidebar cursor-pointer hover:bg-accent transition-all duration-300 ease-in-out"
            >
                {/* Pulsating indicator when alerts exist */}
                {alertCount > 0 && (
                    <div className="absolute top-4 right-3 w-2 h-2 rounded-full bg-risk animate-pulse" />
                )}

                {/* Vertical Text */}
                <div
                    className="flex items-center gap-2 text-ai"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    <Sparkles size={14} className={alertCount > 0 ? 'animate-pulse' : ''} />
                    <span className="type-body font-bold tracking-widest uppercase">
                        AletheIA
                    </span>
                </div>
            </aside>
        );
    }

    // ============ GLOBAL MODE (Clinic Radar) ============
    if (!activePatientId) {
        return (
            <>
                <aside className="hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-4 font-mono overflow-y-auto transition-all duration-300 ease-in-out relative">
                    {/* Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="absolute top-4 left-2 p-1 rounded hover:bg-accent transition-colors z-10"
                        title="Collapse"
                    >
                        <ChevronRight size={14} className="text-muted-foreground" />
                    </button>

                    {/* HEADER - Global Mode */}
                    <div className="border-b border-sidebar-border pb-3 pl-6">
                        <div className="flex items-center gap-2 text-ai mb-1">
                            <Sparkles size={14} className="animate-pulse" />
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">AletheIA</span>
                            <span className="text-xs font-light tracking-wider text-muted-foreground italic">Global</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Monitoreo activo de clínica</p>
                    </div>

                    {/* Briefing Player removed - stays only in Dashboard Hero (v1.0.5.4.1) */}

                    {/* LOADING GLOBAL */}
                    {isLoadingGlobal && (
                        <div className="bg-card rounded p-4 border border-border animate-pulse">
                            <div className="h-3 w-24 bg-muted rounded mb-3" />
                            <div className="h-8 w-full bg-muted rounded" />
                        </div>
                    )}

                    {/* GLOBAL INSIGHTS */}
                    {!isLoadingGlobal && (
                        <>
                            {/* RISK MONITOR */}
                            <div className="bg-card rounded p-3 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-risk">
                                        <AlertTriangle size={12} />
                                        <span className="type-body font-bold uppercase tracking-wider">
                                            Risk Monitor
                                        </span>
                                    </div>
                                    <button
                                        onClick={fetchGlobalInsights}
                                        className="p-1 hover:bg-muted rounded transition-colors"
                                        title="Refresh"
                                    >
                                        <RefreshCw size={10} className="text-muted-foreground" />
                                    </button>
                                </div>

                                {globalInsights?.activeAlerts?.length === 0 && (
                                    <div className="text-center py-3">
                                        <Activity className="mx-auto text-success mb-1" size={16} />
                                        <p className="type-body text-muted-foreground">
                                            No active risk alerts
                                        </p>
                                    </div>
                                )}

                                {globalInsights?.activeAlerts?.map((alert: GlobalAlert) => (
                                    <Link
                                        key={alert.id}
                                        href={`/patients/${alert.patientId}`}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors group"
                                    >
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.riskLevel === 'HIGH' ? 'bg-risk' : 'bg-warning'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="type-body text-foreground truncate">
                                                {alert.patientName}
                                            </p>
                                            <p className="type-ui text-muted-foreground truncate">
                                                {alert.reason}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={10}
                                            className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
                                        />
                                    </Link>
                                ))}
                            </div>

                            {/* AGENT CENTER - Full PendingActions */}
                            <div className="bg-card rounded p-3 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-brand">
                                        <Bot size={12} />
                                        <span className="type-body font-bold uppercase tracking-wider">
                                            Tareas Pendientes
                                        </span>
                                    </div>
                                    {pendingActions.length > 0 && (
                                        <span className="type-body px-2 py-0.5 bg-ai/10 text-ai rounded-full">
                                            {pendingActions.length}
                                        </span>
                                    )}
                                </div>

                                {loadingActions && (
                                    <div className="h-8 bg-muted rounded animate-pulse" />
                                )}

                                {!loadingActions && pendingActions.length === 0 && (
                                    <div className="text-center py-3">
                                        <Bot className="mx-auto text-muted-foreground mb-1" size={16} />
                                        <p className="type-body text-muted-foreground">
                                            Sin borradores pendientes
                                        </p>
                                    </div>
                                )}

                                {!loadingActions && pendingActions.map(action => (
                                    <div
                                        key={action.id}
                                        className="p-2 rounded hover:bg-muted transition-colors border-b border-border last:border-0"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="type-body text-foreground truncate">
                                                    🤖 {action.rule_name}
                                                </p>
                                                <p className="type-body text-muted-foreground truncate">
                                                    → {action.recipient_name}
                                                </p>
                                                {action.draft_content.subject && (
                                                    <p className="type-ui text-muted-foreground/70 truncate mt-0.5">
                                                        {action.draft_content.subject}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => setSelectedAction(action)}
                                                    className="p-1 text-muted-foreground hover:text-ai hover:bg-ai/10 rounded transition-colors"
                                                    title="Ver/Editar"
                                                >
                                                    <Edit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(action.id)}
                                                    disabled={processing === action.id}
                                                    className="p-1 text-success hover:bg-success/10 rounded transition-colors disabled:opacity-50"
                                                    title="Enviar"
                                                >
                                                    <Send size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(action.id)}
                                                    disabled={processing === action.id}
                                                    className="p-1 text-risk hover:bg-risk/10 rounded transition-colors disabled:opacity-50"
                                                    title="Descartar"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* SYSTEM STATUS */}
                            <div className="bg-muted/50 rounded p-2 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="type-ui text-muted-foreground uppercase tracking-wider">
                                        System Health
                                    </span>
                                </div>
                                <p className="type-ui text-muted-foreground">
                                    Risk Monitor: <span className="text-success">Active</span>
                                </p>
                            </div>
                        </>
                    )}
                </aside>

                {/* Detail Modal for Pending Actions */}
                {selectedAction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
                            <div className="bg-ai/5 border-b border-ai/20 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground">
                                        Borrador de {selectedAction.rule_name}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedAction(null)}
                                        className="p-1 hover:bg-card/50 rounded"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase">
                                        Destinatario
                                    </label>
                                    <p className="text-foreground font-medium">
                                        {selectedAction.recipient_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedAction.recipient_email || 'Sin email'}
                                    </p>
                                </div>

                                {selectedAction.draft_content.subject && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase">
                                            Asunto
                                        </label>
                                        <p className="text-foreground">
                                            {selectedAction.draft_content.subject}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase">
                                        Mensaje (Borrador)
                                    </label>
                                    <div className="mt-1 p-3 bg-muted rounded-lg text-sm text-foreground">
                                        {selectedAction.draft_content.body || 'Sin contenido'}
                                    </div>
                                </div>

                                {selectedAction.ai_generated_content && (
                                    <div>
                                        <label className="text-xs font-medium text-ai uppercase flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Versión IA
                                        </label>
                                        <div className="mt-1 p-3 bg-ai/10 border border-ai/20 rounded-lg text-sm text-foreground">
                                            {selectedAction.ai_generated_content.body || 'Sin contenido'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="border-t px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => handleReject(selectedAction.id)}
                                    disabled={processing === selectedAction.id}
                                    className="px-4 py-2 text-risk hover:bg-risk/10 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Descartar
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedAction.id)}
                                    disabled={processing === selectedAction.id}
                                    className="px-4 py-2 bg-ai text-white rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ============ PATIENT MODE ============
    return (
        <aside className="hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-6 font-mono overflow-y-auto transition-all duration-300 ease-in-out relative">
            {/* Collapse Toggle */}
            <button
                onClick={toggleCollapse}
                className="absolute top-4 left-2 p-1 rounded hover:bg-accent transition-colors z-10"
                title="Collapse"
            >
                <ChevronRight size={14} className="text-muted-foreground" />
            </button>

            {/* HEADER - Patient Mode */}
            <div className="border-b border-sidebar-border pb-4 pl-6">
                <div className="flex items-center gap-2 text-ai mb-1">
                    <BrainCircuit size={14} />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase">AletheIA</span>
                    <span className="text-xs font-light tracking-wider text-muted-foreground italic">Paciente</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    Activo: {patientName}
                </p>
            </div>

            {/* LOADING STATE */}
            {isLoading && (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-card rounded p-4 border border-border animate-pulse">
                        <div className="h-3 w-24 bg-muted rounded mb-3" />
                        <div className="h-10 w-20 bg-muted rounded mb-2" />
                        <div className="h-1 w-full bg-muted rounded mb-2" />
                        <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                    <div className="bg-ai/5 border border-ai/20 p-3 rounded animate-pulse">
                        <div className="h-3 w-20 bg-muted rounded mb-3" />
                        <div className="h-4 w-full bg-muted rounded mb-2" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                </div>
            )}

            {/* ERROR STATE */}
            {error && !isLoading && (
                <div className="bg-risk/10 border border-risk/20 p-4 rounded text-center">
                    <AlertTriangle className="mx-auto text-risk mb-2" size={20} />
                    <p className="text-xs text-risk">{error}</p>
                    <button
                        onClick={refreshInsights}
                        className="mt-2 type-body text-muted-foreground hover:text-foreground"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* PATIENT INSIGHTS */}
            {insights && !isLoading && (
                <>
                    {/* RISK WIDGET */}
                    <div className="bg-card rounded p-4 border border-border relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="type-body text-muted-foreground uppercase tracking-wider">
                                Risk Assessment
                            </span>
                            <button
                                onClick={refreshInsights}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Refresh insights"
                            >
                                <RefreshCw size={10} className="text-muted-foreground" />
                            </button>
                        </div>
                        <div className={`text-4xl font-medium mb-2 tracking-tighter ${isHighRisk ? 'text-risk' : isMediumRisk ? 'text-warning' : 'text-success'
                            }`}>
                            {riskScore >= 0 ? '+' : ''}{riskScore.toFixed(2)}
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full transition-all duration-500 ${isHighRisk ? 'bg-risk' : isMediumRisk ? 'bg-warning' : 'bg-success'
                                    }`}
                                style={{ width: `${riskPercentage}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-2 type-body text-muted-foreground">
                            <span className="uppercase tracking-wider">
                                {riskLevel.toUpperCase()} • {insights.cached ? 'Cached' : 'Fresh'}
                            </span>
                        </div>
                    </div>

                    {/* SUMMARY */}
                    <div>
                        <h3 className="type-body font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            AletheIA Summary
                        </h3>
                        <div className="bg-ai/5 border border-ai/20 p-3 rounded">
                            <p className="text-xs text-foreground leading-relaxed">
                                {insights.summary}
                            </p>
                        </div>
                    </div>

                    {/* KEY THEMES */}
                    {insights.keyThemes?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {insights.keyThemes.map((theme, i) => (
                                <span
                                    key={i}
                                    className="type-ui px-2 py-0.5 rounded-full bg-ai/10 text-ai border border-ai/20"
                                >
                                    {theme}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ALERTS */}
                    {insights.alerts?.length > 0 && (
                        <div className={`p-3 rounded border ${insights.alerts.some(a => a.type === 'critical')
                            ? 'bg-risk/10 border-risk/20'
                            : 'bg-warning/10 border-warning/20'
                            }`}>
                            <div className={`flex items-center gap-2 mb-2 ${insights.alerts.some(a => a.type === 'critical') ? 'text-risk' : 'text-warning'
                                }`}>
                                <AlertTriangle size={12} />
                                <span className="type-body font-bold uppercase tracking-wider">
                                    Active Flags ({insights.alerts.length})
                                </span>
                            </div>
                            <ul className="type-body space-y-1">
                                {insights.alerts.map((alert, i) => (
                                    <li key={i} className={
                                        alert.type === 'critical' ? 'text-risk/80' :
                                            alert.type === 'warning' ? 'text-warning/80' : 'text-muted-foreground'
                                    }>
                                        {alert.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ENGAGEMENT SCORE */}
                    <div className="bg-card border border-border p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <span className="type-body text-muted-foreground uppercase tracking-wider">
                                Engagement
                            </span>
                            <span className={`text-sm font-medium ${insights.engagementScore >= 70 ? 'text-success' :
                                insights.engagementScore >= 40 ? 'text-warning' : 'text-risk'
                                }`}>
                                {insights.engagementScore}%
                            </span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${insights.engagementScore >= 70 ? 'bg-success' :
                                    insights.engagementScore >= 40 ? 'bg-warning' : 'bg-risk'
                                    }`}
                                style={{ width: `${insights.engagementScore}%` }}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* FOOTER - Refresh Button */}
            {patientName && (
                <div className="mt-auto pt-4 border-t border-sidebar-border">
                    <CyberButton
                        className="w-full"
                        size="md"
                        onClick={refreshInsights}
                        disabled={isLoading}
                    >
                        <BrainCircuit size={12} />
                        {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
                    </CyberButton>
                </div>
            )}
        </aside>
    );
}
