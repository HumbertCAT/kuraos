'use client';

/**
 * AI Governance Panel
 * 
 * Admin interface for managing the Multi-Model Intelligence Engine.
 * Features: Financial HUD, Model Registry, Activity Ledger, Task Routing.
 * 
 * Organized into 4 tabs: Financials | Activity | Models | Routing
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

// Task type labels with AletheIA branding (v1.3.0) - Enriched with Level Hierarchy
type TaskLevel = 1 | 2 | 3;
interface TaskMetadata {
    label: string;
    description: string;
    extendedDescription: string;
    level: TaskLevel;
    levelName: string;
    suggestedModel: string;
    isFixed?: boolean;
}

const LEVEL_INFO: Record<TaskLevel, { name: string; description: string; color: string }> = {
    1: {
        name: 'CLINICAL JUDGMENT',
        description: 'High Intelligence — Where AI "understands", "protects", and "connects the dots."',
        color: 'text-red-500'
    },
    2: {
        name: 'TRANSFORMATION & MEDIA',
        description: 'Generative Intelligence — Where AI "translates" or "creates" formats.',
        color: 'text-amber-500'
    },
    3: {
        name: 'OPERATIONS',
        description: 'Routine — Pure, hard information processing.',
        color: 'text-green-500'
    },
};

const TASK_LABELS: Record<string, TaskMetadata> = {
    triage: {
        label: 'AletheIA Sentinel',
        description: 'Risk screening (critical)',
        extendedDescription: 'Active Security Monitor. Analyzes every interaction in real-time to detect critical risk markers (suicide, self-harm, violence), immediately alerting the therapist before a crisis occurs.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 3 Pro',
        // Note: Sentinel is configurable but recommended to use Pro models for safety
    },
    clinical_analysis: {
        label: 'AletheIA Oracle',
        description: 'Session notes & deep analysis',
        extendedDescription: 'Clinical Deduction Engine. Processes full session transcripts to extract latent themes, behavioral patterns, and therapeutic progress, generating structured clinical notes and revealing the "deep truth" of the case.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    briefing: {
        label: 'AletheIA Now',
        description: 'Daily briefing & next actions',
        extendedDescription: 'Strategic Context Synthesizer. Cross-references the patient\'s full history with recent events to generate the "Daily Briefing," offering predictive headlines and immediate "Next Best Action" recommendations.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    chat: {
        label: 'AletheIA Pulse',
        description: 'Chat sentiment monitoring',
        extendedDescription: 'Emotional Temperature Sensor. Monitors tone, urgency, and sentiment in messaging channels (WhatsApp/Chat) to detect subtle mood shifts or resistance between sessions.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    transcription: {
        label: 'AletheIA Scribe',
        description: 'Audio to verbatim text',
        extendedDescription: 'High-Fidelity Transcriber. Converts clinical audio into verbatim text, distinguishing between speakers (diarization) and cleaning noise, preserving the accuracy required for the legal medical record.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Whisper v3',
        isFixed: true
    },
    audio_synthesis: {
        label: 'AletheIA Voice',
        description: 'Text-to-speech synthesis',
        extendedDescription: 'Vocal Synthesis Engine. Generates natural, empathetic audio from text so the therapist can consume summaries on the go or send automated yet human-warmth voice notes.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'ElevenLabs'
    },
    document_analysis: {
        label: 'AletheIA Scan',
        description: 'Document OCR & extraction',
        extendedDescription: 'Structured Data Processor. Extracts "hard" information (names, dates, symptoms, checks) from intake forms, PDFs, or medical report photos to populate the CRM without manual entry.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
    form_analysis: {
        label: 'AletheIA Scan',
        description: 'Intake form processing',
        extendedDescription: 'Form Analysis Module. Processes structured intake forms to extract and validate patient information for clinical records.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
    help_bot: {
        label: 'AletheIA Helper',
        description: 'Platform support',
        extendedDescription: 'Platform Assistant. Resolves operational queries about Kura OS usage ("How do I change my card?", "How do I create an appointment?"), acting as the first level of technical support.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
};

// API helpers
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
    { id: 'gemini-2.5-flash', provider: 'vertex-google', name: 'Gemini 2.5 Flash', supports_audio: true, cost_input: 0.075, cost_output: 0.30, is_enabled: true },
    { id: 'gemini-2.5-pro', provider: 'vertex-google', name: 'Gemini 2.5 Pro', supports_audio: true, cost_input: 1.25, cost_output: 5.00, is_enabled: true },
    { id: 'gemini-2.5-flash-lite', provider: 'vertex-google', name: 'Gemini 2.5 Flash Lite', supports_audio: false, cost_input: 0.02, cost_output: 0.10, is_enabled: true },
    { id: 'gemini-2.0-flash', provider: 'vertex-google', name: 'Gemini 2.0 Flash', supports_audio: true, cost_input: 0.10, cost_output: 0.40, is_enabled: true },
    { id: 'whisper-1', provider: 'openai', name: 'Whisper (Transcription)', supports_audio: true, cost_input: 0.006, cost_output: 0, is_enabled: true },
];

const COMPANION_MODELS = ['whisper-1', 'whisper'];

type TabId = 'financials' | 'activity' | 'models' | 'routing';

export default function AiGovernance() {
    const [stats, setStats] = useState<LedgerStats>(EMPTY_STATS);
    const [config, setConfig] = useState<AiConfig>({ cost_margin: 1.5, active_models: [], vertex_ai_enabled: true });
    const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
    const [logs, setLogs] = useState<UsageLog[]>([]);
    const [primaryModel] = useState<string>('gemini-2.5-flash');
    const [taskRouting, setTaskRouting] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingRouting, setIsSavingRouting] = useState(false);
    const [pendingRoutingChanges, setPendingRoutingChanges] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('financials');

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

    function handleRoutingChange(taskType: string, modelId: string) {
        setPendingRoutingChanges(prev => ({ ...prev, [taskType]: modelId }));
    }

    async function saveRouting() {
        if (Object.keys(pendingRoutingChanges).length === 0) return;

        setIsSavingRouting(true);
        try {
            await fetchWithAuth('/admin/ai/routing', {
                method: 'PATCH',
                body: JSON.stringify({ routing: pendingRoutingChanges }),
            });
            setTaskRouting(prev => ({ ...prev, ...pendingRoutingChanges }));
            setPendingRoutingChanges({});
        } catch (err) {
            console.error('Failed to save routing:', err);
        } finally {
            setIsSavingRouting(false);
        }
    }

    function getEffectiveModel(taskType: string): string {
        return pendingRoutingChanges[taskType] ?? taskRouting[taskType] ?? 'gemini-2.5-flash';
    }

    function hasPendingChange(taskType: string): boolean {
        return taskType in pendingRoutingChanges;
    }

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

    const tabs: { id: TabId; label: string; icon: typeof DollarSign }[] = [
        { id: 'financials', label: 'Financials', icon: DollarSign },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'models', label: 'Models', icon: Zap },
        { id: 'routing', label: 'Routing', icon: Settings },
    ];

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

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab: Financials */}
            {activeTab === 'financials' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Provider Cost</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.total_cost_usd)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stats.period_days}d • {stats.total_calls.toLocaleString()} calls</p>
                    </div>

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

                    <div className={`p-4 rounded-xl border ${stats.gross_profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className={`flex items-center gap-2 mb-2 ${stats.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Gross Profit</span>
                        </div>
                        <p className={`text-2xl font-bold ${stats.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(stats.gross_profit)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.margin_percentage > 0 ? '+' : ''}{stats.margin_percentage}% margin
                        </p>
                    </div>
                </div>
            )}

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
                <div className="card overflow-hidden">
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
                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground font-mono">Cost €</th>
                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground font-mono">KC</th>
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
                                        <td className="px-3 py-2 text-right text-muted-foreground">{log.cost_provider_usd.toFixed(6)}</td>
                                        <td className="px-3 py-2 text-right text-brand">{log.cost_user_credits.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Models */}
            {activeTab === 'models' && (
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand" />
                        <h3 className="font-medium text-sm">AI Models Available</h3>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">europe-west1</span>
                        <span className="text-xs text-muted-foreground ml-auto">{models.length} models</span>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {models.map((model) => {
                                    const status = getModelStatus(model.id);
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
                                                {model.supports_audio ? <Check className="w-4 h-4 text-green-400 inline" /> : <X className="w-4 h-4 text-muted-foreground inline" />}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">${model.cost_input.toFixed(3)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">${model.cost_output.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.style}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Routing */}
            {activeTab === 'routing' && (
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-brand" />
                            <h3 className="font-medium text-sm">Task Routing</h3>
                        </div>
                        {Object.keys(pendingRoutingChanges).length > 0 && (
                            <button
                                onClick={saveRouting}
                                disabled={isSavingRouting}
                                className="px-3 py-1.5 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingRouting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save Changes ({Object.keys(pendingRoutingChanges).length})
                            </button>
                        )}
                    </div>

                    {/* Group tasks by level */}
                    {([1, 2, 3] as TaskLevel[]).map((level) => {
                        const levelTasks = Object.entries(TASK_LABELS).filter(([, info]) => info.level === level);
                        if (levelTasks.length === 0) return null;
                        const levelInfo = LEVEL_INFO[level];

                        return (
                            <div key={level}>
                                {/* Level Header */}
                                <div className="px-4 py-2 bg-muted/50 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${levelInfo.color}`}>
                                            LEVEL {level}
                                        </span>
                                        <span className="text-xs font-medium text-foreground">
                                            {levelInfo.name}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {levelInfo.description}
                                    </p>
                                </div>

                                {/* Level Tasks */}
                                <div className="divide-y divide-border">
                                    {levelTasks.map(([taskType, taskInfo]) => {
                                        const currentModel = getEffectiveModel(taskType);
                                        const hasChange = hasPendingChange(taskType);
                                        const isFixed = taskInfo.isFixed;

                                        return (
                                            <div key={taskType} className={`px-4 py-3 transition-colors ${hasChange ? 'bg-brand/5' : ''}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium text-sm text-foreground">{taskInfo.label}</p>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${levelInfo.color} bg-current/10`}>
                                                                L{level}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-1">{taskInfo.description}</p>
                                                        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                                                            {taskInfo.extendedDescription}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {isFixed ? (
                                                            <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm font-medium whitespace-nowrap">
                                                                🔗 {models.find(m => m.id === currentModel)?.name || taskInfo.suggestedModel}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                value={currentModel}
                                                                onChange={(e) => handleRoutingChange(taskType, e.target.value)}
                                                                className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground min-w-[200px]"
                                                            >
                                                                {models.filter(m => !COMPANION_MODELS.includes(m.id)).map((model) => (
                                                                    <option key={model.id} value={model.id}>
                                                                        {model.name} (${model.cost_input}/${model.cost_output})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {hasChange && <span className="text-xs text-brand">• Modified</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
