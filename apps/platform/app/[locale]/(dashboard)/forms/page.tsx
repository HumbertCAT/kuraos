'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FormCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState, { FormsEmptyIcon } from '@/components/ui/EmptyState';
import { FileText, Plus, Link2, BarChart3, Settings, QrCode, Search, Copy, Check, MoreVertical, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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

const RISK_BADGES: Record<string, string> = {
    LOW: 'badge badge-success',
    MEDIUM: 'badge badge-warning',
    HIGH: 'badge badge-risk',
    CRITICAL: 'badge badge-risk',
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

    const [openMenu, setOpenMenu] = useState<string | null>(null);

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
            <div className="min-h-screen bg-muted py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
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
            <PageHeader
                icon={FileText}
                kicker="PRACTICE"
                title={t('title')}
                subtitle={t('subtitle')}
            />

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('my-forms')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-forms'
                        ? 'bg-card text-foreground  shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    {t('myForms')} ({myForms.length})
                </button>
                <button
                    onClick={() => setActiveTab('library')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'library'
                        ? 'bg-card text-foreground  shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
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
                                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {t('browseLibrary')} →
                                </button>
                            }
                        />
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">{t('title')}</th>
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase hidden md:table-cell">TIPO</th>
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">RIESGO</th>
                                        <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider uppercase">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-0">
                                    {myForms.map((form) => (
                                        <tr key={form.id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                                            {/* Form Info */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl">
                                                        {THERAPY_ICONS[form.therapy_type] || '📋'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="type-ui font-medium text-foreground truncate">{form.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {form.description || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Type */}
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="type-ui text-xs text-muted-foreground font-mono uppercase">
                                                    {form.therapy_type}
                                                </span>
                                            </td>
                                            {/* Risk Level */}
                                            <td className="px-4 py-3">
                                                <span className={RISK_BADGES[form.risk_level] || 'badge badge-secondary'}>
                                                    {form.risk_level}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {form.public_token && (
                                                        <button
                                                            onClick={() => copyPublicLink(form.public_token!)}
                                                            className="btn btn-sm btn-ghost p-2 text-muted-foreground hover:text-brand"
                                                            title={copied === form.public_token ? 'Copiado' : 'Copiar Link'}
                                                        >
                                                            {copied === form.public_token ? <Check className="w-4 h-4 text-brand" /> : <Link2 className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/${locale}/forms/${form.id}/edit`}
                                                        className="btn btn-sm btn-ghost p-2 text-muted-foreground hover:text-foreground"
                                                        title="Editar Formulario"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </Link>
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setOpenMenu(openMenu === form.id ? null : form.id)}
                                                            className="btn btn-sm btn-ghost p-2"
                                                        >
                                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                        {openMenu === form.id && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-card border rounded-xl shadow-lg z-10 overflow-hidden text-left">
                                                                <button
                                                                    onClick={() => {
                                                                        showQRCode(form);
                                                                        setOpenMenu(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:bg-muted transition-colors"
                                                                >
                                                                    <QrCode className="w-4 h-4" /> Ver Código QR
                                                                </button>
                                                                <Link
                                                                    href={`/${locale}/forms/${form.id}/submissions`}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:bg-muted transition-colors"
                                                                    onClick={() => setOpenMenu(null)}
                                                                >
                                                                    <BarChart3 className="w-4 h-4" /> Ver Estadísticas
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        // handleDelete(form.id);
                                                                        setOpenMenu(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-border/50 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Eliminar
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'library' && (
                <div>
                    {systemTemplates.length === 0 ? (
                        <div className="text-center py-16 bg-card rounded-xl shadow-sm">
                            <p className="text-foreground/60">No hay plantillas del sistema disponibles</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">PLANTILLA</th>
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase hidden md:table-cell">TIPO</th>
                                        <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">RIESGO</th>
                                        <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider uppercase">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-0">
                                    {systemTemplates.map((template) => (
                                        <tr key={template.id} className="border-b border-border hover:bg-muted/40 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl">
                                                        {THERAPY_ICONS[template.therapy_type] || '📋'}
                                                    </div>
                                                    <div>
                                                        <p className="type-ui font-medium text-foreground">{template.title}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{template.description || 'Plantilla del sistema'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="type-ui text-xs text-muted-foreground font-mono uppercase">
                                                    {template.form_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={RISK_BADGES[template.risk_level] || 'badge badge-secondary'}>
                                                    {template.risk_level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleClone(template.id)}
                                                        disabled={cloning === template.id}
                                                        className="btn btn-sm btn-primary py-1 px-4 h-9 active:scale-95 transition-all text-sm font-medium"
                                                    >
                                                        {cloning === template.id ? 'Añadiendo...' : '+ Añadir'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* QR Code Modal */}
            {qrModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-foreground ">{qrModal.title}</h3>
                            <button
                                onClick={() => setQrModal(null)}
                                className="text-muted-foreground hover:text-foreground"
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

                        <p className="text-sm text-foreground/60 dark:text-muted-foreground mb-4">
                            Scan to open the form instantly
                        </p>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(qrModal.url);
                                setCopied('qr');
                                setTimeout(() => setCopied(null), 2000);
                            }}
                            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-opacity"
                        >
                            {copied === 'qr' ? '✓ Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
