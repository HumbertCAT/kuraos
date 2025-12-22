'use client';

import { useState, useRef, useEffect } from 'react';

interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'time' | 'location' | 'medical_boolean' | 'legal_checkbox' | 'range' | 'emotion_multi' | 'boolean';
    label: string;
    required?: boolean;
    options?: (string | { label: string; value: string })[];  // Can be strings or objects
    placeholder?: string;
    disclaimer?: string;     // For legal_checkbox
    critical?: boolean;      // For medical_boolean
    min_label?: string;      // For range (e.g., "No Pain")
    max_label?: string;      // For range (e.g., "Worst Pain")
    min?: number;            // For range (default 0)
    max?: number;            // For range (default 10)
}

interface FormSchema {
    version: string;
    fields: FormField[];
}

interface FormRendererProps {
    schema: FormSchema;
    onSubmit: (answers: Record<string, any>) => void;
    submitting?: boolean;
    initialValues?: Record<string, any>;  // For prefill from URL params
}

export default function FormRenderer({ schema, onSubmit, submitting, initialValues = {} }: FormRendererProps) {
    const [answers, setAnswers] = useState<Record<string, any>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Track answered fields for progress bar
    const answeredCount = schema.fields.filter(f => {
        const val = answers[f.id];
        if (val === undefined || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
    }).length;
    const totalFields = schema.fields.length;
    const progressPercent = totalFields > 0 ? Math.round((answeredCount / totalFields) * 100) : 0;

    // Only show progress bar for longer forms (>3 fields)
    const showProgressBar = schema.fields.length > 3;

    function handleChange(fieldId: string, value: any) {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        // Clear error on change
        if (errors[fieldId]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    }

    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        for (const field of schema.fields) {
            if (field.required) {
                const value = answers[field.id];

                // For boolean fields (medical_boolean), false is a valid answer
                // Only undefined means "not answered"
                const isBooleanField = field.type === 'medical_boolean' || field.type === 'checkbox' || field.type === 'legal_checkbox' || field.type === 'boolean';

                // For array fields (emotion_multi), empty array means no selection
                const isArrayField = field.type === 'emotion_multi';

                if (isBooleanField) {
                    // For boolean fields, only undefined is invalid
                    if (value === undefined) {
                        newErrors[field.id] = 'Este campo es obligatorio';
                    }
                } else if (isArrayField) {
                    // For array fields, empty array or undefined is invalid
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        newErrors[field.id] = 'Selecciona al menos una opción';
                    }
                } else {
                    // For other fields, empty string and undefined are invalid
                    if (value === undefined || value === '') {
                        newErrors[field.id] = 'Este campo es obligatorio';
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (validate()) {
            onSubmit(answers);
        }
    }

    function renderField(field: FormField) {
        // Mobile-first: 16px minimum font to prevent iOS zoom, larger touch targets
        const baseInputClass = `w-full px-4 py-4 border rounded-xl text-base focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-slate-800 ${errors[field.id] ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
            }`;

        // Normalize field type to lowercase (DB might have UPPERCASE)
        const fieldType = field.type.toLowerCase();

        switch (fieldType) {
            case 'text':
                return (
                    <input
                        type="text"
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        disabled={submitting}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => {
                            handleChange(field.id, e.target.value);
                            // Auto-grow textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder={field.placeholder}
                        rows={3}
                        className={`${baseInputClass} resize-none overflow-hidden min-h-[100px]`}
                        disabled={submitting}
                    />
                );

            case 'select': {
                // Normalize options to {label, value} format
                const selectOptions = (field.options || []).map(opt =>
                    typeof opt === 'string' ? { label: opt, value: opt } : opt
                );
                return (
                    <select
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseInputClass}
                        disabled={submitting}
                    >
                        <option value="">Selecciona una opción...</option>
                        {selectOptions.map((opt, idx) => (
                            <option key={`${opt.value}-${idx}`} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            }

            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            id={field.id}
                            checked={answers[field.id] || false}
                            onChange={(e) => handleChange(field.id, e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                            disabled={submitting}
                        />
                        <span className="text-slate-700">{field.label}</span>
                    </label>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseInputClass}
                        disabled={submitting}
                    />
                );

            case 'time':
                return (
                    <input
                        type="time"
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={baseInputClass}
                        disabled={submitting}
                    />
                );

            case 'location':
                return (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id={field.id}
                            value={answers[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder || "Ciudad, País"}
                            className={`${baseInputClass} pl-10`}
                            disabled={submitting}
                        />
                    </div>
                );

            case 'medical_boolean':
                return (
                    <div className="space-y-2">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => handleChange(field.id, false)}
                                disabled={submitting}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${answers[field.id] === false
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange(field.id, true)}
                                disabled={submitting}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${answers[field.id] === true
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                            >
                                Sí
                            </button>
                        </div>
                        {answers[field.id] === true && (
                            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Esta información será revisada por tu terapeuta.
                            </p>
                        )}
                    </div>
                );

            case 'legal_checkbox':
                return (
                    <div className="space-y-3">
                        {field.disclaimer && (
                            <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 max-h-40 overflow-y-auto">
                                <p className="text-xs text-slate-600 font-mono leading-relaxed">
                                    {field.disclaimer}
                                </p>
                            </div>
                        )}
                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <input
                                type="checkbox"
                                id={field.id}
                                checked={answers[field.id] || false}
                                onChange={(e) => handleChange(field.id, e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                                disabled={submitting}
                            />
                            <span className="text-sm text-slate-700 font-medium">{field.label}</span>
                        </label>
                    </div>
                );

            case 'range':
            case 'scale':  // Alias - seed data uses SCALE
                const minVal = field.min ?? 0;
                const maxVal = field.max ?? 10;
                const currentVal = answers[field.id] ?? Math.floor((minVal + maxVal) / 2);

                return (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>{field.min_label || minVal}</span>
                            <span className="text-lg font-bold text-slate-800">{currentVal}</span>
                            <span>{field.max_label || maxVal}</span>
                        </div>
                        <input
                            type="range"
                            id={field.id}
                            min={minVal}
                            max={maxVal}
                            value={currentVal}
                            onChange={(e) => handleChange(field.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                            disabled={submitting}
                        />
                    </div>
                );

            case 'emotion_multi': {
                const selectedEmotions: string[] = answers[field.id] || [];
                // Normalize options to {label, value} format
                const rawEmotionOptions = field.options || ['Calm', 'Anxious', 'Happy', 'Sad', 'Angry', 'Peaceful'];
                const emotionOptions = rawEmotionOptions.map(opt =>
                    typeof opt === 'string' ? { label: opt, value: opt } : opt
                );

                const toggleEmotion = (value: string) => {
                    const updated = selectedEmotions.includes(value)
                        ? selectedEmotions.filter(e => e !== value)
                        : [...selectedEmotions, value];
                    handleChange(field.id, updated);
                };

                return (
                    <div className="flex flex-wrap gap-2">
                        {emotionOptions.map((opt, idx) => (
                            <button
                                key={`${opt.value}-${idx}`}
                                type="button"
                                onClick={() => toggleEmotion(opt.value)}
                                disabled={submitting}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedEmotions.includes(opt.value)
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                );
            }

            // Boolean fields (Yes/No toggle) - renders like medical_boolean
            case 'boolean':
                return (
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => handleChange(field.id, false)}
                            disabled={submitting}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${answers[field.id] === false
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                }`}
                        >
                            No
                        </button>
                        <button
                            type="button"
                            onClick={() => handleChange(field.id, true)}
                            disabled={submitting}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${answers[field.id] === true
                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                }`}
                        >
                            Sí
                        </button>
                    </div>
                );

            // Fallback: render as text input for any unknown types
            default:
                console.warn(`[FormRenderer] Unknown field type: ${fieldType}, rendering as text input`);
                return (
                    <input
                        type="text"
                        id={field.id}
                        value={answers[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        disabled={submitting}
                    />
                );
        }
    }

    // Check if all legal_checkbox fields are checked
    const allLegalChecked = schema.fields
        .filter(f => f.type === 'legal_checkbox' && f.required)
        .every(f => answers[f.id] === true);

    const canSubmit = allLegalChecked;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Conditional Progress Bar */}
            {showProgressBar && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm -mx-4 px-4 py-3 -mt-4 mb-6">
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-800 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {schema.fields.map((field) => (
                <div key={field.id} className="mb-6">
                    {/* Label (not shown for checkbox types - they're inline) */}
                    {!['checkbox', 'legal_checkbox'].includes(field.type) && (
                        <label htmlFor={field.id} className="block text-base font-medium text-slate-700 mb-3">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    )}

                    {/* Field */}
                    {renderField(field)}

                    {/* Error message */}
                    {errors[field.id] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
                    )}
                </div>
            ))}

            {/* Submit button */}
            <div className="pt-4">
                {!canSubmit && (
                    <p className="text-sm text-amber-600 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Debes aceptar todos los términos legales para continuar.
                    </p>
                )}
                <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="w-full bg-slate-800 text-white py-4 px-6 rounded-xl text-base font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[56px]"
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        'Enviar formulario'
                    )}
                </button>
            </div>
        </form>
    );
}
