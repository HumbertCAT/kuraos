'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import { Settings2, Users, Cpu, DollarSign, Save, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CyberButton } from '@/components/ui/CyberButton';
import PageHeader from '@/components/PageHeader';

interface SystemSetting {
    key: string;
    value: any;
    description: string | null;
}

type TierType = 'BUILDER' | 'PRO' | 'CENTER';

// Static fee config (env vars, not in DB)
const TIER_STATIC_CONFIG: Record<TierType, { fee: string; price: string }> = {
    BUILDER: { fee: '5%', price: '$0/month (Free)' },
    PRO: { fee: '2%', price: '$49/month' },
    CENTER: { fee: '1%', price: '$149/month' },
};

const TIER_INFO: Record<TierType, { icon: string; color: string; gradient: string }> = {
    BUILDER: {
        icon: '🛠️',
        color: 'text-muted-foreground',
        gradient: 'from-slate-500 to-slate-600',
    },
    PRO: {
        icon: '⚡',
        color: 'text-purple-500',
        gradient: 'from-purple-500 to-purple-600',
    },
    CENTER: {
        icon: '🏢',
        color: 'text-amber-500',
        gradient: 'from-amber-500 to-amber-600',
    },
};

export default function TiersPage() {
    const t = useTranslations('Admin');

    const [activeTier, setActiveTier] = useState<TierType>('BUILDER');
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Editable values for current tier
    const [usersLimit, setUsersLimit] = useState<number>(3);
    const [aiCredits, setAiCredits] = useState<number>(100);
    const [aiSpendLimit, setAiSpendLimit] = useState<number>(10);

    useEffect(() => {
        loadSettings();
    }, []);

    // When tier or settings change, update form values
    useEffect(() => {
        if (settings.length > 0) {
            const tierLimits = getSettingsForTier(activeTier);
            setUsersLimit(tierLimits.usersLimit);
            setAiCredits(tierLimits.aiCredits);
            setAiSpendLimit(tierLimits.aiSpendLimit);
        }
    }, [activeTier, settings]);

    async function loadSettings() {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/settings`, { credentials: 'include' });
            if (!response.ok) throw new Error('Access denied');
            const data = await response.json();
            setSettings(data);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    }

    function getSettingsForTier(tier: TierType) {
        const findValue = (key: string, defaultValue: number) => {
            const setting = settings.find((s) => s.key === key);
            return setting ? Number(setting.value) : defaultValue;
        };

        return {
            usersLimit: findValue(`TIER_USERS_LIMIT_${tier}`, tier === 'BUILDER' ? 3 : tier === 'PRO' ? 50 : 150),
            aiCredits: findValue(`TIER_AI_CREDITS_${tier}`, tier === 'BUILDER' ? 100 : tier === 'PRO' ? 500 : 2000),
            aiSpendLimit: findValue(`TIER_AI_SPEND_LIMIT_${tier}`, tier === 'BUILDER' ? 10 : tier === 'PRO' ? 50 : 200),
        };
    }

    async function saveSetting(key: string, value: number) {
        const response = await fetch(`${API_URL}/admin/settings/${key}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ value }),
        });
        if (!response.ok) throw new Error(`Failed to update ${key}`);
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);

        try {
            await Promise.all([
                saveSetting(`TIER_USERS_LIMIT_${activeTier}`, usersLimit),
                saveSetting(`TIER_AI_CREDITS_${activeTier}`, aiCredits),
                saveSetting(`TIER_AI_SPEND_LIMIT_${activeTier}`, aiSpendLimit),
            ]);

            setMessage({ type: 'success', text: `${activeTier} tier saved successfully!` });
            await loadSettings(); // Refresh
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
        );
    }

    const tierInfo = TIER_INFO[activeTier];
    const staticConfig = TIER_STATIC_CONFIG[activeTier];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin?tab=settings"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </Link>
                <PageHeader
                    icon={Settings2}
                    kicker="ADMIN"
                    title="Tier Configuration"
                    subtitle="Configure limits and features per subscription tier"
                />
            </div>

            {/* Messages */}
            {message && (
                <div
                    className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}
                >
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Tier Tabs */}
            <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl w-fit">
                {(['BUILDER', 'PRO', 'CENTER'] as TierType[]).map((tier) => {
                    const info = TIER_INFO[tier];
                    const isActive = activeTier === tier;
                    return (
                        <button
                            key={tier}
                            onClick={() => setActiveTier(tier)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                    ? `bg-gradient-to-r ${info.gradient} text-white shadow-lg`
                                    : 'text-foreground/70 hover:text-foreground hover:bg-card'
                                }`}
                        >
                            <span className="text-lg">{info.icon}</span>
                            {tier}
                        </button>
                    );
                })}
            </div>

            {/* Config Cards */}
            <div className="grid gap-6">
                {/* Static Config Card (Read Only) */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            📉 Static Config
                            <span className="text-xs text-muted-foreground font-normal">(Backend / Env Vars)</span>
                        </h3>
                    </div>
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Platform Fee</label>
                            <div className="bg-muted px-4 py-3 rounded-lg font-mono text-lg text-foreground">
                                {staticConfig.fee}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Set in <code className="text-brand">TIER_FEE_{activeTier}</code> env var
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Subscription Price</label>
                            <div className="bg-muted px-4 py-3 rounded-lg font-mono text-lg text-foreground">
                                {staticConfig.price}
                            </div>
                            <p className="text-xs text-muted-foreground">Managed in Stripe Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Limits Card (Editable) */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className={`px-6 py-4 border-b border-border bg-gradient-to-r ${tierInfo.gradient}`}>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            🎛️ Dynamic Limits
                            <span className="text-xs text-white/70 font-normal">(Editable via Admin)</span>
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Max Patients */}
                        <div className="grid md:grid-cols-[200px_1fr] gap-4 items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Max Patients</label>
                                    <p className="text-xs text-muted-foreground">Active patient slots</p>
                                </div>
                            </div>
                            <input
                                type="number"
                                value={usersLimit}
                                onChange={(e) => setUsersLimit(Number(e.target.value))}
                                className="w-full md:w-32 px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-lg focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                                min={1}
                            />
                        </div>

                        {/* AI Credits */}
                        <div className="grid md:grid-cols-[200px_1fr] gap-4 items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Cpu className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">AI Credits</label>
                                    <p className="text-xs text-muted-foreground">Monthly allocation</p>
                                </div>
                            </div>
                            <input
                                type="number"
                                value={aiCredits}
                                onChange={(e) => setAiCredits(Number(e.target.value))}
                                className="w-full md:w-32 px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-lg focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                                min={0}
                            />
                        </div>

                        {/* AI Spend Limit */}
                        <div className="grid md:grid-cols-[200px_1fr] gap-4 items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">AI Spend Limit</label>
                                    <p className="text-xs text-muted-foreground">Monthly USD cap</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    value={aiSpendLimit}
                                    onChange={(e) => setAiSpendLimit(Number(e.target.value))}
                                    className="w-full md:w-32 px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-lg focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none"
                                    min={0}
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-border flex justify-end">
                            <CyberButton onClick={handleSave} disabled={saving} variant="default">
                                {saving ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save {activeTier} Limits
                                    </>
                                )}
                            </CyberButton>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-muted/30 border border-border rounded-xl p-6">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        💡 How it works
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-brand">•</span>
                            <span>
                                <strong>Static Config</strong> (fees, prices) are set via environment variables.
                                Changes require a backend redeploy.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand">•</span>
                            <span>
                                <strong>Dynamic Limits</strong> are stored in the database and take effect immediately.
                                Marketing can adjust these without engineering.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-brand">•</span>
                            <span>
                                Patient limits are enforced when creating new patients.
                                AI limits are checked before each AI call.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
