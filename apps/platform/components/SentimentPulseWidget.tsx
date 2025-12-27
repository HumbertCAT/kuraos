'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface DailyAnalysis {
    id: string;
    date: string;
    summary: string;
    sentiment_score: number;
    emotional_state: string | null;
    risk_flags: string[];
    suggestion: string | null;
    message_count: number;
}

interface SentimentPulseWidgetProps {
    patientId: string;
    tier?: 'CENTER' | 'PRO';  // Tier-based feature gating
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

export default function SentimentPulseWidget({ patientId, tier = 'CENTER' }: SentimentPulseWidgetProps) {
    const [analyses, setAnalyses] = useState<DailyAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, [patientId]);

    async function loadData() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/patients/${patientId}/monitoring/analyses?days=7`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setAnalyses(data.analyses || []);
            }
        } catch (err) {
            console.error('Error loading sentiment data:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="card p-6 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
        );
    }

    // STATE 3: LOCKED (PRO Tier - Upsell)
    if (tier === 'PRO') {
        return (
            <div className="card p-6 relative overflow-hidden h-full">
                {/* Blurred Fake Graph */}
                <div className="absolute inset-0 blur-md pointer-events-none opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="locked-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0,80 L28,75 L57,60 L85,45 L114,35 L142,50 L171,60 L200,70"
                            fill="url(#locked-gradient)"
                            stroke="rgb(100, 116, 139)"
                            strokeWidth="2"
                        />
                    </svg>
                </div>

                {/* Lock Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center bg-card/80 backdrop-blur-sm rounded-xl p-6">
                    <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="type-h3 text-foreground mb-2">Monitorización Premium</h3>
                    <p className="type-body text-muted-foreground mb-4 max-w-sm">
                        Analiza patrones emocionales en WhatsApp con IA. Detecta riesgos en tiempo real.
                    </p>
                    <p className="type-ui text-brand font-medium mb-4">
                        📈 Disponible en plan CENTER
                    </p>
                    <button className="btn btn-brand">
                        Actualizar Plan
                    </button>
                </div>
            </div>
        );
    }

    // STATE 2: DORMANT (No Data - Empty State)
    if (analyses.length === 0) {
        return (
            <div className="card p-6 relative overflow-hidden h-full">
                {/* Fake Ghost Graph */}
                <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                        <path
                            d="M0,80 L28,75 L57,60 L85,65 L114,40 L142,35 L171,30 L200,25"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted-foreground"
                        />
                    </svg>
                </div>

                {/* CTA Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                    <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="type-h3 text-foreground mb-2">Pulso Emocional Desactivado</h3>
                    <p className="type-body text-muted-foreground mb-4 max-w-sm">
                        Conecta WhatsApp para desbloquear el análisis de sentimiento en tiempo real
                    </p>
                    <button className="btn btn-brand">
                        Activar Monitorización
                    </button>
                </div>
            </div>
        );
    }

    // Prepare data (reverse to show oldest→newest left to right)
    const sortedData = [...analyses].reverse();
    const sentimentScores = sortedData.map(a => a.sentiment_score);
    const latestAnalysis = analyses[0]; // Most recent

    // Calculate trend
    const firstScore = sentimentScores[0];
    const lastScore = sentimentScores[sentimentScores.length - 1];
    const trendDirection = lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'stable';

    // Dynamic stroke color based on current sentiment
    const getStrokeColor = (score: number) => {
        if (score < -0.3) return 'rgb(239, 68, 68)'; // red
        if (score > 0.2) return 'rgb(16, 185, 129)'; // green
        return 'rgb(251, 191, 36)'; // amber
    };

    // Generate SVG path (monotone curve)
    const generatePath = () => {
        const width = 200;
        const height = 60;
        const padding = 10;

        // Safeguard: need at least 2 points
        if (sentimentScores.length < 2) {
            // Return minimal valid path
            return {
                linePath: `M ${padding},${height / 2} L ${width - padding},${height / 2}`,
                fillPath: `M ${padding},${height / 2} L ${width - padding},${height / 2} L ${width - padding},${height} L ${padding},${height} Z`,
                points: [{ x: padding, y: height / 2 }, { x: width - padding, y: height / 2 }],
            };
        }

        // Normalize scores to SVG coordinates
        const minScore = -1;
        const maxScore = 1;
        const points = sentimentScores.map((score, i) => {
            const x = (i / (sentimentScores.length - 1)) * (width - 2 * padding) + padding;
            const y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
            return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? height / 2 : y };
        });

        // Create smooth curve using quadratic bezier approximation
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const x_mid = (points[i].x + points[i + 1].x) / 2;
            const y_mid = (points[i].y + points[i + 1].y) / 2;
            path += ` Q ${points[i].x},${points[i].y} ${x_mid},${y_mid}`;
        }
        path += ` T ${points[points.length - 1].x},${points[points.length - 1].y}`;

        // Fill area below curve
        const fillPath = path + ` L ${width - padding},${height} L ${padding},${height} Z`;

        return { linePath: path, fillPath, points };
    };

    const { linePath, fillPath, points } = generatePath();
    const currentColor = getStrokeColor(lastScore);

    return (
        <div className="card p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand" />
                    <h3 className="type-h3 text-foreground">Pulso Emocional</h3>
                    {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                    {trendDirection === 'down' && <TrendingDown className="w-4 h-4 text-risk" />}
                </div>
                <span className="type-ui text-muted-foreground">7 días</span>
            </div>

            {/* SVG Wave */}
            <div className="relative flex-1 mb-4">
                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    {/* Gradient fill */}
                    <defs>
                        <linearGradient id="sentiment-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={currentColor} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={currentColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Fill area */}
                    <path
                        d={fillPath}
                        fill="url(#sentiment-gradient)"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={currentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    {/* Hover targets & points */}
                    {points.map((point, i) => {
                        const isToday = i === points.length - 1;
                        return (
                            <g key={i}>
                                {/* Invisible hover area */}
                                <rect
                                    x={point.x - 10}
                                    y={0}
                                    width={20}
                                    height={60}
                                    fill="transparent"
                                    onMouseEnter={() => setHoveredDay(i)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    className="cursor-pointer"
                                />

                                {/* Dot */}
                                {(hoveredDay === i || isToday) && (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={isToday ? "4" : "3"}
                                        fill="white"
                                        stroke={currentColor}
                                        strokeWidth="2"
                                        className={isToday ? "animate-pulse" : ""}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredDay !== null && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-popover border border-border rounded-lg p-3 shadow-lg z-10 w-64">
                        <p className="type-ui text-muted-foreground mb-1">
                            {new Date(sortedData[hoveredDay].date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}
                        </p>
                        <p className="type-body text-foreground text-sm">
                            {sortedData[hoveredDay].summary}
                        </p>
                    </div>
                )}
            </div>

            {/* Current State */}
            <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="type-body text-muted-foreground">Estado actual</span>
                    <span className="type-body font-medium text-foreground">
                        {latestAnalysis.emotional_state || 'Neutro'}
                    </span>
                </div>

                {/* Risk Flags */}
                {latestAnalysis.risk_flags.length > 0 && (
                    <div className="bg-risk/10 border border-risk/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-risk flex-shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex-1">
                                <p className="type-ui font-medium text-risk mb-1">
                                    {latestAnalysis.risk_flags.length === 1 ? 'Alerta' : 'Alertas'} Activas
                                </p>
                                <p className="type-body text-sm text-risk/80">
                                    {latestAnalysis.risk_flags.join(' • ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggestion */}
                {latestAnalysis.suggestion && (
                    <div className="bg-ai/10 border border-ai/20 rounded-lg p-3">
                        <p className="type-ui text-ai mb-1">💡 Sugerencia</p>
                        <p className="type-body text-sm text-foreground/80">
                            {latestAnalysis.suggestion}
                        </p>
                    </div>
                )}

                {/* Message count */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{latestAnalysis.message_count} mensajes hoy</span>
                </div>
            </div>
        </div>
    );
}
