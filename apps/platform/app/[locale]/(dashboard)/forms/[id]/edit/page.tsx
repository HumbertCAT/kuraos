'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import FormRenderer from '@/components/FormRenderer';
import RichTextEditor from '@/components/ui/RichTextEditor';

import { API_URL } from '@/lib/api';

type OrgTier = 'BUILDER' | 'PRO' | 'CENTER';

interface FormField {
    id: string;
    type: string;
    label: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
    disclaimer?: string;
    min_label?: string;
    max_label?: string;
    min?: number;
    max?: number;
    critical?: boolean;
}

interface TemplateData {
    id?: string;
    organization_id?: string | null;
    title: string;
    description: string;
    risk_level: string;
    therapy_type: string;
    form_type: string;
    target_entity: string;
    schema: { version: string; fields: FormField[] };
    public_token?: string | null;
    is_active: boolean;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Texto corto' },
    { value: 'textarea', label: 'Texto largo' },
    { value: 'select', label: 'Desplegable' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Fecha' },
    { value: 'time', label: 'Hora' },
    { value: 'location', label: 'Ubicación' },
    { value: 'range', label: 'Rango (0-10)' },
    { value: 'emotion_multi', label: 'Emociones (Multi)' },
    { value: 'medical_boolean', label: 'Sí/No Médico' },
    { value: 'legal_checkbox', label: 'Legal (Disclaimer)' },
];

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const THERAPY_TYPES = ['GENERAL', 'ASTROLOGY', 'SOMATIC', 'PSYCHEDELIC', 'INTEGRATION'];
const FORM_TYPES = ['INTAKE', 'PRE_SESSION', 'POST_SESSION', 'FEEDBACK'];
const TARGET_ENTITIES = [
    { value: 'PATIENT', label: 'Paciente (Clínico)' },
    { value: 'LEAD', label: 'Lead (Captación)' },
];

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// Tier permission helpers
const canEditConfig = (tier: OrgTier) => tier === 'PRO' || tier === 'CENTER';
const canEditFields = (tier: OrgTier) => tier === 'CENTER';

export default function EditFormPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;
    const locale = params.locale as string || 'es';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
    const [publishLoading, setPublishLoading] = useState(false);
    const [tier, setTier] = useState<OrgTier>('BUILDER');
    const [duplicating, setDuplicating] = useState(false);

    const [template, setTemplate] = useState<TemplateData>({
        title: '',
        description: '',
        risk_level: 'LOW',
        therapy_type: 'GENERAL',
        form_type: 'INTAKE',
        target_entity: 'PATIENT',
        schema: { version: '1.0', fields: [] },
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, [templateId]);

    async function loadData() {
        try {
            // Load tier info
            const usageRes = await fetch(`${API_URL}/auth/me/usage`, { credentials: 'include' });
            if (usageRes.ok) {
                const usageData = await usageRes.json();
                setTier(usageData.tier as OrgTier);
            }

            // Load template
            const response = await fetch(
                `${API_URL}/forms/templates/${templateId}`,
                { credentials: 'include' }
            );

            if (!response.ok) throw new Error('Failed to load');

            const data = await response.json();
            setTemplate({
                id: data.id,
                organization_id: data.organization_id,
                title: data.title,
                description: data.description || '',
                risk_level: data.risk_level,
                therapy_type: data.therapy_type,
                form_type: data.form_type,
                target_entity: data.target_entity || 'PATIENT',
                schema: data.schema || { version: '1.0', fields: [] },
                public_token: data.public_token,
                is_active: data.is_active,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            // Build payload based on tier permissions
            const payload: Record<string, unknown> = {
                is_active: template.is_active,
            };

            if (canEditConfig(tier)) {
                payload.title = template.title;
                payload.description = template.description;
                payload.risk_level = template.risk_level;
                payload.therapy_type = template.therapy_type;
                payload.form_type = template.form_type;
                payload.target_entity = template.target_entity;
            }

            if (canEditFields(tier)) {
                payload.schema = template.schema;
            }

            const response = await fetch(
                `${API_URL}/forms/templates/${templateId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setTemplate(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleTogglePublish() {
        if (!template.id) return;
        setPublishLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/forms/templates/${template.id}/publish`,
                { method: 'POST', credentials: 'include' }
            );

            if (response.ok) {
                const data = await response.json();
                setTemplate({ ...template, public_token: data.public_token });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPublishLoading(false);
        }
    }

    async function handleDuplicate() {
        if (!template.id) return;
        setDuplicating(true);
        try {
            const response = await fetch(
                `${API_URL}/forms/templates/${template.id}/duplicate`,
                { method: 'POST', credentials: 'include' }
            );

            if (response.ok) {
                const data = await response.json();
                router.push(`/${locale}/forms/${data.id}/edit`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDuplicating(false);
        }
    }

    function addField() {
        if (!canEditFields(tier)) return;
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'Nuevo campo',
            required: false,
        };
        setTemplate({
            ...template,
            schema: {
                ...template.schema,
                fields: [...template.schema.fields, newField],
            },
        });
    }

    function updateField(index: number, updates: Partial<FormField>) {
        if (!canEditFields(tier)) return;
        const fields = [...template.schema.fields];
        fields[index] = { ...fields[index], ...updates };
        if (updates.label && !updates.id) {
            fields[index].id = slugify(updates.label);
        }
        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    function removeField(index: number) {
        if (!canEditFields(tier)) return;
        const fields = template.schema.fields.filter((_, i) => i !== index);
        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    function moveField(index: number, direction: 'up' | 'down') {
        if (!canEditFields(tier)) return;
        const fields = [...template.schema.fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;
        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    // Lock Overlay Component
    const LockOverlay = ({ requiredTier, children }: { requiredTier: 'PRO' | 'CENTER', children?: React.ReactNode }) => (
        <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center bg-white/90 px-6 py-4 rounded-xl shadow-sm">
                <span className="text-2xl mb-2 block">🔒</span>
                <p className="text-sm font-medium text-slate-700">
                    {requiredTier === 'PRO' ? 'Mejora a PRO' : 'Mejora a CENTER'}
                </p>
                <p className="text-xs text-slate-500 mt-1">para desbloquear esta función</p>
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <Link href={`/${locale}/forms`} className="text-slate-500 hover:text-slate-700 text-sm">
                            ← Volver a formularios
                        </Link>
                        <h1 className="text-xl font-bold text-slate-800">
                            {template.title || 'Editar Formulario'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Active Toggle */}
                        <div className="relative group flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setTemplate({ ...template, is_active: !template.is_active })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${template.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${template.is_active ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                            <span className="text-sm text-slate-600">
                                {template.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                                    {template.is_active
                                        ? 'Este formulario está visible para ser asignado.'
                                        : 'Este formulario no aparecerá en las listas.'
                                    }
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-200"></div>

                        {/* Duplicate Button */}
                        <button
                            onClick={handleDuplicate}
                            disabled={duplicating}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            {duplicating ? '...' : '📋 Duplicar'}
                        </button>

                        {/* Preview Toggle */}
                        {activeTab === 'preview' ? (
                            <button
                                onClick={() => setActiveTab('builder')}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                ← Volver al editor
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveTab('preview')}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                👁 Vista Previa
                            </button>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tier Badge */}
            <div className="max-w-6xl mx-auto px-6 pt-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${tier === 'CENTER' ? 'bg-purple-100 text-purple-700' :
                    tier === 'PRO' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {tier === 'CENTER' && '🏢'}
                    {tier === 'PRO' && '⭐'}
                    {tier === 'BUILDER' && '🔨'}
                    Plan {tier}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto py-6 px-6">
                {/* Builder Mode */}
                {activeTab === 'builder' && (
                    <div className="space-y-6">
                        {/* Publicación Section - ALL TIERS */}
                        {template.organization_id && template.risk_level !== 'CRITICAL' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                        <span>🌐</span> Publicación del formulario
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {template.public_token ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xl">✅</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-emerald-800">Formulario publicado</p>
                                                    <p className="text-xs text-emerald-600">Cualquier persona puede completar este formulario</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/f/public/${template.public_token}`}
                                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 font-mono bg-slate-50"
                                                />
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${locale}/f/public/${template.public_token}`)}
                                                    className="px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
                                                >
                                                    📋 Copiar
                                                </button>
                                                <button
                                                    onClick={() => window.open(`${window.location.origin}/${locale}/f/public/${template.public_token}`, '_blank')}
                                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
                                                >
                                                    🔗 Abrir
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleTogglePublish}
                                                disabled={publishLoading}
                                                className="w-full py-3 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-sm font-medium"
                                            >
                                                {publishLoading ? 'Procesando...' : '🔒 Despublicar formulario'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xl">💡</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">¿Para qué sirve publicar?</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Al publicar, se genera un enlace público que puedes compartir en redes sociales,
                                                        WhatsApp o tu web. Cualquier persona podrá completar el formulario sin necesidad
                                                        de cuenta, y sus respuestas crearán automáticamente un nuevo paciente.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleTogglePublish}
                                                disabled={publishLoading}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
                                            >
                                                {publishLoading ? 'Procesando...' : '🌐 Publicar formulario'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Config Section - PRO/CENTER */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            {!canEditConfig(tier) && <LockOverlay requiredTier="PRO" />}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                    <span>⚙️</span> Configuración del formulario
                                    {!canEditConfig(tier) && <span className="text-xs font-normal text-slate-400 ml-2">PRO</span>}
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={template.title}
                                        onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                                        disabled={!canEditConfig(tier)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        placeholder="Nombre del formulario"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                                    {canEditConfig(tier) ? (
                                        <RichTextEditor
                                            value={template.description}
                                            onChange={(value) => setTemplate({ ...template, description: value })}
                                            placeholder="Describe el propósito de este formulario..."
                                            minHeight="100px"
                                        />
                                    ) : (
                                        <div className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 bg-slate-50 min-h-[100px]"
                                            dangerouslySetInnerHTML={{ __html: template.description || '<span class="text-slate-400">Sin descripción</span>' }} />
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nivel de Riesgo</label>
                                        <select
                                            value={template.risk_level}
                                            onChange={(e) => setTemplate({ ...template, risk_level: e.target.value })}
                                            disabled={!canEditConfig(tier)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        >
                                            {RISK_LEVELS.map((level) => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Terapia</label>
                                        <select
                                            value={template.therapy_type}
                                            onChange={(e) => setTemplate({ ...template, therapy_type: e.target.value })}
                                            disabled={!canEditConfig(tier)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        >
                                            {THERAPY_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Formulario</label>
                                        <select
                                            value={template.form_type}
                                            onChange={(e) => setTemplate({ ...template, form_type: e.target.value })}
                                            disabled={!canEditConfig(tier)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        >
                                            {FORM_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Destino de Envío</label>
                                        <select
                                            value={template.target_entity}
                                            onChange={(e) => setTemplate({ ...template, target_entity: e.target.value })}
                                            disabled={!canEditConfig(tier)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        >
                                            {TARGET_ENTITIES.map((entity) => (
                                                <option key={entity.value} value={entity.value}>{entity.label}</option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {template.target_entity === 'LEAD'
                                                ? '📣 Captación: Crea Lead en CRM y dispara automatizaciones'
                                                : '🏥 Clínico: Crea Paciente con historial clínico'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields Section - CENTER only */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            {!canEditFields(tier) && <LockOverlay requiredTier="CENTER" />}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                    <span>📝</span> Campos del formulario
                                    {!canEditFields(tier) && <span className="text-xs font-normal text-slate-400 ml-2">CENTER</span>}
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {template.schema.fields.map((field, index) => (
                                    <div key={field.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => moveField(index, 'up')} disabled={index === 0 || !canEditFields(tier)} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">↑</button>
                                                <button onClick={() => moveField(index, 'down')} disabled={index === template.schema.fields.length - 1 || !canEditFields(tier)} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30">↓</button>
                                            </div>
                                            <div className="flex-1 grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">Etiqueta</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                                        disabled={!canEditFields(tier)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-white disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(index, { type: e.target.value })}
                                                        disabled={!canEditFields(tier)}
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-white disabled:cursor-not-allowed"
                                                    >
                                                        {FIELD_TYPES.map((ft) => (
                                                            <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required || false}
                                                            onChange={(e) => updateField(index, { required: e.target.checked })}
                                                            disabled={!canEditFields(tier)}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                        <span className="text-sm text-slate-600">Requerido</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeField(index)}
                                                disabled={!canEditFields(tier)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addField}
                                    disabled={!canEditFields(tier)}
                                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-lg">+</span>
                                    Añadir campo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Mode */}
                {activeTab === 'preview' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <span>👁</span> Vista Previa
                            </h3>
                        </div>
                        <div className="p-6">
                            <FormRenderer
                                schema={template.schema as any}
                                onSubmit={() => { }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
