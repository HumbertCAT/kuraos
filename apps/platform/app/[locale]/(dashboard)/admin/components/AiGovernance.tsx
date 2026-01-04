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
    subscription_revenue: number;
    commission_revenue: number;
    total_revenue_usd: number;
    gross_profit: number;
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

interface TaskRoutingConfig {
    routing: Record<string, string>;
    available_tasks: string[];
    region: string;
}

// Task type labels for UI display
const TASK_LABELS: Record<string, { label: string; description: string; isFixed?: boolean }> = {
    transcription: { label: 'Transcription', description: 'Audio to text (STT)', isFixed: true },
    clinical_analysis: { label: 'Clinical Analysis', description: 'Therapy session notes' },
    audio_synthesis: { label: 'Audio Synthesis', description: 'Voice note analysis' },
    chat: { label: 'Chat Sentiment', description: 'WhatsApp monitoring' },
    triage: { label: 'Triage', description: 'Risk screening (critical)' },
    form_analysis: { label: 'Form Analysis', description: 'Intake form review' },
    help_bot: { label: 'Help Bot', description: 'Platform support' },
    document_analysis: { label: 'Document Analysis', description: 'PDFs and images' },
    briefing: { label: 'Daily Briefing', description: 'Morning summary' },
};

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
    subscription_revenue: 0,
    commission_revenue: 0,
    total_revenue_usd: 0,
    gross_profit: 0,
    margin_percentage: 0,
    total_calls: 0,
    total_tokens: 0,
    usage_by_provider: {},
    usage_by_model: {},
};

const DEFAULT_MODELS: ModelInfo[] = [
    // Gemini models (selectable as primary)
    { id: 'gemini-2.5-flash', provider: 'vertex-google', name: 'Gemini 2.5 Flash', supports_audio: true, cost_input: 0.075, cost_output: 0.30, is_enabled: true },
    { id: 'gemini-2.5-pro', provider: 'vertex-google', name: 'Gemini 2.5 Pro', supports_audio: true, cost_input: 1.25, cost_output: 5.00, is_enabled: true },
    { id: 'gemini-2.5-flash-lite', provider: 'vertex-google', name: 'Gemini 2.5 Flash Lite', supports_audio: false, cost_input: 0.02, cost_output: 0.10, is_enabled: true },
    { id: 'gemini-2.0-flash', provider: 'vertex-google', name: 'Gemini 2.0 Flash', supports_audio: true, cost_input: 0.10, cost_output: 0.40, is_enabled: true },
    // Companion models (always active for specific tasks)
    { id: 'whisper-1', provider: 'openai', name: 'Whisper (Transcription)', supports_audio: true, cost_input: 0.006, cost_output: 0, is_enabled: true },
];

// Companion models that are always active for specific tasks (not selectable as primary)
const COMPANION_MODELS = ['whisper-1', 'whisper'];

export default function AiGovernance() {
    const [stats, setStats] = useState<LedgerStats>(EMPTY_STATS);
    const [config, setConfig] = useState<AiConfig>({ cost_margin: 1.5, active_models: [], vertex_ai_enabled: true });
    const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [primaryModel, setPrimaryModel] = useState<string>('gemini-2.5-flash');
    const [taskRouting, setTaskRouting] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isChangingModel, setIsChangingModel] = useState(false);
    const [isSavingRouting, setIsSavingRouting] = useState(false);
    const [pendingRoutingChanges, setPendingRoutingChanges] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        setError(null);
        try {
            const [statsData, configData, modelsData, logsData, routingData] = await Promise.all([
                fetchWithAuth('/admin/ai/ledger'),
                fetchWithAuth('/admin/ai/config'),
                fetchWithAuth('/admin/ai/models').catch(() => DEFAULT_MODELS),
                fetchWithAuth('/admin/ai/logs?limit=10'),
                fetchWithAuth('/admin/ai/routing').catch(() => ({ routing: {}, available_tasks: [], region: 'europe-west1' })),
            ]);

            setStats(statsData);
            setConfig(configData);
            setModels(modelsData);
            setLogs(logsData.logs || []);
            setTaskRouting(routingData.routing || {});
            setPendingRoutingChanges({});
        } catch (err: any) {
            console.error('Failed to load AI governance data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }

    async function changePrimaryModel(modelId: string) {
        if (COMPANION_MODELS.includes(modelId)) return;

        setIsChangingModel(true);
        try {
            await fetchWithAuth(`/admin/settings/AI_MODEL`, {
                method: 'PATCH',
                body: JSON.stringify({ value: modelId }),
            });
            setPrimaryModel(modelId);
        } catch (err) {
            console.error('Failed to change primary model:', err);
        } finally {
            setIsChangingModel(false);
        }
    }

    // Handle local routing change (before save)
    function handleRoutingChange(taskType: string, modelId: string) {
        setPendingRoutingChanges(prev => ({ ...prev, [taskType]: modelId }));
    }

    // Save all pending routing changes
    async function saveRouting() {
        if (Object.keys(pendingRoutingChanges).length === 0) return;

        setIsSavingRouting(true);
        try {
            await fetchWithAuth('/admin/ai/routing', {
                method: 'PATCH',
                body: JSON.stringify({ routing: pendingRoutingChanges }),
            });
            // Merge changes into current routing
            setTaskRouting(prev => ({ ...prev, ...pendingRoutingChanges }));
            setPendingRoutingChanges({});
        } catch (err) {
            console.error('Failed to save routing:', err);
        } finally {
            setIsSavingRouting(false);
        }
    }

    // Get effective model for a task (pending change or current)
    function getEffectiveModel(taskType: string): string {
        return pendingRoutingChanges[taskType] ?? taskRouting[taskType] ?? 'gemini-2.5-flash';
    }

    // Check if task has pending changes
    function hasPendingChange(taskType: string): boolean {
        return taskType in pendingRoutingChanges;
    }

    // Helper to determine model status
    function getModelStatus(modelId: string): { label: string; style: string } {
        if (modelId === primaryModel) {
            return { label: '⚡ Primary', style: 'bg-brand/20 text-brand border border-brand/30' };
        }
        if (COMPANION_MODELS.includes(modelId)) {
            return { label: '🔗 Companion', style: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' };
        }
        return { label: 'Available', style: 'bg-muted text-muted-foreground' };
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
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

                {/* Est. Revenue */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Est. Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.total_revenue_usd)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Subs: {formatCurrency(stats.subscription_revenue)} • Fees: {formatCurrency(stats.commission_revenue)}
                    </p>
                </div>

                {/* Gross Profit */}
                <div className={`p-4 rounded-xl border ${stats.gross_profit >= 0
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    <div className={`flex items-center gap-2 mb-2 ${stats.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Gross Profit</span>
                    </div>
                    <p className={`text-2xl font-bold ${stats.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {formatCurrency(stats.gross_profit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.margin_percentage > 0 ? '+' : ''}{stats.margin_percentage}% margin
                    </p>
                </div>
            </div>

            {/* B. Task Routing */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-brand" />
                        <h3 className="font-medium text-sm">Task Routing</h3>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">europe-west1</span>
                    </div>
                    {Object.keys(pendingRoutingChanges).length > 0 && (
                        <button
                            onClick={saveRouting}
                            disabled={isSavingRouting}
                            className="px-3 py-1.5 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingRouting ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <Check className="w-3 h-3" />
                            )}
                            Save Changes ({Object.keys(pendingRoutingChanges).length})
                        </button>
                    )}
                </div>
                <div className="divide-y divide-border">
                    {Object.keys(TASK_LABELS).map((taskType) => {
                        const taskInfo = TASK_LABELS[taskType];
                        const currentModel = getEffectiveModel(taskType);
                        const hasChange = hasPendingChange(taskType);
                        const isFixed = taskInfo.isFixed;

                        return (
                            <div
                                key={taskType}
                                className={`px-4 py-3 flex items-center justify-between transition-colors ${hasChange ? 'bg-brand/5' : ''}`}
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-foreground">{taskInfo.label}</p>
                                    <p className="text-xs text-muted-foreground">{taskInfo.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isFixed ? (
                                        <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm font-medium">
                                            🔗 {models.find(m => m.id === currentModel)?.name || currentModel}
                                        </span>
                                    ) : (
                                        <select
                                            value={currentModel}
                                            onChange={(e) => handleRoutingChange(taskType, e.target.value)}
                                            className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground min-w-[200px]"
                                        >
                                            {models
                                                .filter(m => !COMPANION_MODELS.includes(m.id))
                                                .map((model) => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name} (${model.cost_input}/${model.cost_output})
                                                    </option>
                                                ))}
                                        </select>
                                    )}
                                    {hasChange && (
                                        <span className="text-xs text-brand">• Modified</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* C. Neural Registry */}
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
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground font-mono">In €/M</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground font-mono">Out €/M</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {models.map((model) => {
                                const status = getModelStatus(model.id);
                                const isSelectable = !COMPANION_MODELS.includes(model.id);
                                const isPrimary = model.id === primaryModel;

                                return (
                                    <tr key={model.id} className={`transition-colors ${isPrimary ? 'bg-brand/5' : 'hover:bg-muted/30'}`}>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-xs">
                                                {model.provider === 'vertex-google' ? '🔷' : model.provider === 'openai' ? '🟢' : '🎤'}
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
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.style}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isSelectable && !isPrimary && (
                                                <button
                                                    onClick={() => changePrimaryModel(model.id)}
                                                    disabled={isChangingModel}
                                                    className="px-2 py-1 text-xs bg-muted hover:bg-brand hover:text-white rounded transition-colors disabled:opacity-50"
                                                >
                                                    Select
                                                </button>
                                            )}
                                            {isPrimary && (
                                                <span className="text-xs text-brand">✓ Active</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
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
