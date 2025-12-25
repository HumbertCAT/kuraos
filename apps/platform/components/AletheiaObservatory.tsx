'use client';

import { useEffect } from 'react';
import { BrainCircuit, AlertTriangle, RefreshCw, Bot, Radio, ChevronRight, Activity } from 'lucide-react';
import { CyberButton } from './ui/CyberButton';
import { usePatientStore, GlobalAlert } from '@/stores/patient-store';
import { Link } from '@/i18n/navigation';

/**
 * AletheiaObservatory - Right Sidebar HUD Component
 * 
 * Two modes:
 * - Patient Mode: Shows individual patient insights (when activePatientId exists)
 * - Global Mode: Shows clinic-wide alerts and pending actions (default on dashboard)
 */

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

    // Fetch global insights on mount when no patient is selected
    useEffect(() => {
        if (!activePatientId) {
            fetchGlobalInsights();
        }
    }, [activePatientId, fetchGlobalInsights]);

    // Computed values from insights
    const riskScore = insights?.riskScore ?? 0;
    const riskLevel = insights?.riskLevel ?? 'low';
    const isHighRisk = riskLevel === 'high';
    const isMediumRisk = riskLevel === 'medium';
    const riskPercentage = Math.abs(riskScore) * 100;

    // ============ GLOBAL MODE (Clinic Radar) ============
    if (!activePatientId) {
        return (
            <aside className="hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-4 font-mono">
                {/* HEADER - Global Mode */}
                <div className="border-b border-sidebar-border pb-4">
                    <div className="flex items-center gap-2 text-ai mb-1">
                        <Radio size={14} className="animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Clinic Radar</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Global monitoring active</p>
                </div>

                {/* LOADING GLOBAL */}
                {isLoadingGlobal && (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-card rounded p-4 border border-border animate-pulse">
                            <div className="h-3 w-24 bg-muted rounded mb-3" />
                            <div className="h-8 w-full bg-muted rounded" />
                        </div>
                    </div>
                )}

                {/* GLOBAL INSIGHTS */}
                {!isLoadingGlobal && (
                    <>
                        {/* RISK MONITOR */}
                        <div className="bg-card rounded p-4 border border-border">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-risk">
                                    <AlertTriangle size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
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

                            {globalInsights?.activeAlerts.length === 0 && (
                                <div className="text-center py-4">
                                    <Activity className="mx-auto text-success mb-2" size={20} />
                                    <p className="text-[10px] text-muted-foreground">
                                        No active risk alerts
                                    </p>
                                </div>
                            )}

                            {globalInsights?.activeAlerts.map((alert: GlobalAlert) => (
                                <Link
                                    key={alert.id}
                                    href={`/patients/${alert.patientId}`}
                                    className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors group"
                                >
                                    <div className={`w-2 h-2 rounded-full ${alert.riskLevel === 'HIGH' ? 'bg-risk' : 'bg-warning'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-foreground truncate">
                                            {alert.patientName}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground truncate">
                                            {alert.reason}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        size={12}
                                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                                    />
                                </Link>
                            ))}
                        </div>

                        {/* AGENT CENTER (Pending Actions) */}
                        <div className="bg-card rounded p-4 border border-border">
                            <div className="flex items-center gap-2 text-brand mb-3">
                                <Bot size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Agent Center
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-medium text-foreground">
                                        {globalInsights?.pendingActionsCount ?? 0}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Pending approvals
                                    </p>
                                </div>
                                {(globalInsights?.pendingActionsCount ?? 0) > 0 && (
                                    <Link href="/settings/automations">
                                        <CyberButton size="sm">
                                            Review
                                        </CyberButton>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* SYSTEM STATUS */}
                        <div className="bg-muted/50 rounded p-3 border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    System Health
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Daily Briefing: <span className="text-foreground">Ready</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Risk Monitor: <span className="text-success">Active</span>
                            </p>
                        </div>
                    </>
                )}
            </aside>
        );
    }

    // ============ PATIENT MODE ============
    return (
        <aside className="hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-6 font-mono">
            {/* HEADER - Patient Mode */}
            <div className="border-b border-sidebar-border pb-4">
                <div className="flex items-center gap-2 text-ai mb-1">
                    <BrainCircuit size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">AletheIA Observatory</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Active: {patientName}
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
                        className="mt-2 text-[10px] text-muted-foreground hover:text-foreground"
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
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="uppercase tracking-wider">
                                {riskLevel.toUpperCase()} • {insights.cached ? 'Cached' : 'Fresh'}
                            </span>
                        </div>
                    </div>

                    {/* SUMMARY */}
                    <div>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            AletheIA Summary
                        </h3>
                        <div className="bg-ai/5 border border-ai/20 p-3 rounded">
                            <p className="text-xs text-foreground leading-relaxed">
                                {insights.summary}
                            </p>
                        </div>
                    </div>

                    {/* KEY THEMES */}
                    {insights.keyThemes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {insights.keyThemes.map((theme, i) => (
                                <span
                                    key={i}
                                    className="text-[9px] px-2 py-0.5 rounded-full bg-ai/10 text-ai border border-ai/20"
                                >
                                    {theme}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ALERTS */}
                    {insights.alerts.length > 0 && (
                        <div className={`p-3 rounded border ${insights.alerts.some(a => a.type === 'critical')
                                ? 'bg-risk/10 border-risk/20'
                                : 'bg-warning/10 border-warning/20'
                            }`}>
                            <div className={`flex items-center gap-2 mb-2 ${insights.alerts.some(a => a.type === 'critical') ? 'text-risk' : 'text-warning'
                                }`}>
                                <AlertTriangle size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Active Flags ({insights.alerts.length})
                                </span>
                            </div>
                            <ul className="text-[10px] space-y-1">
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
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
