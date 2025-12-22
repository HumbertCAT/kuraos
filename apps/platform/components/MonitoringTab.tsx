'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import SentimentChart from './SentimentChart';
import DailyInsightsFeed from './DailyInsightsFeed';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

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

interface Message {
    id: string;
    direction: string;
    content: string;
    timestamp: string;
    status: string;
}

interface MonitoringTabProps {
    patientId: string;
}

export default function MonitoringTab({ patientId }: MonitoringTabProps) {
    const [analyses, setAnalyses] = useState<DailyAnalysis[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [patientId]);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            // Load analyses and messages in parallel
            const [analysesRes, messagesRes] = await Promise.all([
                fetch(`${API_URL}/patients/${patientId}/monitoring/analyses?days=7`, {
                    credentials: 'include',
                }),
                fetch(`${API_URL}/patients/${patientId}/monitoring/messages?days=7`, {
                    credentials: 'include',
                }),
            ]);

            if (analysesRes.ok) {
                const data = await analysesRes.json();
                setAnalyses(data.analyses || []);
            }

            if (messagesRes.ok) {
                const data = await messagesRes.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            console.error('Error loading monitoring data:', err);
            setError('Error al cargar datos de monitorización');
        } finally {
            setLoading(false);
        }
    }

    // Check for any active risks
    const hasActiveRisks = analyses.some(a => a.risk_flags.length > 0);
    const latestRisks = analyses[0]?.risk_flags || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                {error}
                <button
                    onClick={loadData}
                    className="ml-2 underline hover:no-underline cursor-pointer"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Risk Alert Banner */}
            {latestRisks.length > 0 && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-medium">⚠️ Alertas Activas Detectadas</p>
                            <p className="text-sm text-red-100">
                                {latestRisks.join(' • ')}
                            </p>
                        </div>
                        <button
                            onClick={loadData}
                            className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Actualizar datos"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header with refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Monitorización AletheIA</h2>
                    {hasActiveRisks && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {/* No data state */}
            {analyses.length === 0 && messages.length === 0 && (
                <div className="bg-slate-50 rounded-2xl p-12 text-center">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Sin datos de WhatsApp</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                        La monitorización de WhatsApp se activará cuando se envíen mensajes.
                        Los análisis de AletheIA se generan diariamente a las 8:00 AM.
                    </p>
                </div>
            )}

            {/* Main content */}
            {(analyses.length > 0 || messages.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sentiment Chart */}
                    <div className="lg:col-span-2">
                        <SentimentChart analyses={analyses} />
                    </div>

                    {/* Daily Insights Feed */}
                    <div className="lg:col-span-2">
                        <DailyInsightsFeed analyses={analyses} messages={messages} />
                    </div>
                </div>
            )}
        </div>
    );
}
