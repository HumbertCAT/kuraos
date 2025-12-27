'use client';

/**
 * AI Governance Panel
 * 
 * Admin interface for managing the Multi-Model Intelligence Engine.
 * Features: Financial HUD, Model Registry, Activity Ledger.
 */

import { useState, useEffect } from 'react';
import {
    Brain,
    DollarSign,
    TrendingUp,
    Activity,
    Zap,
    Settings,
    RefreshCw,
    Check,
    X
} from 'lucide-react';

// Types
interface LedgerStats {
    period_days: number;
    total_cost_usd: number;
    total_revenue_credits: number;
    net_margin: number;
    margin_percentage: number;
    total_calls: number;
    total_tokens: number;
    usage_by_provider: Record<string, { calls: number; cost: number }>;
    usage_by_model: Record<string, { calls: number; tokens: number }>;
}

interface AiConfig {
    cost_margin: number;
    active_models: string[];
    vertex_ai_enabled: boolean;
}

interface ModelInfo {
    id: string;
    provider: string;
    name: string;
    supports_audio: boolean;
    cost_input: number;
    cost_output: number;
    is_enabled: boolean;
}

interface UsageLog {
    id: string;
    created_at: string;
    user_email: string | null;
    provider: string;
    model_id: string;
    task_type: string;
    tokens_input: number;
    tokens_output: number;
    cost_provider_usd: number;
    cost_user_credits: number;
}

// API helpers - use same pattern as other components
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// Empty defaults for real data
const EMPTY_STATS: LedgerStats = {
    period_days: 30,
    total_cost_usd: 0,
    total_revenue_credits: 0,
    net_margin: 0,
    margin_percentage: 0,
    total_calls: 0,
    total_tokens: 0,
    usage_by_provider: {},
    usage_by_model: {},
};

const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'gemini-2.5-flash', provider: 'vertex-google', name: 'Gemini 2.5 Flash', supports_audio: true, cost_input: 0.075, cost_output: 0.30, is_enabled: true },
    { id: 'gemini-2.5-pro', provider: 'vertex-google', name: 'Gemini 2.5 Pro', supports_audio: true, cost_input: 1.25, cost_output: 5.00, is_enabled: true },
];

export default function AiGovernance() {
    const [stats, setStats] = useState<LedgerStats>(EMPTY_STATS);
    const [config, setConfig] = useState<AiConfig>({ cost_margin: 1.5, active_models: [], vertex_ai_enabled: true });
    const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [marginInput, setMarginInput] = useState('1.5');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        setError(null);
        try {
            const [statsData, configData, modelsData, logsData] = await Promise.all([
                fetchWithAuth('/admin/ai/ledger'),
                fetchWithAuth('/admin/ai/config'),
                fetchWithAuth('/admin/ai/models').catch(() => DEFAULT_MODELS),
                fetchWithAuth('/admin/ai/logs?limit=10'),
            ]);

            setStats(statsData);
            setConfig(configData);
            setMarginInput(String(configData.cost_margin || 1.5));
            setModels(modelsData);
            setLogs(logsData.logs || []);
        } catch (err: any) {
            console.error('Failed to load AI governance data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }

    async function updateMargin() {
        const newMargin = parseFloat(marginInput);
        if (isNaN(newMargin) || newMargin < 1 || newMargin > 5) {
            alert('Margin must be between 1.0 and 5.0');
            return;
        }

        setIsSaving(true);
        try {
            await fetchWithAuth('/admin/ai/config', {
                method: 'PATCH',
                body: JSON.stringify({ cost_margin: newMargin }),
            });
            setConfig(prev => ({ ...prev, cost_margin: newMargin }));
        } catch (err) {
            console.error('Failed to update margin:', err);
        } finally {
            setIsSaving(false);
        }
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }

    function formatTokens(val: number) {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return String(val);
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleString('es-ES', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/10 rounded-lg">
                        <Brain className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">AI Governance</h2>
                        <p className="text-sm text-muted-foreground">Engine financials & model control</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* A. Financial HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Real Cost */}
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Provider Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.total_cost_usd)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.period_days}d • {stats.total_calls.toLocaleString()} calls</p>
                </div>

                {/* Revenue */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.total_revenue_credits)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTokens(stats.total_tokens)} tokens</p>
                </div>

                {/* Net Margin */}
                <div className="p-4 bg-brand/10 border border-brand/20 rounded-xl">
                    <div className="flex items-center gap-2 text-brand mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Net Margin</span>
                    </div>
                    <p className="text-2xl font-bold text-brand">{formatCurrency(stats.net_margin)}</p>
                    <p className="text-xs text-muted-foreground mt-1">+{stats.margin_percentage}%</p>
                </div>

                {/* Margin Controller */}
                <div className="p-4 bg-muted/50 border border-border rounded-xl">
                    <div className="flex items-center gap-2 text-foreground mb-2">
                        <Settings className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Margin Config</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={marginInput}
                            onChange={(e) => setMarginInput(e.target.value)}
                            step="0.1"
                            min="1"
                            max="5"
                            className="w-16 px-2 py-1 text-lg font-mono bg-background border border-border rounded text-center"
                        />
                        <span className="text-sm text-muted-foreground">×</span>
                        <button
                            onClick={updateMargin}
                            disabled={isSaving}
                            className="px-3 py-1 bg-brand text-white text-sm rounded hover:bg-brand/90 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? '...' : 'Set'}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Multiplier over provider costs</p>
                </div>
            </div>

            {/* B. Neural Registry */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand" />
                    <h3 className="font-medium text-sm">Neural Registry</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{models.length} models available</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Provider</th>
                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Model</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Audio</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground font-mono">In $/M</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground font-mono">Out $/M</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {models.map((model) => (
                                <tr key={model.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-xs">
                                            {model.provider === 'vertex-google' ? '🔷' : '🎤'}
                                            {model.provider.replace('vertex-', '')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{model.name}</td>
                                    <td className="px-4 py-3 text-center">
                                        {model.supports_audio ? (
                                            <Check className="w-4 h-4 text-green-400 inline" />
                                        ) : (
                                            <X className="w-4 h-4 text-muted-foreground inline" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                        ${model.cost_input.toFixed(3)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                        ${model.cost_output.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${model.is_enabled
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {model.is_enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* C. Activity Ledger */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Activity Ledger</h3>
                    <span className="text-xs text-muted-foreground ml-auto">Last 10 entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Timestamp</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Model</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Task</th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground font-mono">Tokens</th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground font-mono">Cost ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(log.created_at)}</td>
                                    <td className="px-3 py-2">{log.user_email || <span className="text-muted-foreground">system</span>}</td>
                                    <td className="px-3 py-2">{log.model_id}</td>
                                    <td className="px-3 py-2">
                                        <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{log.task_type}</span>
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatTokens(log.tokens_input + log.tokens_output)}</td>
                                    <td className="px-3 py-2 text-right text-brand">{log.cost_user_credits.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
