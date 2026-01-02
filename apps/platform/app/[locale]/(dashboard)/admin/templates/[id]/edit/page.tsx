'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import FormRenderer from '@/components/FormRenderer';
import RichTextEditor from '@/components/ui/RichTextEditor';

import { API_URL } from '@/lib/api';

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
    organization_id?: string | null;  // null = system template
    title: string;
    description: string;
    risk_level: string;
    therapy_type: string;
    form_type: string;
    schema: { version: string; fields: FormField[] };
    public_token?: string | null;
    is_active: boolean;
    config?: {
        prerequisites?: {
            screening_required?: boolean;
        };
    };
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

function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export default function TemplateBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;
    const locale = params.locale as string || 'en';
    const isNew = templateId === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
    const [publishLoading, setPublishLoading] = useState(false);

    const [template, setTemplate] = useState<TemplateData>({
        title: '',
        description: '',
        risk_level: 'LOW',
        therapy_type: 'GENERAL',
        form_type: 'INTAKE',
        schema: { version: '1.0', fields: [] },
        is_active: true,
        config: {},
    });

    useEffect(() => {
        if (!isNew) {
            loadTemplate();
        }
    }, [templateId]);

    async function loadTemplate() {
        try {
            const response = await fetch(
                `${API_URL}/forms/admin/templates/${templateId}`,
                { credentials: 'include' }
            );

            if (!response.ok) throw new Error('Failed to load');

            const data = await response.json();
            setTemplate({
                id: data.id,
                organization_id: data.organization_id,  // null for system templates
                title: data.title,
                description: data.description || '',
                risk_level: data.risk_level,
                therapy_type: data.therapy_type,
                form_type: data.form_type,
                schema: data.schema || { version: '1.0', fields: [] },
                public_token: data.public_token,
                is_active: data.is_active,
                config: data.config || {},
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
            const url = isNew
                ? `${API_URL}/forms/admin/templates`
                : `${API_URL}/forms/admin/templates/${templateId}`;

            const response = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: template.title,
                    description: template.description,
                    schema: template.schema,
                    risk_level: template.risk_level,
                    therapy_type: template.therapy_type,
                    form_type: template.form_type,
                    is_active: template.is_active,
                    config: template.config,
                }),
            });

            if (response.ok) {
                if (isNew) {
                    const data = await response.json();
                    router.push(`/${locale}/admin/templates/${data.id}/edit`);
                }
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
                `${API_URL}/forms/admin/templates/${template.id}/publish`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
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

    function addField() {
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
        const fields = [...template.schema.fields];
        fields[index] = { ...fields[index], ...updates };

        // Auto-update ID when label changes
        if (updates.label && !updates.id) {
            fields[index].id = slugify(updates.label);
        }

        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    function removeField(index: number) {
        const fields = template.schema.fields.filter((_, i) => i !== index);
        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    function moveField(index: number, direction: 'up' | 'down') {
        const fields = [...template.schema.fields];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;

        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
        setTemplate({
            ...template,
            schema: { ...template.schema, fields },
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted">
            {/* Header - Simplified */}
            <div className="bg-card border-b border-border px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <Link href={`/${locale}/admin?tab=templates`} className="text-foreground/60 hover:text-foreground text-sm">
                            ← Volver a formularios
                        </Link>
                        <h1 className="text-xl font-bold text-foreground">
                            {isNew ? 'Nuevo Template' : template.title || 'Editar Template'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Active Toggle with Tooltip */}
                        <div className="relative group flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setTemplate({ ...template, is_active: !template.is_active })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${template.is_active ? 'bg-emerald-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${template.is_active ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                            <span className="text-sm text-foreground/70 cursor-help">
                                {template.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                <div className="bg-primary text-primary-foreground text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                                    {template.is_active
                                        ? 'Este formulario está visible para ser asignado a pacientes y servicios.'
                                        : 'Este formulario no aparecerá en las listas de selección.'
                                    }
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-muted"></div>

                        {activeTab === 'preview' ? (
                            <button
                                onClick={() => setActiveTab('builder')}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                ← Volver al editor
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveTab('preview')}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                👁 Vista Previa
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto py-6 px-6">
                {/* Builder Mode */}
                {activeTab === 'builder' && (
                    <div className="space-y-6">
                        {/* Publicación Section - First! Only for org templates */}
                        {!isNew && template.organization_id && template.risk_level !== 'CRITICAL' && (
                            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-border">
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
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
                                                    <p className="text-xs text-emerald-600">Cualquier persona puede completar este formulario con el enlace</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/f/public/${template.public_token}`}
                                                    className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 font-mono bg-muted"
                                                />
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${locale}/f/public/${template.public_token}`)}
                                                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
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
                                            <div className="flex items-start gap-3 p-4 bg-muted rounded-xl border border-border">
                                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xl">💡</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">¿Para qué sirve publicar?</p>
                                                    <p className="text-xs text-foreground/60 mt-1">
                                                        Al publicar, se genera un enlace público que puedes compartir en redes sociales,
                                                        WhatsApp o tu web. Cualquier persona podrá completar el formulario sin necesidad
                                                        de cuenta, y sus respuestas crearán automáticamente un nuevo paciente en tu sistema.
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

                        {/* Config Section */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-border">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <span>⚙️</span> Configuración del formulario
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={template.title}
                                        onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                        placeholder="Nombre del formulario"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
                                    <RichTextEditor
                                        value={template.description}
                                        onChange={(value) => setTemplate({ ...template, description: value })}
                                        placeholder="Describe el propósito de este formulario..."
                                        minHeight="100px"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Nivel de Riesgo
                                            {template.risk_level === 'HIGH' && <span className="ml-2">⚠️</span>}
                                            {template.risk_level === 'CRITICAL' && <span className="ml-2">🚨</span>}
                                        </label>
                                        <select
                                            value={template.risk_level}
                                            onChange={(e) => setTemplate({ ...template, risk_level: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                                        >
                                            {RISK_LEVELS.map((level) => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tipo de Terapia</label>
                                        <select
                                            value={template.therapy_type}
                                            onChange={(e) => setTemplate({ ...template, therapy_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                                        >
                                            {THERAPY_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tipo de Formulario</label>
                                        <select
                                            value={template.form_type}
                                            onChange={(e) => setTemplate({ ...template, form_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                                        >
                                            {FORM_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields Section */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-border flex justify-between items-center">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <span>📝</span> Campos del formulario
                                </h3>
                                <span className="text-sm text-foreground/60">{template.schema.fields.length} campos</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {template.schema.fields.map((field, index) => (
                                    <div key={field.id} className="bg-muted rounded-xl p-5 border border-border hover:border-border transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-muted-foreground font-mono text-sm">#{index + 1}</span>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(index, { type: e.target.value })}
                                                    className="px-3 py-2 border border-border rounded-lg text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                >
                                                    {FIELD_TYPES.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => moveField(index, 'up')}
                                                    className="p-2 text-muted-foreground hover:text-foreground/70 hover:bg-muted rounded-lg transition-colors"
                                                    disabled={index === 0}
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveField(index, 'down')}
                                                    className="p-2 text-muted-foreground hover:text-foreground/70 hover:bg-muted rounded-lg transition-colors"
                                                    disabled={index === template.schema.fields.length - 1}
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeField(index)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="col-span-2">
                                                <label className="text-xs font-medium text-foreground/60 mb-1 block">Etiqueta</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                    placeholder="Pregunta o campo"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-foreground/60 mb-1 block">ID interno</label>
                                                <input
                                                    type="text"
                                                    value={field.id}
                                                    onChange={(e) => updateField(index, { id: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/60 font-mono bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required || false}
                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                    className="w-4 h-4 rounded border-border text-foreground focus:ring-ring"
                                                />
                                                <span className="text-foreground/70">Campo obligatorio</span>
                                            </label>

                                            {field.type === 'medical_boolean' && (
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.critical || false}
                                                        onChange={(e) => updateField(index, { critical: e.target.checked })}
                                                        className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <span className="text-red-600 font-medium">🚨 Crítico</span>
                                                </label>
                                            )}
                                        </div>

                                        {/* Conditional inputs based on type */}
                                        {(field.type === 'select' || field.type === 'emotion_multi') && (
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <label className="text-xs font-medium text-foreground/60 mb-1 block">Opciones (separadas por coma)</label>
                                                <input
                                                    type="text"
                                                    value={(field.options || []).join(', ')}
                                                    onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                    placeholder="Opción 1, Opción 2, Opción 3"
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                            </div>
                                        )}

                                        {field.type === 'range' && (
                                            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-medium text-foreground/60 mb-1 block">Etiqueta mínimo</label>
                                                    <input
                                                        type="text"
                                                        value={field.min_label || ''}
                                                        onChange={(e) => updateField(index, { min_label: e.target.value })}
                                                        placeholder="Ej: Sin dolor"
                                                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-foreground/60 mb-1 block">Etiqueta máximo</label>
                                                    <input
                                                        type="text"
                                                        value={field.max_label || ''}
                                                        onChange={(e) => updateField(index, { max_label: e.target.value })}
                                                        placeholder="Ej: Dolor intenso"
                                                        className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {field.type === 'legal_checkbox' && (
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <label className="text-xs font-medium text-foreground/60 mb-1 block">Texto del disclaimer</label>
                                                <textarea
                                                    value={field.disclaimer || ''}
                                                    onChange={(e) => updateField(index, { disclaimer: e.target.value })}
                                                    rows={3}
                                                    placeholder="Ingresa el texto legal..."
                                                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-foreground/70 bg-card focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={addField}
                                    className="w-full py-4 border-2 border-dashed border-border rounded-xl text-foreground/60 hover:border-border hover:text-foreground hover:bg-accent flex items-center justify-center gap-2 transition-all text-sm font-medium"
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
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-border">
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span>👁</span> Vista previa del formulario
                            </h3>
                        </div>
                        <div className="p-6">
                            {template.schema.fields.length > 0 ? (
                                <FormRenderer
                                    schema={template.schema as any}
                                    onSubmit={(answers) => console.log('Preview answers:', answers)}
                                    submitting={false}
                                />
                            ) : (
                                <p className="text-muted-foreground text-center py-12">
                                    Añade campos en el editor para ver la vista previa
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
