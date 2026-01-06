'use client';

/**
 * Kura Credits Widget
 * 
 * Displays real-time KC (Kura Credits) balance and usage for the dashboard.
 * v1.3.2: Part of AletheIA Awakens credit economy system.
 */

import { useState, useEffect } from 'react';
import { Coins, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface CreditsBalance {
    credits_used: number;
    credits_limit: number;
    usage_percent: number;
    tier: string;
    is_low_balance: boolean;
}

export function KuraCreditsWidget() {
    const [balance, setBalance] = useState<CreditsBalance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadBalance() {
            try {
                const data = await api.dashboard.getCreditsBalance();
                setBalance(data);
            } catch (error) {
                console.error('[KuraCreditsWidget] Failed to load balance:', error);
            } finally {
                setLoading(false);
            }
        }
        loadBalance();
    }, []);

    if (loading) {
        return (
            <div className="card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-6 bg-muted rounded w-2/3" />
            </div>
        );
    }

    if (!balance) {
        return null;
    }

    const { credits_used, credits_limit, usage_percent, tier, is_low_balance } = balance;

    // Format KC with proper separators (no decimals for K)
    const formatKC = (value: number) => {
        if (value >= 1000) {
            return `${Math.round(value / 1000)}K`;
        }
        return value.toFixed(0);
    };

    return (
        <div className={`card p-4 ${is_low_balance ? 'border-warning/50 bg-warning/5' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${is_low_balance ? 'bg-warning/10' : 'bg-brand/10'}`}>
                        <Coins className={`w-4 h-4 ${is_low_balance ? 'text-warning' : 'text-brand'}`} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Kura Credits
                    </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-medium">
                    {tier}
                </span>
            </div>

            {/* Balance Display */}
            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-foreground">
                        {formatKC(credits_used)} <span className="text-sm font-normal text-muted-foreground">KC</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        ({(credits_used / 1000).toFixed(2)}€)
                    </p>
                </div>
                <p className="text-xs text-muted-foreground">
                    de {formatKC(credits_limit)} KC ({(credits_limit / 1000).toFixed(0)}€) este mes
                </p>
            </div>

            {/* Usage Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${usage_percent > 90 ? 'bg-destructive' :
                        usage_percent > 80 ? 'bg-warning' :
                            'bg-brand'
                        }`}
                    style={{ width: `${Math.min(usage_percent, 100)}%` }}
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{usage_percent.toFixed(0)}% usado</span>

                {is_low_balance ? (
                    <div className="flex items-center gap-1 text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Balance bajo</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-success/70">
                        <TrendingUp className="w-3 h-3" />
                        <span>Saludable</span>
                    </div>
                )}
            </div>
        </div>
    );
}
