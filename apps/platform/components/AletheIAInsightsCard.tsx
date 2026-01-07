'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles, AlertTriangle, Lightbulb, TrendingUp,
    Brain, Heart, Target, Clock, ChevronDown, ChevronUp,
    Zap, Shield, MessageCircle, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

/**
 * AletheIA Insights Card - "El Observatorio"
 * 
 * The AI's perspective on the patient - summary, alerts, suggestions.
 * This is the "wow moment" for investors: AI-driven clinical insights.
 */

interface InsightData {
    summary: string;
    alerts: { type: 'warning' | 'critical' | 'info'; message: string }[];
    suggestions: string[];
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    lastAnalysis: string | null;
    keyThemes: string[];
}

interface AletheIAInsightsCardProps {
    patientId: string;
    patientName: string;
    journeyStatus?: Record<string, string>;
    hasEntries: boolean;
    bookingsCount: number;
}

// Generate insights based on patient data (frontend simulation for demo)
// In production, this would call the backend AletheIA service
function generateInsights(
    patientName: string,
    journeyStatus: Record<string, string> | undefined,
    hasEntries: boolean,
    bookingsCount: number
): InsightData {
    const firstName = patientName.split(' ')[0];
    const alerts: InsightData['alerts'] = [];
    const suggestions: string[] = [];
    const keyThemes: string[] = [];

    // Analyze journey status for alerts
    if (journeyStatus) {
        Object.entries(journeyStatus).forEach(([journey, status]) => {
            if (status === 'BLOCKED_MEDICAL' || status === 'BLOCKED_HIGH_RISK') {
                alerts.push({
                    type: 'critical',
                    message: `⛔ Bloqueado en ${journey.replace(/_/g, ' ')} - Requiere revisión manual antes de continuar.`
                });
            } else if (status === 'STAGNATION_ALERT') {
                alerts.push({
                    type: 'warning',
                    message: `⚠️ Sin actividad reciente - Considera contactar para seguimiento.`
                });
            } else if (status === 'AWAITING_PAYMENT') {
                alerts.push({
                    type: 'info',
                    message: `💳 Pago pendiente - Recordatorio enviado automáticamente.`
                });
            }
        });
    }

    // Generate suggestions based on state
    if (!hasEntries) {
        suggestions.push('Añade una nota inicial sobre tus primeras impresiones.');
    }
    if (bookingsCount === 0) {
        suggestions.push('No hay reservas activas. ¿Quizás programar una sesión de seguimiento?');
    }
    if (journeyStatus && Object.values(journeyStatus).includes('PREPARATION_PHASE')) {
        suggestions.push('Enviar material de preparación pre-ceremonia.');
        keyThemes.push('Preparación');
    }
    if (journeyStatus && Object.values(journeyStatus).includes('ONBOARDING')) {
        suggestions.push('Revisar objetivos iniciales y ajustar plan de trabajo.');
        keyThemes.push('Onboarding');
    }
    if (journeyStatus && Object.values(journeyStatus).includes('GRADUATED')) {
        suggestions.push('Considerar sesión de seguimiento a 3 meses para consolidar cambios.');
        keyThemes.push('Post-programa');
    }

    // Calculate engagement score
    let engagementScore = 50;
    if (hasEntries) engagementScore += 20;
    if (bookingsCount > 0) engagementScore += 15;
    if (alerts.some(a => a.type === 'critical')) engagementScore -= 20;
    if (alerts.some(a => a.type === 'warning')) engagementScore -= 10;
    if (journeyStatus && Object.values(journeyStatus).includes('ACTIVE_STUDENT')) engagementScore += 15;
    if (journeyStatus && Object.values(journeyStatus).includes('COMPLETED')) engagementScore += 10;
    engagementScore = Math.min(100, Math.max(0, engagementScore));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (alerts.some(a => a.type === 'critical')) riskLevel = 'high';
    else if (alerts.some(a => a.type === 'warning')) riskLevel = 'medium';

    // Generate summary
    let summary = '';
    if (alerts.some(a => a.type === 'critical')) {
        summary = `${firstName} tiene una alerta crítica que requiere tu atención inmediata. Revisa los detalles antes de continuar con cualquier proceso.`;
    } else if (journeyStatus && Object.keys(journeyStatus).length > 0) {
        const currentStage = Object.entries(journeyStatus)[0];
        const stageName = currentStage[1].replace(/_/g, ' ').toLowerCase();
        summary = `${firstName} está actualmente en fase de ${stageName}. ${hasEntries ? 'El historial muestra progreso continuo.' : 'Aún no hay notas clínicas registradas.'
            }`;
    } else {
        summary = `${firstName} es nuevo/a. ${bookingsCount > 0 ? `Tiene ${bookingsCount} reserva(s) programada(s).` : 'No hay reservas activas todavía.'
            }`;
    }

    return {
        summary,
        alerts,
        suggestions: suggestions.slice(0, 3), // Max 3 suggestions
        engagementScore,
        riskLevel,
        lastAnalysis: hasEntries ? 'Hace 2 días' : null,
        keyThemes: keyThemes.length > 0 ? keyThemes : ['Nuevo'],
    };
}

export default function AletheIAInsightsCard({
    patientId,
    patientName,
    journeyStatus,
    hasEntries,
    bookingsCount,
}: AletheIAInsightsCardProps) {
    const [expanded, setExpanded] = useState(true);
    const [insights, setInsights] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Call backend API for AI-powered insights
        async function fetchInsights() {
            try {
                setLoading(true);
                const data = await api.insights.getPatientInsights(patientId);
                setInsights(data);
            } catch (error) {
                console.error('Failed to fetch AletheIA insights:', error);
                // Fallback to local generation if API fails
                const fallbackData = generateInsights(patientName, journeyStatus, hasEntries, bookingsCount);
                setInsights(fallbackData);
            } finally {
                setLoading(false);
            }
        }

        fetchInsights();
    }, [patientId, patientName, journeyStatus, hasEntries, bookingsCount]);

    // Handle refresh button click
    async function handleRefresh() {
        try {
            setRefreshing(true);
            const data = await api.insights.getPatientInsights(patientId, true);
            setInsights(data);
        } catch (error) {
            console.error('Failed to refresh insights:', error);
        } finally {
            setRefreshing(false);
        }
    }

    if (loading) {
        return (
            <div className="mb-6 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 rounded-xl border border-fuchsia-200 p-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Brain className="w-6 h-6 text-fuchsia-500 animate-pulse" />
                        <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-fuchsia-800 font-headline">AletheIA está analizando...</h3>
                        <p className="text-sm text-fuchsia-600">Procesando información...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!insights) return null;

    const scoreColor = insights.engagementScore >= 70
        ? 'text-emerald-500'
        : insights.engagementScore >= 40
            ? 'text-amber-500'
            : 'text-red-500';

    const riskBadge = {
        low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Bajo' },
        medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medio' },
        high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alto' },
        critical: { bg: 'bg-red-600 animate-pulse shadow-lg shadow-red-200', text: 'text-white font-bold', label: 'CRÍTICO' },
    }[insights.riskLevel];

    return (
        <div className="mb-6 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 rounded-xl border border-fuchsia-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-fuchsia-100/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-200">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
                    </div>
                    <div>
                        <h3 className="font-bold text-fuchsia-900 flex items-center gap-2 font-headline">
                            AletheIA Insights
                            <span className="text-xs font-normal px-2 py-0.5 bg-fuchsia-200 text-fuchsia-700 rounded-full font-caption">
                                ✨ AI
                            </span>
                        </h3>
                        <p className="text-sm text-fuchsia-600">El punto de vista de tu asistente clínico</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Quick Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
                            <span className={`font-bold font-headline ${scoreColor}`}>{insights.engagementScore}%</span>
                            <span className="text-foreground/60 font-caption">ENGAGEMENT</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-caption ${riskBadge.bg} ${riskBadge.text}`}>
                            <Shield className="w-3 h-3 inline mr-1" />
                            RIESGO {riskBadge.label.toUpperCase()}
                        </div>
                    </div>

                    {/* Refresh button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRefresh();
                        }}
                        disabled={refreshing}
                        className="p-2 rounded-lg hover:bg-fuchsia-100 transition-colors disabled:opacity-50"
                        title="Actualizar insights"
                    >
                        <RefreshCw className={`w-4 h-4 text-fuchsia-500 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-5 pb-5 space-y-4">
                    {/* Summary */}
                    <div className="bg-card/60 rounded-lg p-4 border border-purple-100">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-700 leading-relaxed">{insights.summary}</p>
                        </div>
                    </div>

                    {/* Alerts */}
                    {insights.alerts.length > 0 && (
                        <div className="space-y-2">
                            {insights.alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${alert.type === 'critical'
                                        ? 'bg-red-50 border-red-200'
                                        : alert.type === 'warning'
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-blue-50 border-blue-200'
                                        }`}
                                >
                                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${alert.type === 'critical' ? 'text-red-500' :
                                        alert.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                                        }`} />
                                    <span className={`text-sm ${alert.type === 'critical' ? 'text-red-700' :
                                        alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                                        }`}>
                                        {alert.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions & Themes */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Suggestions */}
                        {insights.suggestions.length > 0 && (
                            <div className="bg-card/60 rounded-lg p-4 border border-purple-100">
                                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                    Sugerencias
                                </h4>
                                <ul className="space-y-2">
                                    {insights.suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/70">
                                            <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Key Themes & Stats */}
                        <div className="bg-card/60 rounded-lg p-4 border border-purple-100">
                            <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" />
                                Estado Actual
                            </h4>
                            <div className="space-y-3">
                                {/* Themes */}
                                <div className="flex flex-wrap gap-2">
                                    {insights.keyThemes.map((theme, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                        >
                                            {theme}
                                        </span>
                                    ))}
                                </div>

                                {/* Mobile stats */}
                                <div className="md:hidden flex items-center gap-4 text-sm pt-2 border-t border-purple-100">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
                                        <span className={`font-bold ${scoreColor}`}>{insights.engagementScore}%</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${riskBadge.bg} ${riskBadge.text}`}>
                                        Riesgo {riskBadge.label}
                                    </div>
                                </div>

                                {/* Last analysis */}
                                {insights.lastAnalysis && (
                                    <div className="flex items-center gap-2 text-xs text-foreground/60 pt-2 border-t border-purple-100">
                                        <Clock className="w-3 h-3" />
                                        Último análisis: {insights.lastAnalysis}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
