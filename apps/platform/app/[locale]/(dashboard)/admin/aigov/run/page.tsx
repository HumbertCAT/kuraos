'use client';

import { useState } from 'react';
import { Play, Zap, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface ExecutionResult {
    success: boolean;
    analyzed?: number;
    error?: string;
    duration?: number;
}

export default function AiGovRunPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [lastRun, setLastRun] = useState<Date | null>(null);

    async function handleForceAnalysis() {
        setIsRunning(true);
        setResult(null);
        const startTime = Date.now();

        try {
            const res = await fetch(`${API_URL}/admin/trigger-conversation-analysis`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await res.json();
            const duration = Date.now() - startTime;

            if (res.ok) {
                setResult({
                    success: true,
                    analyzed: data.result?.analyzed || 0,
                    duration,
                });
            } else {
                setResult({
                    success: false,
                    error: data.detail || 'Error al ejecutar análisis',
                    duration,
                });
            }
            setLastRun(new Date());
        } catch (err: any) {
            setResult({
                success: false,
                error: err.message || 'Error de conexión',
            });
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Play className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Manual Execution</h2>
                        <p className="text-muted-foreground">Trigger AletheIA processes on-demand</p>
                    </div>
                </div>

                {/* Force Analysis Card */}
                <div className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl border border-warning/20">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-lg">Forzar Análisis AletheIA</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ejecuta el análisis de conversaciones WhatsApp inmediatamente para todas las fichas con mensajes nuevos.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Normalmente esto se ejecuta automáticamente cada 15 minutos.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleForceAnalysis}
                            disabled={isRunning}
                            className="px-6 py-3 bg-warning text-black font-semibold rounded-xl hover:bg-warning/90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-warning/20"
                        >
                            {isRunning ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Ejecutando...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Ejecutar Ahora
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Feedback */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${result.success
                                ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                                : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
                            }`}>
                            {result.success ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                        ✅ Análisis completado: {result.analyzed} fichas analizadas
                                        {result.duration && ` (${(result.duration / 1000).toFixed(1)}s)`}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 dark:text-red-300 font-medium">
                                        ❌ {result.error}
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Last Run Timestamp */}
                    {lastRun && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Última ejecución: {lastRun.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Future: More manual triggers can be added here */}
            <div className="card p-6 opacity-50">
                <h3 className="font-medium text-foreground mb-2">Próximamente</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Regenerar Daily Briefings</li>
                    <li>• Ejecutar Sentinel Risk Scan</li>
                    <li>• Forzar sincronización de modelos</li>
                </ul>
            </div>
        </div>
    );
}
