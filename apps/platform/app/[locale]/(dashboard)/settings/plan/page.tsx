'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface Credits {
    tier: string;
    monthly_quota: number;
    used_this_month: number;
    purchased: number;
    available: number;
}

export default function PlanPage() {
    const t = useTranslations('Settings');
    const [loading, setLoading] = useState(true);
    const [credits, setCredits] = useState<Credits | null>(null);

    useEffect(() => {
        loadCredits();
    }, []);

    async function loadCredits() {
        try {
            const data = await api.user.getCredits();
            setCredits(data);
        } catch (err) {
            console.error('Failed to load credits:', err);
        } finally {
            setLoading(false);
        }
    }

    const tierConfig = {
        BUILDER: { color: 'bg-muted text-foreground', label: 'Builder', icon: '🆓' },
        PRO: { color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white', label: 'Pro', icon: '⭐' },
        CENTER: { color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white', label: 'Center', icon: '🏢' },
    };

    const currentTier = credits?.tier ? tierConfig[credits.tier as keyof typeof tierConfig] || tierConfig.BUILDER : tierConfig.BUILDER;
    const creditsPercentUsed = credits ? (credits.used_this_month / credits.monthly_quota) * 100 : 0;

    if (loading) return <div className="p-8 text-center text-foreground/60">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-white" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">{t('subscription') || 'Suscripción'}</h2>
                                <p className="text-purple-200 text-sm">AI Credits & Plan</p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm ${currentTier.color}`}>
                            {currentTier.icon} {currentTier.label}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Credits Display */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-3">
                            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                {credits?.available || 0}
                            </span>
                        </div>
                        <p className="text-foreground/70 font-medium">{t('creditsAvailable') || 'Créditos Disponibles'}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex justify-between text-sm text-foreground/60 mb-2">
                            <span>{t('creditsUsed') || 'Usados este mes'}</span>
                            <span>{credits?.used_this_month || 0} / {credits?.monthly_quota || 0}</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(creditsPercentUsed, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-xl text-center">
                            <p className="text-2xl font-bold text-foreground">{credits?.monthly_quota || 0}</p>
                            <p className="text-xs text-foreground/60">{t('creditsQuota') || 'Cuota Mensual'}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-xl text-center">
                            <p className="text-2xl font-bold text-emerald-600">{credits?.purchased || 0}</p>
                            <p className="text-xs text-foreground/60">{t('creditsPurchased') || 'Comprados'}</p>
                        </div>
                    </div>

                    {credits?.tier === 'BUILDER' && (
                        <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-200">
                            ⭐ {t('upgradePlan') || 'Actualizar a Pro'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
