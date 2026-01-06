'use client';

import { useState, useEffect } from 'react';
import { History, Gift, Clock, Coins } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface RedemptionItem {
    id: string;
    reward_id: string;
    reward_name: string;
    karma_cost: number;
    value_granted: number;
    created_at: string;
}

interface Props {
    className?: string;
}

export function RedemptionHistory({ className = '' }: Props) {
    const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            try {
                const res = await fetch(`${API_URL}/growth/redemptions`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setRedemptions(data.redemptions || []);
                } else {
                    setError('Failed to load history');
                }
            } catch (err) {
                setError('Connection error');
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, []);

    if (loading) {
        return (
            <div className={`card p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Historial de Canjes</h3>
                </div>
                <div className="animate-pulse space-y-3">
                    <div className="h-12 bg-muted rounded-lg"></div>
                    <div className="h-12 bg-muted rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`card p-6 ${className}`}>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    if (redemptions.length === 0) {
        return (
            <div className={`card p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Historial de Canjes</h3>
                </div>
                <div className="text-center py-8">
                    <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                        Aún no has canjeado ninguna recompensa
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`card p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Historial de Canjes</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                    {redemptions.length} canje{redemptions.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {redemptions.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground text-sm">
                                    {item.reward_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                                <Coins className="w-4 h-4" />
                                -{item.karma_cost}
                            </div>
                            {item.value_granted > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    +{item.value_granted.toLocaleString()} {item.reward_id === 'ai-tokens' ? 'KC' : 'slots'}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
