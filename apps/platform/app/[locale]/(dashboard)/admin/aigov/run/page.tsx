'use client';

/**
 * AI Governance - Run Page
 * 
 * Manual AI execution triggers.
 * v1.4.6: Extracted from AiGovernance.tsx
 */

import { useState } from 'react';
import { Play, Zap, RefreshCw, Check, X } from 'lucide-react';
import { API_URL } from '../shared';

export default function RunPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; analyzed?: number; error?: string } | null>(null);

    async function handleForceAnalysis() {
        setIsRunning(true);
        setResult(null);

        try {
            const res = await fetch(`${API_URL}/admin/trigger-conversation-analysis`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, analyzed: data.result?.analyzed || 0 });
            } else {
                setResult({ success: false, error: data.detail || 'Error al ejecutar' });
            }
        } catch (err: any) {
            setResult({ success: false, error: err.message || 'Error de conexión' });
        } finally {
            setIsRunning(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Force Analysis Card */}
            <div className="p-5 bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl border border-warning/20">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-lg">Force AletheIA Pulse</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Trigger WhatsApp conversation analysis for all patient records with new messages.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleForceAnalysis}
                        disabled={isRunning}
                        className="px-5 py-2.5 bg-warning text-black font-semibold rounded-xl hover:bg-warning/90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-warning/20"
                    >
                        {isRunning ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Execute
                            </>
                        )}
                    </button>
                </div>

                {/* Result display */}
                {result && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${result.success
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}>
                        {result.success ? (
                            <Check className="w-5 h-5 text-green-500" />
                        ) : (
                            <X className="w-5 h-5 text-red-500" />
                        )}
                        <span className={result.success ? 'text-green-500' : 'text-red-500'}>
                            {result.success
                                ? `Success! Analyzed ${result.analyzed} conversations.`
                                : `Error: ${result.error}`}
                        </span>
                    </div>
                )}
            </div>

            {/* Future triggers placeholder */}
            <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                <p className="font-medium mb-2">Coming Soon:</p>
                <ul className="space-y-1 text-xs">
                    <li>• Regenerate Daily Briefings</li>
                    <li>• Execute Sentinel Risk Scan</li>
                </ul>
            </div>
        </div>
    );
}
