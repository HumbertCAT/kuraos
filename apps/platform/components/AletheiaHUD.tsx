'use client';

import { useState, useEffect } from 'react';
import {
    Activity, AlertTriangle, TrendingDown, TrendingUp, Minus,
    MessageCircle, Phone, Mic, RefreshCw, Sparkles, Clock, AlertCircle
} from 'lucide-react';

// Priority levels for HUD display
type HUDPriority = 'CRISIS' | 'STAGNATION' | 'ALERT' | 'INSIGHT' | 'EMPTY';

interface HUDState {
    priority: HUDPriority;
    score: number | null;
    title: string;
    summary: string;
    badges: string[];
    source: 'whatsapp' | 'system' | 'clinical' | 'none';
    hasAudio: boolean;
    trend: 'up' | 'down' | 'stable';
    date: string | null;
    messageCount: number;
}

interface AletheiaHUDProps {
    patientId: string;
    patientName: string;
    journeyStatus?: Record<string, any>;  // Patient journey status for stagnation detection
    onViewChat?: () => void;
    onContact?: () => void;
}

import { API_URL } from '@/lib/api';

export default function AletheiaHUD({
    patientId,
    patientName,
    journeyStatus,
    onViewChat,
    onContact
}: AletheiaHUDProps) {
    const [hudState, setHudState] = useState<HUDState>({
        priority: 'EMPTY',
        score: null,
        title: 'Cargando...',
        summary: '',
        badges: [],
        source: 'none',
        hasAudio: false,
        trend: 'stable',
        date: null,
        messageCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIntelligence();
    }, [patientId, journeyStatus]);

    async function loadIntelligence() {
        setLoading(true);

        try {
            // Fetch WhatsApp analyses
            const [analysesRes, messagesRes] = await Promise.all([
                fetch(`${API_URL}/patients/${patientId}/monitoring/analyses?days=7`, {
                    credentials: 'include',
                }),
                fetch(`${API_URL}/patients/${patientId}/monitoring/messages?days=7`, {
                    credentials: 'include',
                }),
            ]);

            let whatsappAnalysis = null;
            let hasAudio = false;
            let trend: 'up' | 'down' | 'stable' = 'stable';

            if (analysesRes.ok && messagesRes.ok) {
                const analysesData = await analysesRes.json();
                const messagesData = await messagesRes.json();
                const analyses = analysesData.analyses || [];
                const messages = messagesData.messages || [];

                if (analyses.length > 0) {
                    whatsappAnalysis = analyses[0];
                    hasAudio = messages.some((m: any) =>
                        m.content?.includes('[🎤 AUDIO]')
                    );

                    // Calculate trend
                    if (analyses.length >= 2) {
                        const diff = analyses[0].sentiment_score - analyses[1].sentiment_score;
                        if (diff > 0.1) trend = 'up';
                        else if (diff < -0.1) trend = 'down';
                    }
                }
            }

            // PRIORITY 1: WhatsApp Crisis (score < -0.3)
            if (whatsappAnalysis && whatsappAnalysis.sentiment_score < -0.3) {
                setHudState({
                    priority: 'CRISIS',
                    score: whatsappAnalysis.sentiment_score,
                    title: 'Análisis Clínico en Tiempo Real',
                    summary: whatsappAnalysis.summary,
                    badges: whatsappAnalysis.risk_flags || [],
                    source: 'whatsapp',
                    hasAudio,
                    trend,
                    date: whatsappAnalysis.date,
                    messageCount: whatsappAnalysis.message_count,
                });
                setLoading(false);
                return;
            }

            // PRIORITY 2: System Alerts (Stagnation, Medical Blocks)
            const stagnationSteps = journeyStatus?.steps?.filter((s: any) =>
                s.status === 'stagnated' || s.status === 'blocked'
            ) || [];

            const hasStagnation = journeyStatus?.has_stagnation || stagnationSteps.length > 0;
            const hasMedicalBlock = journeyStatus?.medical_clearance === 'blocked';

            if (hasStagnation || hasMedicalBlock) {
                const alertBadges: string[] = [];
                if (hasStagnation) alertBadges.push('Proceso Estancado');
                if (hasMedicalBlock) alertBadges.push('Bloqueo Médico');

                setHudState({
                    priority: 'STAGNATION',
                    score: null,
                    title: 'Alerta de Proceso',
                    summary: hasStagnation
                        ? `${patientName} lleva tiempo sin avanzar en su proceso terapéutico. Se recomienda intervención o seguimiento proactivo.`
                        : `${patientName} tiene un bloqueo médico pendiente. Revisar documentación requerida.`,
                    badges: alertBadges,
                    source: 'system',
                    hasAudio: false,
                    trend: 'stable',
                    date: null,
                    messageCount: 0,
                });
                setLoading(false);
                return;
            }

            // PRIORITY 3: WhatsApp Insight (positive or neutral)
            if (whatsappAnalysis) {
                setHudState({
                    priority: 'INSIGHT',
                    score: whatsappAnalysis.sentiment_score,
                    title: 'Análisis Clínico en Tiempo Real',
                    summary: whatsappAnalysis.summary,
                    badges: whatsappAnalysis.risk_flags || [],
                    source: 'whatsapp',
                    hasAudio,
                    trend,
                    date: whatsappAnalysis.date,
                    messageCount: whatsappAnalysis.message_count,
                });
                setLoading(false);
                return;
            }

            // PRIORITY 4: General Insight (no data)
            setHudState({
                priority: 'EMPTY',
                score: null,
                title: 'Observatorio AletheIA',
                summary: `No hay análisis recientes de ${patientName}. Los insights se generarán automáticamente cuando haya actividad de mensajería o notas clínicas.`,
                badges: [],
                source: 'none',
                hasAudio: false,
                trend: 'stable',
                date: null,
                messageCount: 0,
            });

        } catch (err) {
            console.error('Failed to load intelligence:', err);
            setHudState({
                priority: 'EMPTY',
                score: null,
                title: 'Error de Conexión',
                summary: 'No se pudieron cargar los datos. Intenta refrescar la página.',
                badges: [],
                source: 'none',
                hasAudio: false,
                trend: 'stable',
                date: null,
                messageCount: 0,
            });
        } finally {
            setLoading(false);
        }
    }

    // Visual config based on priority - NEUTRAL BACKGROUNDS, ACCENT BORDERS
    const getVisualConfig = () => {
        switch (hudState.priority) {
            case 'CRISIS':
                return {
                    bg: 'bg-card border-2 border-red-500/50',
                    border: '',
                    scoreColor: 'text-red-400',
                    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
                    statusBadge: (
                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-sm font-bold uppercase tracking-wide animate-pulse">
                            ⚠ Crisis
                        </span>
                    ),
                    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
                };
            case 'STAGNATION':
                return {
                    bg: 'bg-card border-2 border-amber-500/50',
                    border: '',
                    scoreColor: 'text-amber-400',
                    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    statusBadge: (
                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-sm font-bold uppercase tracking-wide">
                            ⏸ Estancado
                        </span>
                    ),
                    icon: <Clock className="w-5 h-5 text-amber-400" />,
                };
            case 'INSIGHT':
                const isPositive = hudState.score && hudState.score > 0.3;
                return {
                    bg: isPositive ? 'bg-card border-2 border-emerald-500/50' : 'bg-card border-2 border-ai/50',
                    border: '',
                    scoreColor: isPositive ? 'text-emerald-400' : 'text-ai',
                    badgeBg: isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-ai/10 text-ai border-ai/30',
                    statusBadge: isPositive ? (
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-bold uppercase tracking-wide">
                            ✓ Estable
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-ai/10 border border-ai/30 text-ai rounded-full text-sm font-bold uppercase tracking-wide">
                            ~ Neutral
                        </span>
                    ),
                    icon: <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-ai'}`} />,
                };
            case 'EMPTY':
            default:
                return {
                    bg: 'bg-card border border-ai/30',
                    border: '',
                    scoreColor: 'text-ai',
                    badgeBg: 'bg-ai/10 text-ai border-ai/30',
                    statusBadge: null,
                    icon: <Sparkles className="w-5 h-5 text-ai" />,
                };
        }
    };

    const config = getVisualConfig();
    const textColor = 'text-foreground';
    const subTextColor = 'text-foreground/70';

    // Trend indicator
    const getTrendIndicator = () => {
        if (hudState.priority === 'EMPTY') return null;
        const iconClass = "w-4 h-4";
        if (hudState.trend === 'up') {
            return <div className="flex items-center gap-1 text-emerald-400 text-sm"><TrendingUp className={iconClass} /><span>Mejorando</span></div>;
        }
        if (hudState.trend === 'down') {
            return <div className="flex items-center gap-1 text-red-400 text-sm"><TrendingDown className={iconClass} /><span>Decayendo</span></div>;
        }
        return <div className="flex items-center gap-1 text-foreground/60 text-sm"><Minus className={iconClass} /><span>Estable</span></div>;
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 mb-6">
                <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-ai animate-spin" />
                    <span className="text-foreground/60">Cargando análisis...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`${config.bg} ${config.border} border rounded-2xl shadow-lg mb-6 overflow-hidden`}>
            <div className="p-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT: Score / Status */}
                    <div className="col-span-3 flex flex-col items-center justify-center border-r border-white/20 pr-6">
                        {hudState.score !== null ? (
                            <>
                                <div className={`text-5xl font-bold mb-2 ${config.scoreColor}`}>
                                    {hudState.score >= 0 ? '+' : ''}{hudState.score.toFixed(2)}
                                </div>
                                {config.statusBadge}
                                <div className="mt-2">{getTrendIndicator()}</div>
                            </>
                        ) : (
                            <>
                                <div className="mb-2">{config.icon}</div>
                                {config.statusBadge}
                            </>
                        )}
                    </div>

                    {/* CENTER: Summary */}
                    <div className="col-span-6">
                        <div className="flex items-center gap-2 mb-3">
                            {config.icon}
                            <h3 className={`text-lg font-semibold ${textColor}`}>{hudState.title}</h3>
                            {hudState.hasAudio && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-card/20 border border-white/30 rounded-full text-xs text-white">
                                    <Mic className="w-3 h-3" />
                                    Audio Transcrito
                                </span>
                            )}
                        </div>

                        <p className={`${subTextColor} leading-relaxed mb-4`}>
                            {hudState.summary}
                        </p>

                        {/* Badges */}
                        {hudState.badges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {hudState.badges.map((badge, i) => (
                                    <span key={i} className={`flex items-center gap-1 px-2 py-1 ${config.badgeBg} border rounded-lg text-xs`}>
                                        <AlertTriangle className="w-3 h-3" />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Meta */}
                        {hudState.date && (
                            <div className="mt-4 text-xs text-foreground/50">
                                Último análisis: {new Date(hudState.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'short'
                                })} • {hudState.messageCount} mensajes
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="col-span-3 flex flex-col justify-center gap-3 border-l border-border pl-6">
                        <button
                            onClick={onViewChat}
                            className="w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors border border-border text-foreground hover:bg-card"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Ver Chat Original
                        </button>
                        <button
                            onClick={onContact}
                            className="w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg transition-colors bg-brand text-white hover:opacity-90"
                        >
                            <Phone className="w-5 h-5" />
                            Contactar
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
