'use client';

import { BrainCircuit, Mic, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { CyberButton } from './ui/CyberButton';
import { usePatientStore } from '@/stores/patient-store';

/**
 * AletheiaObservatory - Right Sidebar HUD Component
 * 
 * Displays real-time clinical intelligence for the active patient.
 * States:
 * - Standby: No patient selected
 * - Loading: Fetching insights
 * - Active: Showing patient data
 */

export default function AletheiaObservatory() {
    const {
        patientName,
        insights,
        isLoading,
        error,
        refreshInsights
    } = usePatientStore();

    // Computed values from insights
    const riskScore = insights?.riskScore ?? 0;
    const riskTrend = insights?.riskTrend ?? 'stable';
    const riskLevel = insights?.riskLevel ?? 'low';
    const isHighRisk = riskLevel === 'high';
    const isMediumRisk = riskLevel === 'medium';
    const riskPercentage = Math.abs(riskScore) * 100;

    return (
        <aside className="hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-6 font-mono">
            {/* HEADER */}
            <div className="border-b border-sidebar-border pb-4">
                <div className="flex items-center gap-2 text-ai mb-1">
                    <BrainCircuit size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">AletheIA Observatory</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    {patientName
                        ? `Active: ${patientName}`
                        : 'System Standby'
                    }
                </p>
            </div>

            {/* STANDBY STATE */}
            {!patientName && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <BrainCircuit className="text-muted-foreground" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">No patient selected</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Select a patient to view clinical insights
                        </p>
                    </div>
                </div>
            )}

            {/* LOADING STATE */}
            {isLoading && (
                <div className="flex-1 flex flex-col gap-4">
                    {/* Skeleton Risk Widget */}
                    <div className="bg-card rounded p-4 border border-border animate-pulse">
                        <div className="h-3 w-24 bg-muted rounded mb-3" />
                        <div className="h-10 w-20 bg-muted rounded mb-2" />
                        <div className="h-1 w-full bg-muted rounded mb-2" />
                        <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                    {/* Skeleton Inference */}
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

            {/* ACTIVE STATE - Patient Insights */}
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
                        <div className={`flex items-center gap-2 text-[10px] ${riskTrend === 'negative' ? 'text-risk' :
                                riskTrend === 'positive' ? 'text-success' : 'text-muted-foreground'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${riskTrend === 'negative' ? 'bg-risk' :
                                    riskTrend === 'positive' ? 'bg-success' : 'bg-muted-foreground'
                                }`} />
                            <span className="uppercase tracking-wider">
                                {riskLevel.toUpperCase()} • {insights.cached ? 'Cached' : 'Fresh'}
                            </span>
                        </div>
                    </div>

                    {/* SUMMARY WIDGET */}
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

                    {/* SUGGESTIONS */}
                    {insights.suggestions.length > 0 && (
                        <div className="bg-brand/5 border border-brand/20 p-3 rounded">
                            <h4 className="text-[10px] font-bold text-brand uppercase tracking-wider mb-2">
                                Suggestions
                            </h4>
                            <ul className="text-[10px] text-muted-foreground space-y-1">
                                {insights.suggestions.map((suggestion, i) => (
                                    <li key={i}>• {suggestion}</li>
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

            {/* FOOTER */}
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
