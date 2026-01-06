'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AdminOrganization {
    id: string;
    name: string;
    tier: string;
    terminology_preference: string;
    patient_count: number;
    ai_usage_tokens: number;
    ai_usage_cost_eur: number;
}

const TIERS = ['BUILDER', 'PRO', 'CENTER'];
const TERMINOLOGY_OPTIONS = ['CLIENT', 'PATIENT', 'CONSULTANT'] as const;

const TIER_COLORS: Record<string, string> = {
    BUILDER: 'bg-muted border-border text-foreground',
    PRO: 'bg-purple-100 border-purple-300 text-purple-700',
    CENTER: 'bg-amber-100 border-amber-300 text-amber-700',
};

const TIER_PRICES: Record<string, number> = { BUILDER: 0, PRO: 49, CENTER: 149 };

/**
 * Organizations section page
 */
export default function OrgsPage() {
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrgs();
    }, []);

    async function loadOrgs() {
        try {
            const orgsData = await api.admin.listOrganizations();
            setOrganizations(orgsData);
        } catch (err) {
            console.error('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    }

    async function handleChangeTier(orgId: string, newTier: string) {
        await api.admin.updateOrganization(orgId, { tier: newTier });
        loadOrgs();
    }

    async function handleChangeTerminology(orgId: string, newTerm: string) {
        await api.admin.updateOrganization(orgId, { terminology_preference: newTerm });
        loadOrgs();
    }

    const formatTokens = (n: number): string => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return String(n);
    };

    // Note: ai_usage_cost_eur actually contains KC value (legacy naming)
    // Real EUR cost = KC / 1000
    const getCostSemaphore = (kcValue: number, tier: string): string => {
        const eurCost = kcValue / 1000;
        const monthlyPrice = TIER_PRICES[tier] || 0;
        if (monthlyPrice === 0) return '🔴';
        const dayOfMonth = new Date().getDate();
        const proratedBudget = (monthlyPrice / 30) * dayOfMonth;
        const ratio = eurCost / proratedBudget;
        if (ratio > 1) return '🔴';
        if (ratio >= 0.5) return '🟠';
        if (ratio >= 0.1) return '🟡';
        return '🟢';
    };

    // KC value displayed directly (field already in KC despite name)
    const formatKC = (kcValue: number): string => {
        if (kcValue >= 1000) return `${Math.round(kcValue / 1000)}K`;
        return Math.round(kcValue).toString();
    };

    if (loading) {
        return <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />;
    }

    return (
        <section className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted">
                <h2 className="text-lg font-semibold text-foreground">Organizations</h2>
                <p className="text-sm text-foreground/60">Manage organization tiers and credits</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Tier</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Term</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-foreground/60 uppercase">Patients</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">€ EUR</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">Tokens</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">KC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {organizations.map((org) => (
                            <tr key={org.id} className="hover:bg-accent/50">
                                <td className="px-4 py-4 text-sm font-medium text-foreground">{org.name}</td>
                                <td className="px-4 py-4">
                                    <select
                                        value={org.tier}
                                        onChange={(e) => handleChangeTier(org.id, e.target.value)}
                                        className={`text-sm px-2 py-1 rounded border ${TIER_COLORS[org.tier]}`}
                                    >
                                        {TIERS.map((tier) => (
                                            <option key={tier} value={tier}>{tier}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-4">
                                    <select
                                        value={org.terminology_preference || 'CLIENT'}
                                        onChange={(e) => handleChangeTerminology(org.id, e.target.value)}
                                        className="text-sm px-2 py-1 rounded border border-border bg-card text-foreground"
                                    >
                                        {TERMINOLOGY_OPTIONS.map((term) => (
                                            <option key={term} value={term}>{term}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-4 text-sm text-foreground/70 text-center">{org.patient_count}</td>
                                <td className="px-4 py-4 text-right">
                                    <span className="font-mono text-sm text-foreground whitespace-nowrap">
                                        {(org.ai_usage_cost_eur / 1000).toFixed(4).replace('.', ',')}€ {getCostSemaphore(org.ai_usage_cost_eur, org.tier)}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="font-mono text-sm text-muted-foreground">
                                        {formatTokens(org.ai_usage_tokens)}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className="font-mono text-sm text-brand font-medium">
                                        {formatKC(org.ai_usage_cost_eur)} KC
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

