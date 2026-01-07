'use client';

/**
 * AI Governance - Logs Page
 * 
 * AI usage activity logs.
 * v1.4.6: Extracted from AiGovernance.tsx
 */

import { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import {
    fetchWithAuth,
    LoadingSpinner,
    TASK_LABELS,
    type UsageLog,
} from '../shared';

export default function LogsPage() {
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth('/admin/ai/logs?limit=50');
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to load logs:', err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity Logs
                </h3>
                <button
                    onClick={loadData}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Time</th>
                            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Task</th>
                            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Model</th>
                            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Tokens</th>
                            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(log.created_at).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">
                                        {TASK_LABELS[log.task_type]?.label || log.task_type}
                                    </p>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{log.model_id}</td>
                                <td className="px-4 py-3 text-right font-mono text-xs">
                                    <span className="text-muted-foreground">{log.tokens_input}</span>
                                    <span className="text-muted-foreground/50 mx-1">/</span>
                                    <span className="text-foreground">{log.tokens_output}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <p className="font-mono text-brand text-xs">€{log.cost_provider_usd.toFixed(4)}</p>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No activity logs yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
