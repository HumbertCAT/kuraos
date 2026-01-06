'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Activity, Brain, Gift, Lock, Loader2, Check } from 'lucide-react';

interface Reward {
    id: string;
    titleKey: string;
    descriptionKey: string;
    cost: number;
    icon: React.ElementType;
    tier: 'BUILDER' | 'PRO' | 'CENTER';
}

interface RewardsCatalogProps {
    currentTier: 'BUILDER' | 'PRO' | 'CENTER';
    currentKarma: number;
    onRedeem?: (rewardId: string) => void;
}

// Tier-based rewards catalog with i18n keys
const REWARDS: Reward[] = [
    {
        id: 'extra-patient',
        titleKey: 'rewardExtraPatient',
        descriptionKey: 'rewardExtraPatientDesc',
        cost: 100,
        icon: Users,
        tier: 'BUILDER'
    },
    {
        id: 'sentinel-pulse',
        titleKey: 'rewardSentinelPulse',
        descriptionKey: 'rewardSentinelPulseDesc',
        cost: 500,
        icon: Activity,
        tier: 'PRO'
    },
    {
        id: 'ai-tokens',
        titleKey: 'rewardAiTokens',
        descriptionKey: 'rewardAiTokensDesc',
        cost: 300,
        icon: Brain,
        tier: 'CENTER'
    }
];

/**
 * RewardsCatalog - Part of Zone C of the Growth Station
 * 
 * Tier-based rewards that can be redeemed with karma points.
 * @since v1.1.18 - The Mycelium
 */
export function RewardsCatalog({ currentTier, currentKarma, onRedeem }: RewardsCatalogProps) {
    const t = useTranslations('Settings.referrals');

    // Filter rewards for current tier (show all but highlight tier-specific)
    const getAvailableRewards = () => {
        // For now, show the reward specific to the user's tier
        return REWARDS.filter(r => r.tier === currentTier);
    };

    const [redeeming, setRedeeming] = useState<string | null>(null);
    const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
    const [redeemError, setRedeemError] = useState<string | null>(null);

    const handleRedeem = async (reward: Reward) => {
        setRedeeming(reward.id);
        setRedeemError(null);
        setRedeemSuccess(null);

        try {
            const { api } = await import('@/lib/api');
            const result = await api.growth.redeem(reward.id);

            if (result.success) {
                setRedeemSuccess(result.message);
                // Optionally trigger a page refresh or callback
                if (onRedeem) onRedeem(reward.id);
            }
        } catch (err: any) {
            setRedeemError(err.message || 'Failed to redeem reward');
        } finally {
            setRedeeming(null);
        }
    };

    const availableRewards = getAvailableRewards();

    return (
        <div className="space-y-4">
            <h3 className="type-h4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand" />
                {t('rewardsTitle')}
            </h3>

            {/* Success/Error Feedback */}
            {redeemSuccess && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">{redeemSuccess}</span>
                </div>
            )}
            {redeemError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <span className="text-sm text-destructive">{redeemError}</span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRewards.map(reward => {
                    const canAfford = currentKarma >= reward.cost;
                    const Icon = reward.icon;

                    return (
                        <div
                            key={reward.id}
                            className={`
                relative bg-card border rounded-xl p-6 transition-all
                ${canAfford ? 'border-brand/30 hover:border-brand/50' : 'border-border opacity-75'}
              `}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`p-3 rounded-lg ${canAfford ? 'bg-brand/10' : 'bg-muted'}`}>
                                    <Icon className={`w-6 h-6 ${canAfford ? 'text-brand' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-foreground">{t(reward.titleKey)}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{t(reward.descriptionKey)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                <span className="font-mono text-lg font-bold text-warning">
                                    {reward.cost} <span className="text-xs text-muted-foreground">KARMA</span>
                                </span>
                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={!canAfford || redeeming === reward.id}
                                    className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95
                    ${canAfford && redeeming !== reward.id
                                            ? 'bg-brand text-white hover:bg-brand/90'
                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }
                  `}
                                >
                                    {redeeming === reward.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : canAfford ? (
                                        t('redeem')
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            {reward.cost - currentKarma} {t('karmaMore')}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Coming Soon rewards for other tiers */}
                {REWARDS.filter(r => r.tier !== currentTier).map(reward => {
                    const Icon = reward.icon;
                    return (
                        <div
                            key={reward.id}
                            className="relative bg-card/50 border border-border/50 rounded-xl p-6 opacity-50"
                        >
                            <div className="absolute top-3 right-3">
                                <span className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded-full">
                                    {reward.tier} {t('tierLabel')}
                                </span>
                            </div>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <Icon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-muted-foreground">{t(reward.titleKey)}</h4>
                                    <p className="text-sm text-muted-foreground/70 mt-1">{t(reward.descriptionKey)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                                <span className="font-mono text-lg font-bold text-muted-foreground">
                                    {reward.cost} KARMA
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {t('comingSoon')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
