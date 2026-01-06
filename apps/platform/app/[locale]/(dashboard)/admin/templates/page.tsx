'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

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
}

const RISK_COLORS: Record<string, string> = {
    LOW: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
};

const THERAPY_ICONS: Record<string, string> = {
    GENERAL: '📋', ASTROLOGY: '⭐', SOMATIC: '🧘', PSYCHEDELIC: '🍄', INTEGRATION: '🔄',
};

/**
 * Templates (Forms) section page
 */
export default function TemplatesPage() {
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'system' | 'org'>('all');

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        try {
            const response = await fetch(`${API_URL}/forms/admin/templates`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (err) {
            console.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
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
        return <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />;
    }

    const filtered = templates.filter(t => 
        filter === 'all' || (filter === 'system' ? t.is_system : !t.is_system)
    );

    return (
        <section className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Forms</h2>
                    <p className="text-sm text-foreground/60">Manage system form templates</p>
                </div>
                <Link
                    href="/admin/templates/new/edit"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
                >
                    + New Template
                </Link>
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
                    {filtered.map((template) => (
                        <tr key={template.id} className="hover:bg-accent">
                            <td className="px-6 py-4">
                                <p className="font-medium text-foreground">{template.title}</p>
                                {template.description && (
                                    <p className="text-sm text-foreground/60 truncate max-w-xs">{template.description}</p>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-lg">{THERAPY_ICONS[template.therapy_type] || '��'}</span>
                                <span className="ml-2 text-sm text-foreground/70">{template.form_type}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${RISK_COLORS[template.risk_level]}`}>
                                    {template.risk_level}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-sm ${template.is_system ? 'text-purple-600 font-medium' : 'text-foreground/70'}`}>
                                    {template.is_system ? '🌐 System' : '🏢 Org'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground/60'}`}>
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <Link
                                        href={`/admin/templates/${template.id}/edit`}
                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filtered.length === 0 && (
                <div className="text-center py-12 text-foreground/60">
                    No templates yet. Create the first one.
                </div>
            )}
        </section>
    );
}
