'use client';

/**
 * AI Governance - Ledger Page
 * 
 * Financial metrics and AI usage costs.
 * v1.4.6: Extracted from AiGovernance.tsx
 */

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Zap, Activity } from 'lucide-react';
import {
    fetchWithAuth,
    EMPTY_STATS,
    LoadingSpinner,
    MetricCard,
    type LedgerStats,
} from '../shared';

export default function LedgerPage() {
    const [stats, setStats] = useState<LedgerStats>(EMPTY_STATS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth('/admin/ai/ledger');
            setStats(data);
        } catch (err) {
            console.error('Failed to load ledger data:', err);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) return <LoadingSpinner />;

    const marginPercent = stats.margin_percentage || 0;
    const marginColor = marginPercent >= 30 ? 'text-green-500' : marginPercent >= 10 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="space-y-6">
            {/* Financial Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="AI Cost"
                    value={`€${stats.total_cost_usd.toFixed(2)}`}
                    subValue={`${stats.period_days} days`}
                    icon={DollarSign}
                />
                <MetricCard
                    label="Revenue"
                    value={`€${stats.total_revenue_usd.toFixed(2)}`}
                    subValue="Subscriptions + Commissions"
                    icon={TrendingUp}
                    colorClass="text-brand"
                />
                <MetricCard
                    label="Gross Profit"
                    value={`€${stats.gross_profit.toFixed(2)}`}
                    subValue={`${marginPercent.toFixed(1)}% margin`}
                    icon={TrendingUp}
                    colorClass={marginColor}
                />
                <MetricCard
                    label="Total Calls"
                    value={stats.total_calls.toLocaleString()}
                    subValue={`${stats.total_tokens.toLocaleString()} tokens`}
                    icon={Activity}
                />
            </div>

            {/* Usage by Provider */}
            <div className="card p-4">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Usage by Provider
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(stats.usage_by_provider || {}).map(([provider, data]) => (
                        <div key={provider} className="p-3 bg-muted/50 rounded-xl">
                            <p className="font-medium text-sm text-foreground">{provider}</p>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                <span>{data.calls.toLocaleString()} calls</span>
                                <span className="font-mono text-brand">€{data.cost.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {Object.keys(stats.usage_by_provider || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">No usage data yet</p>
                    )}
                </div>
            </div>

            {/* Usage by Model */}
            <div className="card p-4">
                <h3 className="font-semibold text-sm mb-4">Usage by Model</h3>
                <div className="space-y-2">
                    {Object.entries(stats.usage_by_model || {}).map(([model, data]) => (
                        <div key={model} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <span className="text-sm font-mono text-foreground">{model}</span>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>{data.calls.toLocaleString()} calls</span>
                                <span>{data.tokens.toLocaleString()} tokens</span>
                            </div>
                        </div>
                    ))}
                    {Object.keys(stats.usage_by_model || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground">No usage data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
