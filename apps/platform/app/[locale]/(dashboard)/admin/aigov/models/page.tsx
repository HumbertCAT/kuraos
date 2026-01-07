'use client';

/**
 * AI Governance - Models Page
 * 
 * Model registry with capability badges and task compatibility.
 * v1.4.13: Rebuilt with capabilities matrix for intelligent routing.
 */

import { useState, useEffect } from 'react';
import { Brain, Check, X, Sparkles, Zap, Clock, Target } from 'lucide-react';
import {
    ALL_MODELS,
    AI_REQUIREMENTS,
    TASK_LABELS,
    LoadingSpinner,
    type ExtendedModelInfo,
    type AIRequirement,
} from '../shared';

const TIER_INFO = {
    flagship: { label: 'Flagship', icon: '👑', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    balanced: { label: 'Balanced', icon: '⚖️', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    efficient: { label: 'Efficient', icon: '💨', color: 'text-green-500', bg: 'bg-green-500/10' },
    specialized: { label: 'Specialized', icon: '🎯', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export default function ModelsPage() {
    const [models] = useState<ExtendedModelInfo[]>(ALL_MODELS);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);

    // Group by tier
    const tiers = ['flagship', 'balanced', 'efficient', 'specialized'] as const;

    return (
        <div className="space-y-6">
            {/* Tier Filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setSelectedTier(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTier === null
                            ? 'bg-brand text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    All Models
                </button>
                {tiers.map(tier => {
                    const info = TIER_INFO[tier];
                    return (
                        <button
                            key={tier}
                            onClick={() => setSelectedTier(tier)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedTier === tier
                                    ? `${info.bg} ${info.color}`
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            <span>{info.icon}</span>
                            {info.label}
                        </button>
                    );
                })}
            </div>

            {/* Models Grid */}
            <div className="grid gap-4">
                {models
                    .filter(m => !selectedTier || m.tier === selectedTier)
                    .map((model) => {
                        const tierInfo = TIER_INFO[model.tier];

                        return (
                            <div
                                key={model.id}
                                className={`card p-4 hover:border-brand/30 transition-all ${!model.is_enabled ? 'opacity-50' : ''
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-foreground">{model.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${tierInfo.bg} ${tierInfo.color}`}>
                                                {tierInfo.icon} {tierInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">{model.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-mono text-brand">
                                            €{model.cost_input}/€{model.cost_output}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">per 1M tokens</p>
                                    </div>
                                </div>

                                {/* Capabilities */}
                                <div className="mb-3">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Capabilities</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {model.capabilities.map(cap => {
                                            const req = AI_REQUIREMENTS[cap];
                                            return (
                                                <span
                                                    key={cap}
                                                    className={`text-xs px-2 py-0.5 rounded-full bg-current/10 ${req.color} flex items-center gap-1`}
                                                >
                                                    <span>{req.icon}</span>
                                                    {req.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Compatible Tasks */}
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Compatible Tasks</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {model.compatibleTasks.length > 0 ? (
                                            model.compatibleTasks.map(taskId => {
                                                const task = TASK_LABELS[taskId];
                                                if (!task) return null;
                                                return (
                                                    <span
                                                        key={taskId}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted text-foreground"
                                                    >
                                                        {task.label}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Coming soon</span>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                {!model.is_enabled && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <span className="text-xs text-muted-foreground">
                                            ⏳ Not yet available
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* Requirements Legend */}
            <div className="card p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    AI Requirements Legend
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.entries(AI_REQUIREMENTS) as [AIRequirement, typeof AI_REQUIREMENTS[AIRequirement]][]).map(([key, { label, icon, color }]) => (
                        <div key={key} className="flex items-center gap-2">
                            <span className={`text-lg`}>{icon}</span>
                            <span className={`text-xs ${color}`}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
