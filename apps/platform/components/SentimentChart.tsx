'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface SentimentChartProps {
    analyses: DailyAnalysis[];
}

export default function SentimentChart({ analyses }: SentimentChartProps) {
    // Transform data for chart - oldest first
    const chartData = [...analyses]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(a => ({
            date: new Date(a.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            }),
            sentiment: a.sentiment_score,
            summary: a.summary,
            emotional_state: a.emotional_state,
            hasRisk: a.risk_flags.length > 0,
        }));

    // Calculate trend
    const latestSentiment = analyses[0]?.sentiment_score ?? 0;
    const previousSentiment = analyses[1]?.sentiment_score ?? 0;
    const trend = latestSentiment - previousSentiment;

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
                    <p className="font-medium text-foreground text-sm">{data.date}</p>
                    <p className="text-xs text-foreground/60 mt-1">{data.summary}</p>
                    {data.emotional_state && (
                        <p className="text-xs text-purple-600 mt-1">
                            Estado: {data.emotional_state}
                        </p>
                    )}
                    <p className={`text-xs mt-1 font-medium ${data.sentiment >= 0.3 ? 'text-emerald-600' :
                            data.sentiment <= -0.3 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                        Sentimiento: {(data.sentiment * 100).toFixed(0)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (analyses.length === 0) {
        return (
            <div className="bg-slate-50 rounded-xl p-8 text-center">
                <p className="text-slate-400">Sin datos de monitorización</p>
                <p className="text-xs text-slate-300 mt-1">Los análisis aparecerán cuando haya mensajes de WhatsApp</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Evolución Emocional</h3>
                    <p className="text-xs text-slate-400">Últimos 7 días</p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${trend > 0.1 ? 'bg-emerald-100 text-emerald-700' :
                        trend < -0.1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-foreground/70'
                    }`}>
                    {trend > 0.1 ? <TrendingUp className="w-4 h-4" /> :
                        trend < -0.1 ? <TrendingDown className="w-4 h-4" /> :
                            <Minus className="w-4 h-4" />}
                    <span>
                        {trend > 0.1 ? 'Mejorando' : trend < -0.1 ? 'Decayendo' : 'Estable'}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        {/* Background zones */}
                        <ReferenceArea y1={0.3} y2={1} fill="#ecfdf5" fillOpacity={0.5} />
                        <ReferenceArea y1={-0.3} y2={0.3} fill="#fefce8" fillOpacity={0.3} />
                        <ReferenceArea y1={-1} y2={-0.3} fill="#fef2f2" fillOpacity={0.5} />

                        {/* Zero line */}
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[-1, 1]}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            ticks={[-1, -0.5, 0, 0.5, 1]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="sentiment"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                if (payload.hasRisk) {
                                    return (
                                        <g>
                                            <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                                            <AlertTriangle x={cx - 5} y={cy - 5} width={10} height={10} className="text-white fill-white" />
                                        </g>
                                    );
                                }
                                return (
                                    <circle cx={cx} cy={cy} r={4} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />
                                );
                            }}
                            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-foreground/60">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div>
                    <span>Positivo (&gt;0.3)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                    <span>Neutro</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
                    <span>Negativo (&lt;-0.3)</span>
                </div>
            </div>
        </div>
    );
}
