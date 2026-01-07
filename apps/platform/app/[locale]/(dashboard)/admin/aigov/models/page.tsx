'use client';

/**
 * AI Governance - Models Page
 * 
 * Model registry with advanced 4-tier filtering:
 * 1. Provider (Google, Anthropic, Meta...)
 * 2. Role (Flagship, Balanced, Efficient, Specialized)
 * 3. Capabilities (Reasoning, Audio, Vision...)
 * 4. Compatibility (Oracle, Scribe, Sentinel...)
 * 
 * v1.4.14: Advanced Filtering System implementation.
 */

import { useState, useMemo } from 'react';
import {
    Fingerprint,
    Target,
    Shield,
    Cpu,
    Filter,
    RotateCcw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    ALL_MODELS,
    AI_REQUIREMENTS,
    TASK_LABELS,
    type ExtendedModelInfo,
    type AIRequirement,
} from '../shared';

const TIER_INFO = {
    flagship: { label: 'Flagship', icon: '👑', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    balanced: { label: 'Balanced', icon: '⚖️', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    efficient: { label: 'Efficient', icon: '💨', color: 'text-green-500', bg: 'bg-green-500/10' },
    specialized: { label: 'Specialized', icon: '🎯', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

const PROVIDER_NAMES: Record<string, string> = {
    'vertex-google': 'Google Vertex',
    'vertex-anthropic': 'Anthropic',
    'vertex-meta': 'Meta (Llama)',
    'vertex-mistral': 'Mistral',
    'openai': 'OpenAI',
    'elevenlabs': 'ElevenLabs',
};

export default function ModelsPage() {
    const [filters, setFilters] = useState({
        provider: null as string | null,
        tier: null as string | null,
        capability: null as AIRequirement | null,
        task: null as string | null,
    });

    const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

    const filteredModels = useMemo(() => {
        return ALL_MODELS.filter(model => {
            if (filters.provider && model.provider !== filters.provider) return false;
            if (filters.tier && model.tier !== filters.tier) return false;
            if (filters.capability && !model.capabilities.includes(filters.capability)) return false;
            if (filters.task && !model.compatibleTasks.includes(filters.task)) return false;
            return true;
        });
    }, [filters]);

    const providers = useMemo(() => Array.from(new Set(ALL_MODELS.map(m => m.provider))), []);
    const tiers = ['flagship', 'balanced', 'efficient', 'specialized'] as const;
    const capabilities = Object.keys(AI_REQUIREMENTS) as AIRequirement[];
    const tasks = Object.keys(TASK_LABELS);

    const resetFilters = () => setFilters({ provider: null, tier: null, capability: null, task: null });

    const FilterSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                <Icon className="w-3 h-3" />
                {title}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {children}
            </div>
        </div>
    );

    const FilterButton = ({
        active,
        onClick,
        children,
        variant = 'default'
    }: {
        active: boolean,
        onClick: () => void,
        children: React.ReactNode,
        variant?: 'default' | 'tier'
    }) => {
        const baseClass = "px-2.5 py-1 rounded-md text-xs font-medium transition-all border";
        const activeClass = active
            ? "bg-brand border-brand text-white shadow-sm"
            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground";

        return (
            <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
                {children}
            </button>
        );
    };

    return (
        <div className="space-y-6">
            {/* Advanced Filters Header */}
            <div className="card overflow-hidden">
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                            <Filter className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">Filtros Inteligentes</h3>
                            <p className="text-[10px] text-muted-foreground">Provider • Role • Capabilities • Compatibility</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {(filters.provider || filters.tier || filters.capability || filters.task) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                                className="text-[10px] flex items-center gap-1 text-brand hover:underline"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Limpiar filtros
                            </button>
                        )}
                        {isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>

                {isFiltersExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-200">
                        {/* 1. Provider */}
                        <FilterSection title="Provider" icon={Fingerprint}>
                            {providers.map(p => (
                                <FilterButton
                                    key={p}
                                    active={filters.provider === p}
                                    onClick={() => setFilters(prev => ({ ...prev, provider: prev.provider === p ? null : p }))}
                                >
                                    {PROVIDER_NAMES[p] || p}
                                </FilterButton>
                            ))}
                        </FilterSection>

                        {/* 2. Role (Tier) */}
                        <FilterSection title="Role / Tier" icon={Shield}>
                            {tiers.map(t => (
                                <FilterButton
                                    key={t}
                                    active={filters.tier === t}
                                    onClick={() => setFilters(prev => ({ ...prev, tier: prev.tier === t ? null : t }))}
                                >
                                    {TIER_INFO[t].icon} {TIER_INFO[t].label}
                                </FilterButton>
                            ))}
                        </FilterSection>

                        {/* 3. Capabilities */}
                        <FilterSection title="Capabilities" icon={Cpu}>
                            {capabilities.map(c => (
                                <FilterButton
                                    key={c}
                                    active={filters.capability === c}
                                    onClick={() => setFilters(prev => ({ ...prev, capability: prev.capability === c ? null : c }))}
                                >
                                    {AI_REQUIREMENTS[c].icon} {AI_REQUIREMENTS[c].label}
                                </FilterButton>
                            ))}
                        </FilterSection>

                        {/* 4. Compatibility */}
                        <FilterSection title="Compatibility" icon={Target}>
                            {tasks.map(t => (
                                <FilterButton
                                    key={t}
                                    active={filters.task === t}
                                    onClick={() => setFilters(prev => ({ ...prev, task: prev.task === t ? null : t }))}
                                >
                                    {TASK_LABELS[t].label}
                                </FilterButton>
                            ))}
                        </FilterSection>
                    </div>
                )}
            </div>

            {/* Result Stats */}
            <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                    Mostrando <span className="text-foreground font-semibold">{filteredModels.length}</span> modelos
                </p>
                {filteredModels.length === 0 && (
                    <button onClick={resetFilters} className="text-xs text-brand hover:underline">
                        Restablecer filtros
                    </button>
                )}
            </div>

            {/* Models Grid */}
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredModels.map((model) => {
                    const tierInfo = TIER_INFO[model.tier];
                    return (
                        <div
                            key={model.id}
                            className={`card p-5 hover:border-brand/30 transition-all flex flex-col h-full ${!model.is_enabled ? 'opacity-50 grayscale' : ''}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm text-foreground">{model.name}</h3>
                                        {!model.is_enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-bold tracking-tighter">Inactive</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider`}>
                                            {PROVIDER_NAMES[model.provider] || model.provider}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border`}>
                                            {tierInfo.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono text-brand font-bold">
                                        €{model.cost_input} <span className="text-muted-foreground font-normal">/</span> €{model.cost_output}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase">1M Tokens</p>
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div className="mb-4 flex-1">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2 opacity-70">Core Capabilities</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {model.capabilities.map(cap => {
                                        const req = AI_REQUIREMENTS[cap];
                                        return (
                                            <div
                                                key={cap}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/50 text-[10px] ${req.color}`}
                                                title={req.label}
                                            >
                                                <span>{req.icon}</span>
                                                <span className="font-medium">{req.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Compatible Tasks */}
                            <div className="pt-4 border-t border-border/50">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2 opacity-70">AletheIA Compatibility</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {model.compatibleTasks.length > 0 ? (
                                        model.compatibleTasks.map(taskId => {
                                            const task = TASK_LABELS[taskId];
                                            if (!task) return null;
                                            return (
                                                <span
                                                    key={taskId}
                                                    className="text-[10px] px-2 py-0.5 rounded-sm bg-brand/5 text-brand border border-brand/10 font-medium"
                                                >
                                                    {task.label}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">Propósito general / Pendiente mapeo</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Requirements Legend */}
            <div className="card p-4 bg-muted/20">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                        <Target className="w-3 h-3" />
                    </div>
                    <h4 className="text-xs font-semibold">Glosario de Capacidades Técnicas</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(Object.entries(AI_REQUIREMENTS) as [AIRequirement, typeof AI_REQUIREMENTS[AIRequirement]][]).map(([key, { label, icon, color }]) => (
                        <div key={key} className="flex flex-col gap-1 p-2 rounded-lg bg-card border border-border/50">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{icon}</span>
                                <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
