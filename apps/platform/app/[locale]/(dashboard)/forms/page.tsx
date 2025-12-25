'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FormCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState, { FormsEmptyIcon } from '@/components/ui/EmptyState';
import SectionHeader from '@/components/SectionHeader';
import { FileText } from 'lucide-react';

import { API_URL } from '@/lib/api';

interface FormTemplate {
    id: string;
    title: string;
    description: string | null;
    risk_level: string;
    therapy_type: string;
    form_type: string;
    public_token?: string | null;
    is_system: boolean;
    is_active: boolean;
}

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

export default function FormsPage() {
    const params = useParams();
    const locale = params.locale as string || 'en';
    const t = useTranslations('Forms');

    const [activeTab, setActiveTab] = useState<'my-forms' | 'library'>('my-forms');
    const [myForms, setMyForms] = useState<FormTemplate[]>([]);
    const [systemTemplates, setSystemTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [qrModal, setQrModal] = useState<{ title: string; url: string } | null>(null);

    useEffect(() => {
        loadForms();
    }, []);

    async function loadForms() {
        setLoading(true);
        try {
            const [myRes, sysRes] = await Promise.all([
                fetch(`${API_URL}/forms/templates`, { credentials: 'include' }),
                fetch(`${API_URL}/forms/templates/system`, { credentials: 'include' }),
            ]);

            if (myRes.ok) {
                const data = await myRes.json();
                setMyForms(data.templates || []);
            }
            if (sysRes.ok) {
                const data = await sysRes.json();
                setSystemTemplates(data.templates || []);
            }
        } catch (err) {
            console.error('Error loading forms', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleClone(templateId: string) {
        setCloning(templateId);
        try {
            const response = await fetch(
                `${API_URL}/forms/templates/clone/${templateId}`,
                { method: 'POST', credentials: 'include' }
            );

            if (response.ok) {
                const cloned = await response.json();
                setMyForms([...myForms, cloned]);
                setActiveTab('my-forms');
            } else {
                const error = await response.json();
                alert(error.detail || 'Error cloning template');
            }
        } catch (err) {
            console.error('Error cloning', err);
        } finally {
            setCloning(null);
        }
    }

    function copyPublicLink(token: string) {
        const url = `${window.location.origin}/${locale}/f/public/${token}`;
        navigator.clipboard.writeText(url);
        setCopied(token);
        setTimeout(() => setCopied(null), 2000);
    }

    function showQRCode(form: FormTemplate) {
        if (!form.public_token) return;
        const url = `${window.location.origin}/${locale}/f/public/${form.public_token}`;
        setQrModal({ title: form.title, url });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <FormCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground dark:text-zinc-100">{t('title')}</h1>
                    <p className="text-sm text-foreground/60 dark:text-zinc-400">{t('subtitle')}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('my-forms')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-forms'
                        ? 'bg-card text-foreground dark:text-zinc-100 shadow-sm'
                        : 'text-foreground/70 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-200'
                        }`}
                >
                    {t('myForms')} ({myForms.length})
                </button>
                <button
                    onClick={() => setActiveTab('library')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'library'
                        ? 'bg-card text-foreground dark:text-zinc-100 shadow-sm'
                        : 'text-foreground/70 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-200'
                        }`}
                >
                    {t('templateLibrary')} ({systemTemplates.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'my-forms' && (
                <div>
                    {myForms.length === 0 ? (
                        <EmptyState
                            icon={<FormsEmptyIcon />}
                            title={t('noForms')}
                            description={t('noFormsDescription')}
                            action={
                                <button
                                    onClick={() => setActiveTab('library')}
                                    className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    {t('browseLibrary')} →
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myForms.map((form) => (
                                <div key={form.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-2xl">{THERAPY_ICONS[form.therapy_type] || '📋'}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[form.risk_level]}`}>
                                            {form.risk_level}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{form.title}</h3>
                                    <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                                        {form.description || 'No description'}
                                    </p>

                                    <div className="flex gap-2 pt-3 border-t border-border">
                                        {form.public_token ? (
                                            <>
                                                <button
                                                    onClick={() => copyPublicLink(form.public_token!)}
                                                    className="flex-1 px-3 py-2 bg-brand/10 text-brand rounded-lg text-sm font-medium hover:bg-brand/20 transition-colors"
                                                >
                                                    {copied === form.public_token ? '✓ Copied!' : '🔗 Copy Link'}
                                                </button>
                                                <button
                                                    onClick={() => showQRCode(form)}
                                                    className="px-3 py-2 bg-border/30 text-foreground/70 rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                                                    title="Show QR Code"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v2h-2v-1h1v-1zm-4 0h2v1h-1v1h-1v-2zm0 3h1v3h-1v-3zm4 0h1v1h-1v-1zm-3 1h2v1h-2v-1zm3 1h1v2h-2v-1h1v-1zm-2 2h1v1h-1v-1z" />
                                                    </svg>
                                                </button>
                                            </>
                                        ) : (
                                            <span className="flex-1 px-3 py-2 bg-card text-foreground/40 rounded-lg text-sm text-center">
                                                Not published
                                            </span>
                                        )}
                                        <Link
                                            href={`/${locale}/forms/${form.id}/submissions`}
                                            className="px-3 py-2 bg-border/30 text-foreground/70 rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                                        >
                                            📊
                                        </Link>
                                        <Link
                                            href={`/${locale}/forms/${form.id}/edit`}
                                            className="px-3 py-2 bg-border/30 text-foreground/70 rounded-lg text-sm font-medium hover:bg-border/50 transition-colors"
                                        >
                                            ⚙️
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'library' && (
                <div>
                    {systemTemplates.length === 0 ? (
                        <div className="text-center py-16 bg-card rounded-xl shadow-sm">
                            <p className="text-foreground/60">No system templates available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {systemTemplates.map((template) => (
                                <div key={template.id} className="bg-card rounded-xl shadow-sm p-5 border-2 border-transparent hover:border-border transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-2xl">{THERAPY_ICONS[template.therapy_type] || '📋'}</span>
                                        <div className="flex gap-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[template.risk_level]}`}>
                                                {template.risk_level}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                {template.form_type}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{template.title}</h3>
                                    <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                                        {template.description || 'System template'}
                                    </p>

                                    <button
                                        onClick={() => handleClone(template.id)}
                                        disabled={cloning === template.id}
                                        className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                    >
                                        {cloning === template.id ? 'Adding...' : '+ Add to My Forms'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* QR Code Modal */}
            {qrModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-foreground dark:text-zinc-100">{qrModal.title}</h3>
                            <button
                                onClick={() => setQrModal(null)}
                                className="text-zinc-400 hover:text-foreground/70 dark:hover:text-zinc-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-card p-4 rounded-lg inline-block mx-auto mb-4">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.url)}`}
                                alt="QR Code"
                                width={200}
                                height={200}
                            />
                        </div>

                        <p className="text-sm text-foreground/60 dark:text-zinc-400 mb-4">
                            Scan to open the form instantly
                        </p>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(qrModal.url);
                                setCopied('qr');
                                setTimeout(() => setCopied(null), 2000);
                            }}
                            className="w-full px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            {copied === 'qr' ? '✓ Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
