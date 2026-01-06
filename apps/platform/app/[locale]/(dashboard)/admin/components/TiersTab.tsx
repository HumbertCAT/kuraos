'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';

interface SystemSetting {
    key: string;
    value: any;
    description: string | null;
}

interface TiersTabProps {
    settings: SystemSetting[];
    onSettingsChange: () => void;
}

type TierType = 'BUILDER' | 'PRO' | 'CENTER';

const TIER_STATIC_CONFIG: Record<TierType, { fee: string; price: string }> = {
    BUILDER: { fee: '5%', price: '$0/month (Free)' },
    PRO: { fee: '2%', price: '$49/month' },
    CENTER: { fee: '1%', price: '$149/month' },
};

const TIER_INFO: Record<TierType, { icon: string; gradient: string }> = {
    BUILDER: { icon: '🛠️', gradient: 'from-slate-500 to-slate-600' },
    PRO: { icon: '⚡', gradient: 'from-purple-500 to-purple-600' },
    CENTER: { icon: '🏢', gradient: 'from-amber-500 to-amber-600' },
};

interface TiersTabProps {
    settings: SystemSetting[];
    onSettingsChange: () => void;
}

function TiersTab({ settings, onSettingsChange }: TiersTabProps) {
    const [activeTier, setActiveTier] = useState<TierType>('BUILDER');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Editable values
    const [usersLimit, setUsersLimit] = useState<number>(3);
    const [aiCredits, setAiCredits] = useState<number>(100);
    const [aiSpendLimit, setAiSpendLimit] = useState<number>(10);

    // When tier or settings change, update form values
    useEffect(() => {
        if (settings.length > 0) {
            const findValue = (key: string, defaultValue: number) => {
                const setting = settings.find((s) => s.key === key);
                return setting ? Number(setting.value) : defaultValue;
            };

            const defaults = {
                BUILDER: { users: 3, credits: 100, spend: 10 },
                PRO: { users: 50, credits: 500, spend: 50 },
                CENTER: { users: 150, credits: 2000, spend: 200 },
            };

            setUsersLimit(findValue(`TIER_USERS_LIMIT_${activeTier}`, defaults[activeTier].users));
            setAiCredits(findValue(`TIER_AI_CREDITS_${activeTier}`, defaults[activeTier].credits));
            setAiSpendLimit(findValue(`TIER_AI_SPEND_LIMIT_${activeTier}`, defaults[activeTier].spend));
        }
    }, [activeTier, settings]);

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

            setMessage({ type: 'success', text: `${activeTier} tier saved!` });
            onSettingsChange();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    }

    const tierInfo = TIER_INFO[activeTier];
    const staticConfig = TIER_STATIC_CONFIG[activeTier];

    return (
        <div className="space-y-6">
            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            {/* Tier Sub-Tabs */}
            <div className="flex gap-2">
                {(['BUILDER', 'PRO', 'CENTER'] as TierType[]).map((tier) => {
                    const info = TIER_INFO[tier];
                    const isActive = activeTier === tier;
                    return (
                        <button
                            key={tier}
                            onClick={() => setActiveTier(tier)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                ? `bg-gradient-to-r ${info.gradient} text-white shadow-lg`
                                : 'bg-muted text-foreground/70 hover:text-foreground'
                                }`}
                        >
                            <span>{info.icon}</span>
                            {tier}
                        </button>
                    );
                })}
            </div>

            {/* Static Config Card */}
            <section className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground">📉 Static Config <span className="text-xs text-muted-foreground font-normal">(Backend Env Vars)</span></h3>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-muted-foreground">Platform Fee</label>
                        <div className="bg-muted px-4 py-3 rounded-lg font-mono text-lg text-foreground mt-1">{staticConfig.fee}</div>
                        <p className="text-xs text-muted-foreground mt-1">Set in <code className="text-brand">TIER_FEE_{activeTier}</code></p>
                    </div>
                    <div>
                        <label className="text-sm text-muted-foreground">Subscription Price</label>
                        <div className="bg-muted px-4 py-3 rounded-lg font-mono text-lg text-foreground mt-1">{staticConfig.price}</div>
                        <p className="text-xs text-muted-foreground mt-1">Managed in Stripe Dashboard</p>
                    </div>
                </div>
            </section>

            {/* Dynamic Limits Card */}
            <section className="card overflow-hidden">
                <div className={`px-6 py-4 border-b border-border bg-gradient-to-r ${tierInfo.gradient}`}>
                    <h3 className="font-semibold text-white">🎛️ Dynamic Limits <span className="text-xs text-white/70 font-normal">(Editable)</span></h3>
                </div>
                <div className="p-6 space-y-5">
                    {/* Max Patients */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-5 w-5 text-blue-500" /></div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Max Patients</p>
                                <p className="text-xs text-muted-foreground">Active patient slots</p>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={usersLimit}
                            onChange={(e) => setUsersLimit(Number(e.target.value))}
                            className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-center"
                            min={1}
                        />
                    </div>

                    {/* AI Credits */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg"><Cpu className="h-5 w-5 text-purple-500" /></div>
                            <div>
                                <p className="text-sm font-medium text-foreground">AI Credits</p>
                                <p className="text-xs text-muted-foreground">Monthly allocation</p>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={aiCredits}
                            onChange={(e) => setAiCredits(Number(e.target.value))}
                            className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-center"
                            min={0}
                        />
                    </div>

                    {/* AI Spend Limit */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-amber-500" /></div>
                            <div>
                                <p className="text-sm font-medium text-foreground">AI Spend Limit</p>
                                <p className="text-xs text-muted-foreground">Monthly USD cap</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">$</span>
                            <input
                                type="number"
                                value={aiSpendLimit}
                                onChange={(e) => setAiSpendLimit(Number(e.target.value))}
                                className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-center"
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <span className="animate-spin">⏳</span> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving...' : `Save ${activeTier} Limits`}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
