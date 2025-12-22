'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface FormTemplate {
    id: string;
    title: string;
    risk_level: string;
    form_type: string;
}

interface SendFormModalProps {
    patientId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    isOpen: boolean;
    onClose: () => void;
    locale: string;
}

export default function SendFormModal({
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    isOpen,
    onClose,
    locale
}: SendFormModalProps) {
    const t = useTranslations('SendForm');
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
            setGeneratedLink(null);
            setSelectedTemplate('');
        }
    }, [isOpen]);

    async function loadTemplates() {
        setLoading(true);
        try {
            const data = await api.forms.listTemplates();
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Error loading templates', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!selectedTemplate) return;

        setCreating(true);
        try {
            const data = await api.forms.createAssignment({
                patient_id: patientId,
                template_id: selectedTemplate,
                valid_days: 7,
            });

            // Build URL with prefill params for Magic Links
            let fullUrl = `${window.location.origin}/${locale}/f/${data.token}`;
            const params = new URLSearchParams();
            if (patientName) params.set('prefill_name', patientName);
            if (patientEmail) params.set('prefill_email', patientEmail);
            if (params.toString()) {
                fullUrl += `?${params.toString()}`;
            }
            setGeneratedLink(fullUrl);
        } catch (err: any) {
            console.error('Error creating assignment', err);
            alert(err.message || t('errorCreating'));
        } finally {
            setCreating(false);
        }
    }

    function copyLink() {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function sendViaWhatsApp() {
        if (!generatedLink || !patientPhone) return;

        // Strip non-numeric characters from phone
        const cleanPhone = patientPhone.replace(/\D/g, '');
        const firstName = patientName.split(' ')[0];

        const message = locale === 'es'
            ? `Hola ${firstName}, por favor completa este formulario para nuestra próxima sesión: ${generatedLink}`
            : `Hi ${firstName}, please complete this form for our next session: ${generatedLink}`;
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">{t('title')}</h3>
                        <p className="text-sm text-slate-500">{t('to')}: {patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {!generatedLink ? (
                    <>
                        {/* Form Selection */}
                        {loading ? (
                            <div className="py-8 text-center text-slate-500">
                                {t('loadingForms')}
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-slate-500 mb-2">{t('noForms')}</p>
                                <p className="text-sm text-slate-400">
                                    {t('noFormsDescription')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {t('selectForm')}
                                    </label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none text-slate-800"
                                    >
                                        <option value="">{t('chooseForm')}</option>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.title} ({template.form_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={!selectedTemplate || creating}
                                    className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {creating ? t('creating') : t('generateLink')}
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* Success - Show Link */}
                        <div className="py-4">
                            <div className="flex items-center gap-2 mb-3 text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{t('linkReady')}</span>
                            </div>

                            <div className="bg-slate-100 p-3 rounded-lg mb-4">
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                                />
                            </div>

                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={copyLink}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? (
                                        <>✓ {t('copied')}</>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                            {t('copy')}
                                        </>
                                    )}
                                </button>

                                {patientPhone && (
                                    <button
                                        onClick={sendViaWhatsApp}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 text-center">
                                {t('linkValidFor')}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
