'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface KarmaVaultCardProps {
    karma: number;
    nextRewardCost?: number;
}

/**
 * KarmaVaultCard - Zone A of the Growth Station
 * 
 * Hero display of karma score with progress to next reward.
 * @since v1.1.18 - The Mycelium
 */
export function KarmaVaultCard({ karma, nextRewardCost = 100 }: KarmaVaultCardProps) {
    const t = useTranslations('Settings.referrals');

    const progress = Math.min((karma % nextRewardCost) / nextRewardCost * 100, 100);
    const remaining = nextRewardCost - (karma % nextRewardCost);
    const rewardsEarned = Math.floor(karma / nextRewardCost);

    return (
        <div className="bg-gradient-to-br from-warning/10 via-brand/5 to-transparent border border-warning/20 rounded-xl p-8 shadow-[0_0_60px_-15px_rgba(0,0,0,0.15),0_0_25px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-6 mb-6">
                <div className="p-4 bg-warning/10 rounded-xl">
                    <Sparkles className="w-10 h-10 text-warning" />
                </div>
                <div>
                    <p className="text-5xl font-bold font-mono text-warning">{karma.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">
                        {t('karmaPoints')}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{t('nextReward', { points: remaining })}</span>
                    <span className="font-mono">{karma % nextRewardCost}/{nextRewardCost}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-warning to-brand transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {rewardsEarned > 0 && (
                    <p className="text-xs text-warning/70 mt-2">
                        🎁 {rewardsEarned} recompensa{rewardsEarned > 1 ? 's' : ''} disponible{rewardsEarned > 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </div>
    );
}
