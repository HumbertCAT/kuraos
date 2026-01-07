'use client';

/**
 * AI Governance - Models Page
 * 
 * Available AI models and their configurations.
 * v1.4.6: Extracted from AiGovernance.tsx
 */

import { useState, useEffect } from 'react';
import { Brain, Check, X, Mic } from 'lucide-react';
import {
    fetchWithAuth,
    DEFAULT_MODELS,
    LoadingSpinner,
    type ModelInfo,
} from '../shared';

export default function ModelsPage() {
    const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth('/admin/ai/models').catch(() => DEFAULT_MODELS);
            setModels(data);
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Available Models
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Model</th>
                            <th className="text-left px-4 py-3 text-muted-foreground font-medium">Provider</th>
                            <th className="text-center px-4 py-3 text-muted-foreground font-medium">Audio</th>
                            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Input Cost</th>
                            <th className="text-right px-4 py-3 text-muted-foreground font-medium">Output Cost</th>
                            <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {models.map((model) => (
                            <tr key={model.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-foreground">{model.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{model.id}</p>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{model.provider}</td>
                                <td className="px-4 py-3 text-center">
                                    {model.supports_audio ? (
                                        <Mic className="w-4 h-4 text-brand mx-auto" />
                                    ) : (
                                        <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-brand">€{model.cost_input}</td>
                                <td className="px-4 py-3 text-right font-mono text-brand">€{model.cost_output}</td>
                                <td className="px-4 py-3 text-center">
                                    {model.is_enabled ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs">
                                            <Check className="w-3 h-3" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                                            Disabled
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
