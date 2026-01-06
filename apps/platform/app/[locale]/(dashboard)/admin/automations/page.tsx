'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    icon: string;
    trigger_event: string;
    actions: Array<{ type: string; config: Record<string, any> }>;
    is_active: boolean;
    is_system_template: boolean;
    organization_id?: string | null;
}

const TRIGGER_LABELS: Record<string, string> = {
    FORM_SUBMISSION_COMPLETED: '📋 Form Submitted',
    PAYMENT_SUCCEEDED: '💳 Payment OK',
    PAYMENT_FAILED: '❌ Payment Failed',
    BOOKING_CONFIRMED: '✅ Booking Confirmed',
    JOURNEY_STAGE_TIMEOUT: '⏰ Stage Timeout',
    RISK_DETECTED_IN_NOTE: '⚠️ Risk Detected',
};

const ICON_MAP: Record<string, string> = {
    ShieldAlert: '🛡️', Banknote: '💸', HeartHandshake: '❤️',
    Bell: '🔔', Mail: '📧', Clock: '⏰', AlertTriangle: '⚠️',
};

const ACTION_LABELS: Record<string, string> = {
    send_email: '📧 Email',
    update_journey_status: '🔄 Journey',
    block_patient: '🚫 Block',
    notify_therapist: '🔔 Notify',
};

/**
 * Automations (Agents) section page
 */
export default function AutomationsPage() {
    const [automations, setAutomations] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'system' | 'org'>('all');

    useEffect(() => {
        loadAutomations();
    }, []);

    async function loadAutomations() {
        try {
            const response = await fetch(`${API_URL}/automations/marketplace`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setAutomations(data.templates || []);
            }
        } catch (err) {
            console.error('Failed to load automations');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />;
    }

    const filtered = automations.filter(a => 
        filter === 'all' || (filter === 'system' ? a.is_system_template : !a.is_system_template)
    );

    return (
        <section className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted">
                <h2 className="text-lg font-semibold text-foreground">System Automations</h2>
                <p className="text-sm text-foreground/60">Playbook templates available in the marketplace</p>
            </div>

            <div className="px-6 py-3 border-b border-border flex gap-2">
                <span className="text-sm text-foreground/60 mr-2">Filter:</span>
                {(['all', 'system', 'org'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filter === f
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground/70 hover:bg-muted'
                        }`}
                    >
                        {f === 'all' ? 'All' : f === 'system' ? '🌐 System' : '🏢 Org'}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Playbook</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Trigger</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Actions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Scope</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((rule) => (
                            <tr key={rule.id} className="hover:bg-accent">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{ICON_MAP[rule.icon] || '🤖'}</span>
                                        <div>
                                            <p className="font-medium text-foreground">{rule.name}</p>
                                            <p className="text-sm text-foreground/60 max-w-xs truncate">{rule.description}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        {TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(rule.actions || []).map((action, idx) => (
                                            <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                {ACTION_LABELS[action.type] || action.type}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm ${rule.is_system_template ? 'text-purple-600 font-medium' : 'text-foreground/70'}`}>
                                        {rule.is_system_template ? '🌐 System' : '🏢 Org'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        rule.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground/60'
                                    }`}>
                                        {rule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && (
                <div className="text-center py-12 text-foreground/60">
                    No automation templates found.
                </div>
            )}
        </section>
    );
}
