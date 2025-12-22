'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface OrgCredits {
    tier: string;
    monthly_quota: number;
    used_this_month: number;
    purchased: number;
    available: number;
}

export default function CreditsDisplay() {
    const [credits, setCredits] = useState<OrgCredits | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCredits();
    }, []);

    async function loadCredits() {
        try {
            const data = await api.user.getCredits();
            setCredits(data);
        } catch (err) {
            // Silently fail - not critical for the UI
            console.error('Failed to load credits:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !credits) {
        return null; // Don't show if loading or no data
    }

    // Color based on available credits
    const isLow = credits.available <= 10;
    const bgColor = isLow ? 'bg-amber-50' : 'bg-purple-50';
    const textColor = isLow ? 'text-amber-700' : 'text-purple-700';
    const icon = isLow ? '⚠️' : '💎';

    return (
        <div
            className={`flex items-center gap-1.5 px-3 py-1.5 ${bgColor} ${textColor} rounded-lg text-sm font-medium cursor-help transition-colors`}
            title={`Monthly: ${credits.used_this_month}/${credits.monthly_quota} used | Purchased: ${credits.purchased} | Tier: ${credits.tier.toUpperCase()}`}
        >
            <span>{icon}</span>
            <span>{credits.available}</span>
        </div>
    );
}
