'use client';

import { useEffect, useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

import { API_URL } from '@/lib/api';

interface UsageData {
    active_patients: number;
    patient_limit: number;
    patient_percent: number;
    ai_credits_used: number;
    ai_credits_limit: number;
    ai_percent: number;
    tier: string;
}

interface PlanUsageWidgetProps {
    compact?: boolean;
}

const TIER_LABELS: Record<string, string> = {
    BUILDER: 'Builder',
    PRO: 'Pro',
    CENTER: 'Center',
};

export default function PlanUsageWidget({ compact = false }: PlanUsageWidgetProps) {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsage() {
            try {
                const res = await fetch(`${API_URL}/auth/me/usage`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    // Normalize the data structure
                    setUsage({
                        active_patients: data.active_patients || 0,
                        patient_limit: data.limit || data.patient_limit || 10,
                        patient_percent: data.usage_percent || data.patient_percent || 0,
                        ai_credits_used: data.ai_credits_used || 0,
                        ai_credits_limit: data.ai_credits_limit || 100,
                        ai_percent: data.ai_percent || 0,
                        tier: data.tier || 'BUILDER',
                    });
                }
            } catch (err) {
                console.error('Failed to fetch usage:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsage();
    }, []);

    if (loading || !usage) {
        if (compact) {
            return (
                <div className="mt-1 space-y-1 animate-pulse">
                    <div className="h-1.5 bg-slate-200 rounded w-full"></div>
                    <div className="h-1.5 bg-slate-200 rounded w-full"></div>
                </div>
            );
        }
        return (
            <div className="p-3 bg-slate-50 border-t border-border">
                <div className="animate-pulse">
                    <div className="h-2 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    // Bar color function
    const getBarColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    // Compact mode: 2 mini bars side by side
    if (compact) {
        return (
            <div className="mt-2 space-y-1.5">
                {/* Patients bar */}
                <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getBarColor(usage.patient_percent)} transition-all`}
                            style={{ width: `${Math.min(usage.patient_percent, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right">
                        {usage.active_patients}/{usage.patient_limit}
                    </span>
                </div>

                {/* AI credits bar */}
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getBarColor(usage.ai_percent)} transition-all`}
                            style={{ width: `${Math.min(usage.ai_percent, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-8 text-right">
                        {usage.ai_credits_used}/{usage.ai_credits_limit}
                    </span>
                </div>
            </div>
        );
    }

    // Full mode (for settings page, etc.)
    return (
        <div className="p-3 bg-slate-50 border-t border-border">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground/60">
                    {TIER_LABELS[usage.tier] || usage.tier}
                </span>
                <span className="text-xs text-slate-400">
                    {usage.active_patients}/{usage.patient_limit}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getBarColor(usage.patient_percent)} transition-all duration-500`}
                    style={{ width: `${Math.min(usage.patient_percent, 100)}%` }}
                />
            </div>

            {/* Upgrade CTA for BUILDER tier */}
            {usage.tier === 'BUILDER' && usage.patient_percent >= 50 && (
                <Link
                    href="/settings/plan"
                    className="mt-2 flex items-center gap-1 text-xs text-fuchsia-600 hover:text-fuchsia-700 font-medium"
                >
                    <Sparkles className="w-3 h-3" />
                    Ampliar plan
                </Link>
            )}
        </div>
    );
}
