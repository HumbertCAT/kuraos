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
        label: 'Sentinel',
        description: 'Risk screening (critical)',
        extendedDescription: 'Active Security Monitor. Analyzes every interaction in real-time to detect critical risk markers.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 3 Pro',
    },
    clinical_analysis: {
        label: 'Oracle',
        description: 'Session notes & deep analysis',
        extendedDescription: 'Clinical Deduction Engine. Processes full session transcripts to extract latent themes and patterns.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    briefing: {
        label: 'Now',
        description: 'Daily briefing & next actions',
        extendedDescription: 'Strategic Context Synthesizer. Cross-references patient history to generate daily briefings.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Pro'
    },
    chat: {
        label: 'Pulse',
        description: 'Chat sentiment monitoring',
        extendedDescription: 'Emotional Temperature Sensor. Monitors tone and urgency in messaging channels.',
        level: 1,
        levelName: 'Clinical Judgment',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    transcription: {
        label: 'Scribe',
        description: 'Audio to verbatim text',
        extendedDescription: 'High-Fidelity Transcriber. Converts clinical audio into verbatim text with diarization.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Whisper v3',
    },
    audio_synthesis: {
        label: 'Voice',
        description: 'Full session audio analysis',
        extendedDescription: 'Session Synthesis Engine. Analyzes long audio (≥15 min) for comprehensive clinical insights.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    audio_memo: {
        label: 'Memo',
        description: 'Quick audio notes (<15 min)',
        extendedDescription: 'Executive Notes Extractor. Processes short voice memos to extract action items, medications, and key data.',
        level: 2,
        levelName: 'Transformation',
        suggestedModel: 'Gemini 2.5 Flash'
    },
    document_analysis: {
        label: 'Scan',
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
        label: 'Helper',
        description: 'Platform support',
        extendedDescription: 'Platform Assistant. Resolves operational queries about Kura OS usage.',
        level: 3,
        levelName: 'Operations',
        suggestedModel: 'Gemini 2.5 Flash Lite'
    },
};

// =============================================================================
// AI Requirements (What each task needs)
// =============================================================================

export type AIRequirement =
    | 'reasoning'      // Deep clinical logic
    | 'speed'          // Low latency
    | 'memory'         // Context window
    | 'accuracy'       // Precision (transcription, data)
    | 'audio'          // Native audio input
    | 'vision'         // Image/PDF processing
    | 'humanizer';     // Natural voice/empathy

export const AI_REQUIREMENTS: Record<AIRequirement, { label: string; icon: string; color: string }> = {
    reasoning: { label: 'Reasoning', icon: '🧠', color: 'text-purple-500' },
    speed: { label: 'Speed', icon: '⚡', color: 'text-yellow-500' },
    memory: { label: 'Memory', icon: '📚', color: 'text-blue-500' },
    accuracy: { label: 'Accuracy', icon: '🎯', color: 'text-green-500' },
    audio: { label: 'Audio', icon: '🎙️', color: 'text-pink-500' },
    vision: { label: 'Vision', icon: '👁️', color: 'text-cyan-500' },
    humanizer: { label: 'Humanizer', icon: '💬', color: 'text-orange-500' },
};

// Task → Required capabilities mapping
export const TASK_REQUIREMENTS: Record<string, AIRequirement[]> = {
    triage: ['reasoning', 'accuracy'],
    clinical_analysis: ['reasoning', 'memory'],
    briefing: ['reasoning', 'memory'],
    chat: ['speed', 'humanizer'],
    transcription: ['audio', 'accuracy'],
    audio_synthesis: ['audio', 'humanizer'],
    audio_memo: ['audio', 'speed', 'accuracy'],
    document_analysis: ['vision', 'accuracy'],
    form_analysis: ['accuracy'],
    help_bot: ['speed'],
};

// =============================================================================
// Model Registry with Capabilities
// =============================================================================

export interface ExtendedModelInfo extends ModelInfo {
    capabilities: AIRequirement[];
    compatibleTasks: string[];
    tier: 'flagship' | 'balanced' | 'efficient' | 'specialized';
}

export const ALL_MODELS: ExtendedModelInfo[] = [
    // === Flagship (Max Intelligence) ===
    {
        id: 'gemini-3-pro',
        provider: 'vertex-google',
        name: 'Gemini 3 Pro',
        supports_audio: true,
        cost_input: 2.00,
        cost_output: 12.00,
        is_enabled: true,
        capabilities: ['reasoning', 'memory', 'audio', 'vision', 'accuracy'],
        compatibleTasks: ['triage', 'clinical_analysis', 'briefing', 'document_analysis'],
        tier: 'flagship',
    },
    {
        id: 'gemini-2.5-pro',
        provider: 'vertex-google',
        name: 'Gemini 2.5 Pro',
        supports_audio: true,
        cost_input: 1.25,
        cost_output: 5.00,
        is_enabled: true,
        capabilities: ['reasoning', 'memory', 'audio', 'vision'],
        compatibleTasks: ['triage', 'clinical_analysis', 'briefing', 'document_analysis'],
        tier: 'flagship',
    },
    {
        id: 'claude-3-5-sonnet',
        provider: 'vertex-anthropic',
        name: 'Claude 3.5 Sonnet',
        supports_audio: false,
        cost_input: 3.00,
        cost_output: 15.00,
        is_enabled: true,
        capabilities: ['reasoning', 'accuracy', 'vision', 'memory'], // ✅ Memory added
        compatibleTasks: ['triage', 'clinical_analysis', 'document_analysis'],
        tier: 'flagship',
    },
    // === Balanced (Good all-around) ===
    {
        id: 'gemini-2.5-flash',
        provider: 'vertex-google',
        name: 'Gemini 2.5 Flash',
        supports_audio: true,
        cost_input: 0.15,
        cost_output: 0.60,
        is_enabled: true,
        capabilities: ['speed', 'audio', 'vision', 'reasoning'],
        compatibleTasks: ['chat', 'audio_memo', 'document_analysis'],
        tier: 'balanced',
    },
    {
        id: 'llama-3-1-405b',
        provider: 'vertex-meta',
        name: 'Llama 3.1 405B',
        supports_audio: false,
        cost_input: 2.50,
        cost_output: 5.00,
        is_enabled: true,
        capabilities: ['reasoning', 'accuracy', 'memory'], // ✅ Reasoning/Memory for Llama
        compatibleTasks: ['clinical_analysis', 'triage'],
        tier: 'balanced',
    },
    {
        id: 'llama-3-1-70b',
        provider: 'vertex-meta',
        name: 'Llama 3.1 70B',
        supports_audio: false,
        cost_input: 0.90,
        cost_output: 1.80,
        is_enabled: true,
        capabilities: ['reasoning', 'accuracy'],
        compatibleTasks: ['triage', 'form_analysis'],
        tier: 'balanced',
    },
    // === Efficient (Cost-optimized) ===
    {
        id: 'gemini-2.5-flash-lite',
        provider: 'vertex-google',
        name: 'Gemini 2.5 Flash Lite',
        supports_audio: false,
        cost_input: 0.075,
        cost_output: 0.30,
        is_enabled: true,
        capabilities: ['speed', 'accuracy'],
        compatibleTasks: ['form_analysis', 'help_bot'],
        tier: 'efficient',
    },
    {
        id: 'claude-3-haiku',
        provider: 'vertex-anthropic',
        name: 'Claude 3 Haiku',
        supports_audio: false,
        cost_input: 0.25,
        cost_output: 1.25,
        is_enabled: true,
        capabilities: ['speed', 'accuracy'],
        compatibleTasks: ['chat', 'help_bot'],
        tier: 'efficient',
    },
    // === Specialized ===
    {
        id: 'whisper-large-v3',
        provider: 'openai',
        name: 'Whisper v3 Large',
        supports_audio: true,
        cost_input: 0.006,
        cost_output: 0,
        is_enabled: true,
        capabilities: ['audio', 'accuracy'],
        compatibleTasks: ['transcription'],
        tier: 'specialized',
    },
    {
        id: 'eleven-labs-v2',
        provider: 'elevenlabs',
        name: 'ElevenLabs v2',
        supports_audio: true,
        cost_input: 0.0,
        cost_output: 0.3,
        is_enabled: true,
        capabilities: ['audio', 'humanizer'],
        compatibleTasks: ['audio_synthesis'],
        tier: 'specialized',
    },
    {
        id: 'google-chirp-v2',
        provider: 'vertex-google',
        name: 'Chirp (STT v2)',
        supports_audio: true,
        cost_input: 0.016, // Approx $0.016 per minute
        cost_output: 0,
        is_enabled: true,
        capabilities: ['audio', 'accuracy'],
        compatibleTasks: ['transcription'],
        tier: 'specialized',
    },
    {
        id: 'privacy-shield-sdp',
        provider: 'vertex-google',
        name: 'PrivacyShield (SDP)',
        supports_audio: false,
        cost_input: 3.00, // Search/Inspect pricing varies
        cost_output: 0,
        is_enabled: false,
        capabilities: ['accuracy'],
        compatibleTasks: [], // For future Privacy layer
        tier: 'specialized',
    },
];

/**
 * NOTE: Pricing logic for Vertex AI
 * Currently, pricing is hardcoded in the FE based on Google Cloud SKUs.
 * While the Cloud Billing Catalog API provides programmatic access, mapping 
 * specific GenAI model names (e.g., gemini-1.5-pro) to billing SKUs is 
 * non-trivial as SKUs are region-specific and use alphanumeric IDs.
 */


// Legacy compatibility
export const DEFAULT_MODELS: ModelInfo[] = ALL_MODELS.map(m => ({
    id: m.id,
    provider: m.provider,
    name: m.name,
    supports_audio: m.supports_audio,
    cost_input: m.cost_input,
    cost_output: m.cost_output,
    is_enabled: m.is_enabled,
}));

export const COMPANION_MODELS = ['whisper-1', 'whisper'];

// =============================================================================
// Stats & Ledger
// =============================================================================

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
