'use client';

/**
 * AI Governance - Routing Page
 * 
 * Task routing configuration - which model handles each task type.
 * v1.4.6: Extracted from monolithic AiGovernance.tsx
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Settings, Check, RefreshCw } from 'lucide-react';
import {
    fetchWithAuth,
    TASK_LABELS,
    LEVEL_INFO,
    DEFAULT_MODELS,
    COMPANION_MODELS,
    LoadingSpinner,
    type ModelInfo,
    type TaskLevel,
} from '../shared';

export default function RoutingPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string || 'es';

    const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
    const [taskRouting, setTaskRouting] = useState<Record<string, string>>({});
    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [modelsData, routingData] = await Promise.all([
                fetchWithAuth('/admin/ai/models').catch(() => DEFAULT_MODELS),
                fetchWithAuth('/admin/ai/routing').catch(() => ({ routing: {} })),
            ]);
            setModels(modelsData);
            setTaskRouting(routingData.routing || {});
        } catch (err) {
            console.error('Failed to load routing data:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function handleRoutingChange(taskType: string, modelId: string) {
        setPendingChanges(prev => ({ ...prev, [taskType]: modelId }));
    }

    async function saveRouting() {
        if (Object.keys(pendingChanges).length === 0) return;
        setIsSaving(true);
        try {
            await fetchWithAuth('/admin/ai/routing', {
                method: 'PATCH',
                body: JSON.stringify({ routing: pendingChanges }),
            });
            setTaskRouting(prev => ({ ...prev, ...pendingChanges }));
            setPendingChanges({});
        } catch (err) {
            console.error('Failed to save routing:', err);
        } finally {
            setIsSaving(false);
        }
    }

    function getEffectiveModel(taskType: string): string {
        return pendingChanges[taskType] ?? taskRouting[taskType] ?? 'gemini-2.5-flash';
    }

    function hasPendingChange(taskType: string): boolean {
        return taskType in pendingChanges;
    }

    if (isLoading) return <LoadingSpinner />;

    // Group tasks by level
    const tasksByLevel = Object.entries(TASK_LABELS).reduce((acc, [taskType, info]) => {
        const level = info.level as TaskLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push([taskType, info]);
        return acc;
    }, {} as Record<TaskLevel, [string, typeof TASK_LABELS[string]][]>);

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    return (
        <div className="space-y-6">
            {/* Save Bar */}
            {hasPendingChanges && (
                <div className="p-4 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-brand">
                        {Object.keys(pendingChanges).length} pending change(s)
                    </span>
                    <button
                        onClick={saveRouting}
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            )}

            {/* Task Routing by Level */}
            {([1, 2, 3] as TaskLevel[]).map(level => {
                const levelTasks = tasksByLevel[level] || [];
                const levelInfo = LEVEL_INFO[level];
                if (levelTasks.length === 0) return null;

                return (
                    <div key={level} className="card overflow-hidden">
                        <div className={`px-4 py-3 border-b border-border flex items-center gap-3 ${levelInfo.color} bg-current/5`}>
                            <span className="text-xl">
                                {level === 1 ? '🧠' : level === 2 ? '🎨' : '⚙️'}
                            </span>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">{levelInfo.name}</h3>
                                <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
                            </div>
                        </div>
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
                                                    <select
                                                        value={currentModel}
                                                        disabled
                                                        className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground min-w-[200px] opacity-60 cursor-not-allowed"
                                                        title="Fixed model - cannot be changed"
                                                    >
                                                        <option value={currentModel}>
                                                            {models.find(m => m.id === currentModel)?.name || taskInfo.suggestedModel}
                                                        </option>
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={currentModel}
                                                        onChange={(e) => handleRoutingChange(taskType, e.target.value)}
                                                        className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground min-w-[200px]"
                                                    >
                                                        {models.filter(m => !COMPANION_MODELS.includes(m.id)).map((model) => (
                                                            <option key={model.id} value={model.id}>
                                                                {model.name} (€{model.cost_input}/€{model.cost_output})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/${locale}/admin/aigov/routing/${taskType}`)}
                                                    className="p-2 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all active:scale-95"
                                                    title="Configure task"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
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
    );
}
