'use client';

/**
 * AI Governance Task Detail Page
 * 
 * v1.4.5: Configure temperature, max tokens, safety mode per task.
 * Features:
 * - Temperature slider with color feedback (green<0.5, orange>0.7)
 * - Safety mode select with confirmation modal
 * - Metrics cards (30-day stats)
 * - Change history table with user info
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Activity,
    Zap,
    Clock,
    AlertTriangle,
    CheckCircle,
    History,
    Shield,
    Thermometer,
    Hash,
    BrainCircuit,
    Cpu,
} from 'lucide-react';

// Task metadata (same as in AiGovernance.tsx)
const TASK_LABELS: Record<string, { label: string; description: string }> = {
    clinical_analysis: { label: 'AletheIA Oracle', description: 'Session notes & deep analysis' },
    audio_synthesis: { label: 'AletheIA Voice', description: 'Text-to-speech synthesis' },
    document_analysis: { label: 'AletheIA Scan', description: 'Document OCR & extraction' },
    form_analysis: { label: 'AletheIA Scan', description: 'Intake form processing' },
    triage: { label: 'AletheIA Sentinel', description: 'Risk screening (critical)' },
    chat: { label: 'AletheIA Pulse', description: 'Chat sentiment monitoring' },
    help_bot: { label: 'AletheIA Helper', description: 'Platform support' },
    transcription: { label: 'AletheIA Scribe', description: 'Audio to verbatim text' },
    briefing: { label: 'AletheIA Now', description: 'Daily briefing & next actions' },
};

const SAFETY_MODES = [
    { value: 'CLINICAL', label: 'Clinical', description: 'Allows discussion of suicide/self-harm in therapy context' },
    { value: 'STANDARD', label: 'Standard', description: 'Balanced content filtering' },
    { value: 'STRICT', label: 'Strict', description: 'Maximum filtering for public-facing bots' },
];

const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
];

interface TaskConfig {
    task_type: string;
    model_id: string;
    temperature: number;
    max_output_tokens: number;
    safety_mode: string;
}

interface TaskMetrics {
    total_calls: number;
    total_tokens_input: number;
    total_tokens_output: number;
    total_cost_usd: number;
    total_cost_credits: number;
    success_rate: number;
}

interface HistoryEntry {
    field_changed: string;
    old_value: string | null;
    new_value: string | null;
    changed_at: string;
    changed_by: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

export default function TaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const taskType = params.task as string;
    const locale = params.locale as string || 'es';

    const [config, setConfig] = useState<TaskConfig | null>(null);
    const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSafetyConfirm, setShowSafetyConfirm] = useState(false);
    const [pendingSafetyMode, setPendingSafetyMode] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        model_id: '',
        temperature: 0.7,
        max_output_tokens: 2048,
        safety_mode: 'CLINICAL',
        system_prompt_template: '',
    });

    useEffect(() => {
        loadData();
    }, [taskType]);

    async function loadData() {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/admin/ai-governance/tasks/${taskType}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to load task config');
            const data = await res.json();

            setConfig(data.config);
            setMetrics(data.metrics);
            setHistory(data.history || []);
            setFormData({
                model_id: data.config.model_id,
                temperature: data.config.temperature,
                max_output_tokens: data.config.max_output_tokens,
                safety_mode: data.config.safety_mode,
                system_prompt_template: data.config.system_prompt_template || '',
            });
        } catch (err: any) {
            // Fallback to defaults when API unavailable (for local dev)
            setError('API no disponible. Mostrando valores por defecto.');
            setFormData({
                model_id: 'gemini-2.5-flash',
                temperature: 0.7,
                max_output_tokens: 2048,
                safety_mode: 'CLINICAL',
                system_prompt_template: '',
            });
            setMetrics({
                total_calls: 0,
                total_tokens_input: 0,
                total_tokens_output: 0,
                total_cost_usd: 0,
                total_cost_credits: 0,
                success_rate: 1.0,
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`${API_URL}/admin/ai-governance/tasks/${taskType}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to save config');

            // Success toast
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            // Reload data
            await loadData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    }

    function handleSafetyChange(value: string) {
        if (value !== 'CLINICAL' && formData.safety_mode === 'CLINICAL') {
            // Show confirmation modal when leaving CLINICAL
            setPendingSafetyMode(value);
            setShowSafetyConfirm(true);
        } else {
            setFormData({ ...formData, safety_mode: value });
        }
    }

    function confirmSafetyChange() {
        if (pendingSafetyMode) {
            setFormData({ ...formData, safety_mode: pendingSafetyMode });
        }
        setShowSafetyConfirm(false);
        setPendingSafetyMode(null);
    }

    // Temperature color based on value
    function getTempColor(temp: number): string {
        if (temp <= 0.3) return 'text-blue-500';
        if (temp <= 0.5) return 'text-green-500';
        if (temp <= 0.7) return 'text-yellow-500';
        if (temp <= 0.9) return 'text-orange-500';
        return 'text-red-500';
    }

    function getTempBgColor(temp: number): string {
        if (temp <= 0.3) return 'bg-blue-500';
        if (temp <= 0.5) return 'bg-green-500';
        if (temp <= 0.7) return 'bg-yellow-500';
        if (temp <= 0.9) return 'bg-orange-500';
        return 'bg-red-500';
    }

    const taskInfo = TASK_LABELS[taskType] || { label: taskType, description: '' };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-6 h-6 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/admin/aigov/routing`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{taskInfo.label}</h1>
                        <p className="text-muted-foreground">{taskInfo.description}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-brand text-white font-medium rounded-xl hover:bg-brand/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                </button>
            </div>

            {/* Success Toast */}
            {saveSuccess && (
                <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Configuration updated & Cache invalidated</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SECTION 1: Process Definition */}
                    <div className="card p-6 space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-ai" />
                            Definición del Proceso
                        </h2>

                        {/* v1.4.6: System Prompt Template */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                📝 System Prompt Template (Jinja2)
                            </label>
                            <textarea
                                value={formData.system_prompt_template}
                                onChange={(e) => setFormData({ ...formData, system_prompt_template: e.target.value })}
                                className="w-full h-64 px-4 py-3 bg-muted border border-border rounded-xl text-foreground font-mono text-sm resize-y"
                                placeholder="Escribe el prompt de sistema aquí..."
                            />
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                <span>{formData.system_prompt_template.split('\n').length} líneas</span>
                                {formData.system_prompt_template.includes('{{') && (
                                    <span className="text-brand">Variables Jinja2 detectadas</span>
                                )}
                            </div>
                            {/* Warning ONLY for tasks that require variables (help_bot) */}
                            {['help_bot'].includes(taskType) && formData.system_prompt_template && !formData.system_prompt_template.includes('{{') && (
                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-xs text-yellow-500">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Esta tarea requiere variables (locale, user_name). Verifica el template.</span>
                                </div>
                            )}
                            {/* Informational note for pure system instructions */}
                            {!['help_bot'].includes(taskType) && (
                                <div className="mt-2 text-xs text-muted-foreground italic">
                                    ℹ️ Esta es una instrucción de sistema pura. Los datos del paciente se inyectan automáticamente vía User Message.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: Inference Engine */}
                    <div className="card p-6 space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-brand" />
                            Motor de Inferencia
                        </h2>

                        {/* Model Selection */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Modelo
                            </label>
                            <select
                                value={formData.model_id}
                                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground"
                            >
                                {AVAILABLE_MODELS.map((model) => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Temperature Slider */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Thermometer className="w-4 h-4" />
                                    Temperatura
                                </label>
                                <span className={`text-2xl font-bold font-mono ${getTempColor(formData.temperature)}`}>
                                    {formData.temperature.toFixed(1)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={formData.temperature}
                                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #22c55e 25%, #eab308 37.5%, #f97316 45%, #ef4444 50%, #ef4444 100%)`,
                                }}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>0.0 (Determinístico)</span>
                                <span>1.0</span>
                                <span>2.0 (Muy creativo)</span>
                            </div>
                            {/* Warning for high temperature */}
                            {formData.temperature > 0.8 && (
                                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-500">Alta creatividad</p>
                                        <p className="text-xs text-muted-foreground">
                                            Puede aumentar alucinaciones. No recomendado para extracción clínica.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Max Tokens */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                <Hash className="w-4 h-4" />
                                Max Tokens de Salida
                            </label>
                            <input
                                type="number"
                                min="256"
                                max="8192"
                                step="256"
                                value={formData.max_output_tokens}
                                onChange={(e) => setFormData({ ...formData, max_output_tokens: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground font-mono"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Rango: 256 - 8192 tokens
                            </p>
                        </div>

                        {/* Safety Mode */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                <Shield className="w-4 h-4" />
                                Modo de Seguridad
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {SAFETY_MODES.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => handleSafetyChange(mode.value)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${formData.safety_mode === mode.value
                                            ? 'border-brand bg-brand/10'
                                            : 'border-border hover:border-muted-foreground'
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{mode.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Metrics & History */}
                <div className="space-y-6">
                    {/* Metrics */}
                    {metrics && (
                        <div className="card p-4 space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Activity className="w-4 h-4" />
                                Últimos 30 días
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-muted/50 rounded-xl">
                                    <p className="text-2xl font-bold font-mono">{metrics.total_calls.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Llamadas</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-xl">
                                    <p className="text-2xl font-bold font-mono text-brand">
                                        {metrics.total_cost_credits.toFixed(0)} KC
                                    </p>
                                    <p className="text-xs text-muted-foreground">Costo</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-xl">
                                    <p className="text-lg font-bold font-mono">
                                        {((metrics.total_tokens_input + metrics.total_tokens_output) / 1000000).toFixed(2)}M
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tokens</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-xl">
                                    <p className="text-lg font-bold font-mono text-green-500">
                                        {(metrics.success_rate * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Éxito</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    <div className="card p-4 space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <History className="w-4 h-4" />
                            Historial de cambios
                        </h3>
                        {history.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Sin cambios registrados
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {history.map((entry, i) => (
                                    <div key={i} className="p-3 bg-muted/50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 bg-brand/20 rounded-full flex items-center justify-center text-xs font-bold text-brand">
                                                {entry.changed_by ? entry.changed_by.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(entry.changed_at).toLocaleString('es-ES', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm">
                                            <code className="px-1 bg-muted rounded text-brand">{entry.field_changed}</code>
                                            {' '}
                                            <span className="text-muted-foreground line-through">{entry.old_value}</span>
                                            {' → '}
                                            <span className="font-medium">{entry.new_value}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Safety Confirmation Modal */}
            {showSafetyConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500/20 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold">¿Reducir seguridad?</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Estás cambiando de modo <strong>Clinical</strong> a <strong>{pendingSafetyMode}</strong>.
                            Esto puede afectar cómo el modelo filtra contenido sensible.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowSafetyConfirm(false);
                                    setPendingSafetyMode(null);
                                }}
                                className="px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmSafetyChange}
                                className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                Confirmar cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
