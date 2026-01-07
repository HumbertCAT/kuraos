'use client';

/**
 * AI Governance Shared Components
 * 
 * Types, constants, and reusable components for AI Governance pages.
 * v1.4.6: Extracted from monolithic AiGovernance.tsx for route-based architecture.
 */

// =============================================================================
// Types
// =============================================================================

export interface LedgerStats {
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

export interface AiConfig {
    cost_margin: number;
    active_models: string[];
    vertex_ai_enabled: boolean;
}

export interface ModelInfo {
    id: string;
    provider: string;
    name: string;
    supports_audio: boolean;
    cost_input: number;
    cost_output: number;
    is_enabled: boolean;
}

export interface UsageLog {
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

export type TaskLevel = 1 | 2 | 3;

export interface TaskMetadata {
    label: string;
    description: string;
    extendedDescription: string;
    level: TaskLevel;
    levelName: string;
    suggestedModel: string;
    isFixed?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

export const LEVEL_INFO: Record<TaskLevel, { name: string; description: string; color: string }> = {
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

export const TASK_LABELS: Record<string, TaskMetadata> = {
    triage: {
        label: 'AletheIA Sentinel',
        description: 'Risk screening (critical)',
        extendedDescription: 'Active Security Monitor. Analyzes every interaction in real-time to detect critical risk markers.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 3 Pro',
    },
    clinical_analysis: {
        label: 'AletheIA Oracle',
        description: 'Session notes & deep analysis',
        extendedDescription: 'Clinical Deduction Engine. Processes full session transcripts to extract latent themes and patterns.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    briefing: {
        label: 'AletheIA Now',
        description: 'Daily briefing & next actions',
        extendedDescription: 'Strategic Context Synthesizer. Cross-references patient history to generate daily briefings.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    chat: {
        label: 'AletheIA Pulse',
        description: 'Chat sentiment monitoring',
        extendedDescription: 'Emotional Temperature Sensor. Monitors tone and urgency in messaging channels.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    transcription: {
        label: 'AletheIA Scribe',
        description: 'Audio to verbatim text',
        extendedDescription: 'High-Fidelity Transcriber. Converts clinical audio into verbatim text with diarization.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Whisper v3',
        isFixed: true
    },
    audio_synthesis: {
        label: 'AletheIA Voice',
        description: 'Full session audio analysis',
        extendedDescription: 'Session Synthesis Engine. Analyzes long audio (≥15 min) for comprehensive clinical insights.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    audio_memo: {
        label: 'AletheIA Memo',
        description: 'Quick audio notes (<15 min)',
        extendedDescription: 'Executive Notes Extractor. Processes short voice memos to extract action items, medications, and key data as structured JSON.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    document_analysis: {
        label: 'AletheIA Scan',
        description: 'Document OCR & extraction',
        extendedDescription: 'Structured Data Processor. Extracts information from forms and documents.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
    form_analysis: {
        label: 'AletheIA Scan',
        description: 'Intake form processing',
        extendedDescription: 'Form Analysis Module. Processes structured intake forms.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
    help_bot: {
        label: 'AletheIA Helper',
        description: 'Platform support',
        extendedDescription: 'Platform Assistant. Resolves operational queries about Kura OS usage.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
};

export const EMPTY_STATS: LedgerStats = {
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

export const DEFAULT_MODELS: ModelInfo[] = [
    { id: 'gemini-2.5-flash', provider: 'vertex-google', name: 'Gemini 2.5 Flash', supports_audio: true, cost_input: 0.075, cost_output: 0.30, is_enabled: true },
    { id: 'gemini-2.5-pro', provider: 'vertex-google', name: 'Gemini 2.5 Pro', supports_audio: true, cost_input: 1.25, cost_output: 5.00, is_enabled: true },
    { id: 'gemini-2.5-flash-lite', provider: 'vertex-google', name: 'Gemini 2.5 Flash Lite', supports_audio: false, cost_input: 0.02, cost_output: 0.10, is_enabled: true },
    { id: 'gemini-2.0-flash', provider: 'vertex-google', name: 'Gemini 2.0 Flash', supports_audio: true, cost_input: 0.10, cost_output: 0.40, is_enabled: true },
    { id: 'whisper-1', provider: 'openai', name: 'Whisper (Transcription)', supports_audio: true, cost_input: 0.006, cost_output: 0, is_enabled: true },
];

export const COMPANION_MODELS = ['whisper-1', 'whisper'];

// =============================================================================
// API Helper
// =============================================================================

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
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

// =============================================================================
// Reusable Components
// =============================================================================

export function MetricCard({
    label,
    value,
    subValue,
    icon: Icon,
    colorClass = 'text-foreground'
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ComponentType<{ className?: string }>;
    colorClass?: string;
}) {
    return (
        <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${colorClass}`}>{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
    );
}

export function TaskBadge({ level }: { level: TaskLevel }) {
    const info = LEVEL_INFO[level];
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${info.color} bg-current/10`}>
            L{level}
        </span>
    );
}

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
