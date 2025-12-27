'use client';

import { useState, useEffect } from 'react';

import { API_URL } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ThemeEditor } from '@/components/admin/ThemeEditor';
import AiGovernance from './components/AiGovernance';

interface SystemSetting {
    key: string;
    value: any;
    description: string | null;
}

interface AdminOrganization {
    id: string;
    name: string;
    tier: string;
    terminology_preference: string;
    ai_credits_monthly_quota: number;
    ai_credits_purchased: number;
    ai_credits_used_this_month: number;
    patient_count: number;
}

const TERMINOLOGY_OPTIONS = ['CLIENT', 'PATIENT', 'CONSULTANT'] as const;

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
    BUILDER: 'bg-muted border-border text-foreground',
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

type TabType = 'settings' | 'organizations' | 'templates' | 'automations' | 'backups' | 'theme' | 'ai';

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
        const API_URL_LOCAL = API_URL;
        const response = await fetch(`${API_URL}/forms/admin/templates`, { credentials: 'include' });
        if (!response.ok) return [];
        const data = await response.json();
        return data.templates || [];
    }

    async function fetchAutomations(): Promise<AutomationRule[]> {
        const API_URL_LOCAL = API_URL;
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

    async function handleChangeTerminology(orgId: string, newTerm: string) {
        try {
            await api.admin.updateOrganization(orgId, { terminology_preference: newTerm });
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
        { key: 'backups', label: 'Backups', icon: '🛡️' },
        { key: 'theme', label: 'Theme Engine', icon: '🎨' },
        { key: 'ai', label: 'AI Governance', icon: '🧠' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.key
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-foreground/70 hover:text-foreground'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <section className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted">
                        <h2 className="text-lg font-semibold text-foreground">System Settings</h2>
                        <p className="text-sm text-foreground/60">Global configuration values stored in database</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {settings.map((setting) => (
                            <div key={setting.key} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-mono text-sm font-medium text-foreground">{setting.key}</p>
                                    <p className="text-xs text-foreground/60">{setting.description || 'No description'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {editingKey === setting.key ? (
                                        <>
                                            {setting.key === 'AI_MODEL' ? (
                                                <select
                                                    value={editValue.replace(/"/g, '')}
                                                    onChange={(e) => setEditValue(`"${e.target.value}"`)}
                                                    className="w-48 text-sm border border-border rounded px-2 py-1 font-mono text-foreground bg-card"
                                                >
                                                    {AI_MODELS.map((model) => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-48 h-20 text-sm border border-border rounded px-2 py-1 font-mono text-foreground bg-card"
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
                                                className="px-3 py-1 bg-muted text-foreground text-sm rounded hover:bg-accent"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <code className="text-sm bg-muted px-3 py-1 rounded text-foreground max-w-xs truncate">
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
                <section className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted">
                        <h2 className="text-lg font-semibold text-foreground">Organizations</h2>
                        <p className="text-sm text-foreground/60">Manage organization tiers and credits</p>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Tier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Term</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Patients</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizations.map((org) => (
                                <tr key={org.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">{org.name}</td>
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
                                    <td className="px-6 py-4">
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
                                    <td className="px-6 py-4 text-sm text-foreground/70">{org.patient_count}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="font-medium text-foreground">
                                                {org.ai_credits_monthly_quota - org.ai_credits_used_this_month + org.ai_credits_purchased}
                                            </span>
                                            <span className="text-foreground/60 ml-1">available</span>
                                        </div>
                                        <div className="text-xs text-foreground/60">
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
                                                    className="w-20 text-sm border border-border rounded px-2 py-1 text-foreground"
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
                                                    className="px-2 py-1 bg-muted text-foreground text-xs rounded"
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
                <section className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Form Templates</h2>
                            <p className="text-sm text-foreground/60">Manage system form templates</p>
                        </div>
                        <Link
                            href={`/${locale}/admin/templates/new/edit`}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
                        >
                            + New Template
                        </Link>
                    </div>

                    {/* Scope Filter */}
                    <div className="px-6 py-3 border-b border-border flex gap-2">
                        <span className="text-sm text-foreground/60 mr-2">Filter:</span>
                        {(['all', 'system', 'org'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setTemplatesFilter(f)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${templatesFilter === f
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground/70 hover:bg-muted'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'system' ? '🌐 System' : '🏢 Org'}
                            </button>
                        ))}
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Template</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Risk</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Scope</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-foreground/60 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {templates
                                .filter(t => templatesFilter === 'all' || (templatesFilter === 'system' ? t.is_system : !t.is_system))
                                .map((template) => (
                                    <tr key={template.id} className="hover:bg-accent">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-foreground">{template.title}</p>
                                            {template.description && (
                                                <p className="text-sm text-foreground/60 truncate max-w-xs">{template.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg">{THERAPY_ICONS[template.therapy_type] || '📋'}</span>
                                            <span className="ml-2 text-sm text-foreground/70">{template.form_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${RISK_COLORS[template.risk_level]}`}>
                                                {template.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className={`text-sm ${template.is_system ? 'text-purple-600 font-medium' : 'text-foreground/70'}`}>
                                                    {template.is_system ? '🌐 System' : '🏢 Org'}
                                                </span>
                                                {!template.is_system && template.organization_id && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{getOrgName(template.organization_id)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground/60'}`}>
                                                {template.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/${locale}/admin/templates/${template.id}/edit`}
                                                    className="text-foreground/70 hover:text-foreground p-1"
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
                        <div className="text-center py-12 text-foreground/60">
                            No templates yet. Create the first one.
                        </div>
                    )}
                </section>
            )}

            {/* Automations Tab */}
            {activeTab === 'automations' && (
                <section className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-muted">
                        <h2 className="text-lg font-semibold text-foreground">System Automations</h2>
                        <p className="text-sm text-foreground/60">Playbook templates available in the marketplace</p>
                    </div>

                    {/* Scope Filter */}
                    <div className="px-6 py-3 border-b border-border flex gap-2">
                        <span className="text-sm text-foreground/60 mr-2">Filter:</span>
                        {(['all', 'system', 'org'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setAutomationsFilter(f)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${automationsFilter === f
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground/70 hover:bg-muted'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'system' ? '🌐 System' : '🏢 Org'}
                            </button>
                        ))}
                    </div>
                    <table className="w-full">
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
                                        <tr key={rule.id} className="hover:bg-accent">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{emoji}</span>
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
                                                    <span className={`text-sm ${rule.is_system_template ? 'text-purple-600 font-medium' : 'text-foreground/70'}`}>
                                                        {rule.is_system_template ? '🌐 System' : '🏢 Org'}
                                                    </span>
                                                    {!rule.is_system_template && rule.organization_id && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">{getOrgName(rule.organization_id)}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${rule.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-muted text-foreground/60'
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
                        <div className="text-center py-12 text-foreground/60">
                            No automation templates found.
                        </div>
                    )}
                </section>
            )}

            {/* Backups Tab */}
            {activeTab === 'backups' && (
                <BackupsTab />
            )}

            {/* Theme Engine Tab */}
            {activeTab === 'theme' && (
                <ThemeEditor />
            )}

            {/* AI Governance Tab */}
            {activeTab === 'ai' && (
                <section className="bg-card rounded-xl border border-border p-6">
                    <AiGovernance />
                </section>
            )}
        </div>
    );
}

// Separate component for Backups Tab to manage its own state
function BackupsTab() {
    const [backups, setBackups] = useState<Array<{
        filename: string;
        size_human: string;
        created_at: string;
        age_hours: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Nuclear confirmation modal state
    const [restoreModal, setRestoreModal] = useState<{ open: boolean; filename: string | null }>({ open: false, filename: null });
    const [confirmInput, setConfirmInput] = useState('');

    useEffect(() => {
        loadBackups();
    }, []);

    async function loadBackups() {
        try {
            const response = await fetch(`${API_URL}/admin/backups`, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load backups');
            const data = await response.json();
            setBackups(data.backups || []);
        } catch (err) {
            console.error('Error loading backups:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateBackup() {
        setCreating(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_URL}/admin/backups/create`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Backup created!' });
                loadBackups();
            } else {
                setMessage({ type: 'error', text: data.detail || 'Failed to create backup' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setCreating(false);
        }
    }

    function openRestoreModal(filename: string) {
        setRestoreModal({ open: true, filename });
        setConfirmInput('');
    }

    function closeRestoreModal() {
        setRestoreModal({ open: false, filename: null });
        setConfirmInput('');
    }

    async function executeRestore() {
        if (!restoreModal.filename || confirmInput !== 'RESTAURAR') return;

        const filename = restoreModal.filename;
        closeRestoreModal();
        setRestoring(filename);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/admin/backups/restore`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, confirm: true }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Database restored! Refresh the page.' });
            } else {
                setMessage({ type: 'error', text: data.detail || 'Restore failed' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setRestoring(null);
        }
    }

    async function handleDelete(filename: string) {
        if (!confirm(`Delete backup: ${filename}?`)) return;
        try {
            await fetch(`${API_URL}/admin/backups/${filename}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            loadBackups();
        } catch (err) {
            console.error('Delete failed');
        }
    }

    function handleDownload(filename: string) {
        // Open download in new tab - browser will handle the file download
        window.open(`${API_URL}/admin/backups/${filename}/download`, '_blank');
    }

    if (loading) {
        return <div className="p-8 text-center">Loading backups...</div>;
    }

    return (
        <>
            <section className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">🛡️ Database Backups</h2>
                        <p className="text-sm text-foreground/60">Create and restore database backups (Super Admin only)</p>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        {creating ? '⏳ Creating...' : '📸 Create Backup'}
                    </button>
                </div>

                {message && (
                    <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Filename</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Age</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-foreground/60 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {backups.map((backup) => (
                            <tr key={backup.filename} className="hover:bg-accent">
                                <td className="px-6 py-4 font-mono text-sm text-foreground">{backup.filename}</td>
                                <td className="px-6 py-4 text-sm text-foreground/70">{backup.size_human}</td>
                                <td className="px-6 py-4 text-sm text-foreground/70">
                                    {new Date(backup.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground/70">
                                    {backup.age_hours < 1 ? 'Just now' : `${Math.round(backup.age_hours)}h ago`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleDownload(backup.filename)}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
                                            title="Download to your computer"
                                        >
                                            ⬇️ Download
                                        </button>
                                        <button
                                            onClick={() => openRestoreModal(backup.filename)}
                                            disabled={restoring === backup.filename}
                                            className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded hover:bg-amber-200 disabled:opacity-50"
                                        >
                                            {restoring === backup.filename ? '⏳' : '🔄'} Restore
                                        </button>
                                        <button
                                            onClick={() => handleDelete(backup.filename)}
                                            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {backups.length === 0 && (
                    <div className="text-center py-12 text-foreground/60">
                        No backups yet. Create your first backup.
                    </div>
                )}
            </section>

            {/* Nuclear Confirmation Modal */}
            {restoreModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">
                                PELIGRO CRÍTICO: RESTAURACIÓN DE SISTEMA
                            </h3>
                            <p className="text-foreground/70 mb-4">
                                Estás a punto de <span className="font-bold text-red-600">sobrescribir la base de datos actual</span> con
                                la copia <code className="bg-muted px-1 rounded">{restoreModal.filename}</code>.
                            </p>
                            <p className="text-red-700 font-semibold mb-6">
                                ⚠️ TODOS LOS DATOS POSTERIORES A ESA FECHA SE PERDERÁN PERMANENTEMENTE.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Escribe <span className="font-mono font-bold text-red-600">RESTAURAR</span> para confirmar:
                                </label>
                                <input
                                    type="text"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                                    className="w-full border-2 border-red-300 rounded-lg px-4 py-2 text-center font-mono text-lg focus:border-red-500 focus:outline-none"
                                    placeholder="RESTAURAR"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={closeRestoreModal}
                                    className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-accent"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={executeRestore}
                                    disabled={confirmInput !== 'RESTAURAR'}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🔄 RESTAURAR AHORA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

