'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import {
    KarmaVaultCard,
    ViralShareModule,
    RewardsCatalog,
    ReferralHistoryTable
} from '@/components/referrals';

interface ReferredOrg {
    id: string;
    name: string;
    joined_at: string;
    status: string;
    karma_earned: number;
}

interface ReferralStats {
    total_referred: number;
    total_active: number;
    current_karma: number;
    referral_code: string;
    referral_history: ReferredOrg[];
}

/**
 * The Growth Station - Referrals Management Page
 * 
 * Hub for managing viral growth: karma, rewards, and referral history.
 * @since v1.1.18 - The Mycelium
 */
export default function ReferralsPage() {
    const t = useTranslations('Settings.referrals');
    const { organization } = useAuth();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/growth/stats');
            setStats(response);
        } catch (err: any) {
            console.error('Error loading referral stats:', err);
            setError(err.message || 'Failed to load referral stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse bg-muted/50 h-48 rounded-xl" />
                <div className="animate-pulse bg-muted/50 h-32 rounded-xl" />
                <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
                <p className="text-destructive">{error}</p>
                <button
                    onClick={loadStats}
                    className="mt-4 px-4 py-2 bg-destructive text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    const karma = stats?.current_karma || organization?.karma_score || 0;
    const referralCode = stats?.referral_code || organization?.referral_code || '';
    const tier = (organization?.tier as 'BUILDER' | 'PRO' | 'CENTER') || 'BUILDER';

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
            </div>

            {/* Zone A: The Vault (Karma Display) */}
            <KarmaVaultCard karma={karma} nextRewardCost={100} />

            {/* Zone B: Share Tools */}
            <ViralShareModule referralCode={referralCode} />

            {/* Zone C: The Ledger */}
            <div className="space-y-8 pt-4">
                {/* Referral History */}
                <ReferralHistoryTable
                    history={stats?.referral_history || []}
                    totalReferred={stats?.total_referred || 0}
                    totalActive={stats?.total_active || 0}
                />

                {/* Rewards Catalog */}
                <RewardsCatalog
                    currentTier={tier}
                    currentKarma={karma}
                />
            </div>
        </div>
    );
}
