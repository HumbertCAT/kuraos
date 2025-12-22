'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface SystemSetting {
    key: string;
    value: any;
    description: string | null;
}

interface AdminOrganization {
    id: string;
    name: string;
    tier: string;
    ai_credits_monthly_quota: number;
    ai_credits_purchased: number;
    ai_credits_used_this_month: number;
    patient_count: number;
}

interface FormTemplate {
    id: string;
    title: string;
    description: string | null;
    risk_level: string;
    therapy_type: string;
    form_type: string;
    is_system: boolean;
    is_active: boolean;
    organization_id: string | null;
    organization_name?: string;  // For display
}

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    icon: string;
    trigger_event: string;
    conditions: Record<string, any>;
    actions: Array<{ type: string; config: Record<string, any> }>;
    is_active: boolean;
    is_system_template: boolean;
    priority: number;
    organization_id?: string | null;
    organization_name?: string;  // For display
}

const TIERS = ['BUILDER', 'PRO', 'CENTER'];

const AI_MODELS = [
    'gemini-3-pro-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

const TIER_COLORS: Record<string, string> = {
    BUILDER: 'bg-slate-100 border-slate-300 text-slate-700',
    PRO: 'bg-purple-100 border-purple-300 text-purple-700',
    CENTER: 'bg-amber-100 border-amber-300 text-amber-700',
};

const RISK_COLORS: Record<string, string> = {
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
};

const THERAPY_ICONS: Record<string, string> = {
    GENERAL: '📋',
    ASTROLOGY: '⭐',
    SOMATIC: '🧘',
    PSYCHEDELIC: '🍄',
    INTEGRATION: '🔄',
};

type TabType = 'settings' | 'organizations' | 'templates' | 'automations';

const TRIGGER_LABELS: Record<string, string> = {
    FORM_SUBMISSION_COMPLETED: '📋 Form Submitted',
    PAYMENT_SUCCEEDED: '💳 Payment OK',
    PAYMENT_FAILED: '❌ Payment Failed',
    BOOKING_CONFIRMED: '✅ Booking Confirmed',
    JOURNEY_STAGE_TIMEOUT: '⏰ Stage Timeout',
    RISK_DETECTED_IN_NOTE: '⚠️ Risk Detected',
};

export default function AdminPage() {
    const t = useTranslations('Admin');
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params.locale as string || 'en';

    // Read tab from URL query param
    const tabFromUrl = searchParams.get('tab') as TabType | null;
    const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'settings');
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [automations, setAutomations] = useState<AutomationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit states
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [addCreditsOrgId, setAddCreditsOrgId] = useState<string | null>(null);
    const [creditsAmount, setCreditsAmount] = useState(0);

    // Scope filters
    type ScopeFilter = 'all' | 'system' | 'org';
    const [templatesFilter, setTemplatesFilter] = useState<ScopeFilter>('all');
    const [automationsFilter, setAutomationsFilter] = useState<ScopeFilter>('all');

    // Helper to get org name from organizations list
    const getOrgName = (orgId: string | null | undefined): string => {
        if (!orgId) return '';
        const org = organizations.find(o => o.id === orgId);
        return org?.name || 'Unknown Org';
    };

    // Sync tab from URL
    useEffect(() => {
        if (tabFromUrl && ['settings', 'organizations', 'templates', 'automations'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [settingsData, orgsData, templatesData, automationsData] = await Promise.all([
                api.admin.listSettings(),
                api.admin.listOrganizations(),
                fetchTemplates(),
                fetchAutomations(),
            ]);
            setSettings(settingsData);
            setOrganizations(orgsData);
            setAutomations(automationsData);
            setTemplates(templatesData);
        } catch (err: any) {
            setError(err.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }

    async function fetchTemplates(): Promise<FormTemplate[]> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';
        const response = await fetch(`${API_URL}/forms/admin/templates`, { credentials: 'include' });
        if (!response.ok) return [];
        const data = await response.json();
        return data.templates || [];
    }

    async function fetchAutomations(): Promise<AutomationRule[]> {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';
        const response = await fetch(`${API_URL}/automations/marketplace`, { credentials: 'include' });
        if (!response.ok) return [];
        const data = await response.json();
        return data.templates || [];
    }

    async function handleSaveSetting(key: string) {
        try {
            let parsedValue: any = editValue;
            try {
                parsedValue = JSON.parse(editValue);
            } catch {
                // Keep as string
            }
            await api.admin.updateSetting(key, parsedValue);
            setEditingKey(null);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleChangeTier(orgId: string, newTier: string) {
        try {
            await api.admin.updateOrganization(orgId, { tier: newTier });
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleAddCredits(orgId: string) {
        if (creditsAmount <= 0) return;
        try {
            await api.admin.addCredits(orgId, creditsAmount);
            setAddCreditsOrgId(null);
            setCreditsAmount(0);
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleDeleteTemplate(id: string) {
        if (!confirm('¿Estás seguro de eliminar este template?')) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';
        try {
            const response = await fetch(`${API_URL}/forms/admin/templates/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                setTemplates(templates.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error('Error deleting template');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    <p className="font-medium">Access Denied</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: 'settings', label: 'Settings', icon: '⚙️' },
        { key: 'organizations', label: 'Organizations', icon: '🏢' },
        { key: 'templates', label: 'Form Templates', icon: '📋' },
        { key: 'automations', label: 'Automations', icon: '🤖' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-700">System Settings</h2>
                        <p className="text-sm text-slate-500">Global configuration values stored in database</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {settings.map((setting) => (
                            <div key={setting.key} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-mono text-sm font-medium text-slate-800">{setting.key}</p>
                                    <p className="text-xs text-slate-500">{setting.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {editingKey === setting.key ? (
                                        <>
                                            {setting.key === 'AI_MODEL' ? (
                                                <select
                                                    value={editValue.replace(/"/g, '')}
                                                    onChange={(e) => setEditValue(`"${e.target.value}"`)}
                                                    className="w-48 text-sm border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 bg-white"
                                                >
                                                    {AI_MODELS.map((model) => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-48 h-20 text-sm border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 bg-white"
                                                />
                                            )}
                                            <button
                                                onClick={() => handleSaveSetting(setting.key)}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingKey(null)}
                                                className="px-3 py-1 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <code className="text-sm bg-slate-100 px-3 py-1 rounded text-slate-700 max-w-xs truncate">
                                                {JSON.stringify(setting.value)}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    setEditingKey(setting.key);
                                                    setEditValue(JSON.stringify(setting.value));
                                                }}
                                                className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200"
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-700">Organizations</h2>
                        <p className="text-sm text-slate-500">Manage organization tiers and credits</p>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patients</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizations.map((org) => (
                                <tr key={org.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{org.name}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={org.tier}
                                            onChange={(e) => handleChangeTier(org.id, e.target.value)}
                                            className={`text-sm px-2 py-1 rounded border ${TIER_COLORS[org.tier] || TIER_COLORS.BUILDER}`}
                                        >
                                            {TIERS.map((tier) => (
                                                <option key={tier} value={tier}>{tier}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{org.patient_count}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="font-medium text-slate-800">
                                                {org.ai_credits_monthly_quota - org.ai_credits_used_this_month + org.ai_credits_purchased}
                                            </span>
                                            <span className="text-slate-500 ml-1">available</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Monthly: {org.ai_credits_used_this_month}/{org.ai_credits_monthly_quota} | Purchased: {org.ai_credits_purchased}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {addCreditsOrgId === org.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={creditsAmount}
                                                    onChange={(e) => setCreditsAmount(Number(e.target.value))}
                                                    className="w-20 text-sm border border-slate-300 rounded px-2 py-1 text-slate-800"
                                                    min="1"
                                                />
                                                <button
                                                    onClick={() => handleAddCredits(org.id)}
                                                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => setAddCreditsOrgId(null)}
                                                    className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAddCreditsOrgId(org.id);
                                                    setCreditsAmount(10);
                                                }}
                                                className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded hover:bg-emerald-200"
                                            >
                                                + Credits
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-700">Form Templates</h2>
                            <p className="text-sm text-slate-500">Manage system form templates</p>
                        </div>
                        <Link
                            href={`/${locale}/admin/templates/new/edit`}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-sm"
                        >
                            + New Template
                        </Link>
                    </div>

                    {/* Scope Filter */}
                    <div className="px-6 py-3 border-b border-slate-200 flex gap-2">
                        <span className="text-sm text-slate-500 mr-2">Filter:</span>
                        {(['all', 'system', 'org'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setTemplatesFilter(f)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${templatesFilter === f
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'system' ? '🌐 System' : '🏢 Org'}
                            </button>
                        ))}
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Template</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Risk</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scope</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {templates
                                .filter(t => templatesFilter === 'all' || (templatesFilter === 'system' ? t.is_system : !t.is_system))
                                .map((template) => (
                                    <tr key={template.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800">{template.title}</p>
                                            {template.description && (
                                                <p className="text-sm text-slate-500 truncate max-w-xs">{template.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg">{THERAPY_ICONS[template.therapy_type] || '📋'}</span>
                                            <span className="ml-2 text-sm text-slate-600">{template.form_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${RISK_COLORS[template.risk_level]}`}>
                                                {template.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className={`text-sm ${template.is_system ? 'text-purple-600 font-medium' : 'text-slate-600'}`}>
                                                    {template.is_system ? '🌐 System' : '🏢 Org'}
                                                </span>
                                                {!template.is_system && template.organization_id && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{getOrgName(template.organization_id)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {template.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/${locale}/admin/templates/${template.id}/edit`}
                                                    className="text-slate-600 hover:text-slate-800 p-1"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {templates.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No templates yet. Create the first one.
                        </div>
                    )}
                </section>
            )}

            {/* Automations Tab */}
            {activeTab === 'automations' && (
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-semibold text-slate-700">System Automations</h2>
                        <p className="text-sm text-slate-500">Playbook templates available in the marketplace</p>
                    </div>

                    {/* Scope Filter */}
                    <div className="px-6 py-3 border-b border-slate-200 flex gap-2">
                        <span className="text-sm text-slate-500 mr-2">Filter:</span>
                        {(['all', 'system', 'org'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setAutomationsFilter(f)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${automationsFilter === f
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'system' ? '🌐 System' : '🏢 Org'}
                            </button>
                        ))}
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Playbook</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trigger</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scope</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {automations
                                .filter(a => automationsFilter === 'all' || (automationsFilter === 'system' ? a.is_system_template : !a.is_system_template))
                                .map((rule) => {
                                    // Map Lucide icon names to emojis
                                    const iconMap: Record<string, string> = {
                                        ShieldAlert: '🛡️',
                                        Banknote: '💸',
                                        HeartHandshake: '❤️',
                                        Bell: '🔔',
                                        Mail: '📧',
                                        Clock: '⏰',
                                        AlertTriangle: '⚠️',
                                    };
                                    const emoji = iconMap[rule.icon] || '🤖';

                                    return (
                                        <tr key={rule.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{emoji}</span>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{rule.name}</p>
                                                        <p className="text-sm text-slate-500 max-w-xs truncate">{rule.description}</p>
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
                                                    {(rule.actions || []).map((action, idx) => {
                                                        const actionLabels: Record<string, string> = {
                                                            send_email: '📧 Email',
                                                            update_journey_status: '🔄 Journey',
                                                            block_patient: '🚫 Block',
                                                            notify_therapist: '🔔 Notify',
                                                        };
                                                        return (
                                                            <span key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                                {actionLabels[action.type] || action.type}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className={`text-sm ${rule.is_system_template ? 'text-purple-600 font-medium' : 'text-slate-600'}`}>
                                                        {rule.is_system_template ? '🌐 System' : '🏢 Org'}
                                                    </span>
                                                    {!rule.is_system_template && rule.organization_id && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{getOrgName(rule.organization_id)}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${rule.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {automations.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No automation templates found.
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
