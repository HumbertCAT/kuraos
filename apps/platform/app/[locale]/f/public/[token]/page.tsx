'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertTriangle, Sparkles, Send } from 'lucide-react';

// Types matching backend schema
interface FormSchema {
    title: string;
    description: string | null;
    schema: Record<string, unknown>;
    therapy_type: string;
    form_type: string;
    patient_first_name: string;
    expires_at: string;
}

interface FormField {
    id: string;
    type: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function PublicFormPage() {
    const params = useParams();
    const token = params.token as string;

    const [formData, setFormData] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        async function fetchForm() {
            try {
                const res = await fetch(`${API_URL}/public/forms/public/${token}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Este formulario no existe o ya no está disponible.');
                    } else {
                        setError('Error al cargar el formulario.');
                    }
                    return;
                }
                const data = await res.json();
                setFormData(data);
            } catch (e) {
                setError('Error de conexión. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchForm();
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Extract name and email - prioritize fixed fields, fallback to answers
        const finalName = name || answers['name'] || '';
        const finalEmail = email || answers['email'] || '';

        if (!finalEmail || !finalName) {
            alert('Por favor, completa tu nombre y email.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/public/forms/public/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: finalName,
                    email: finalEmail,
                    answers,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                alert(data.detail || 'Error al enviar el formulario.');
            }
        } catch (e) {
            alert('Error de conexión. Por favor, intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando formulario...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md text-center border border-border">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Formulario no disponible</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    // Success state
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md text-center border border-border">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">¡Gracias!</h1>
                    <p className="text-muted-foreground">Tu información ha sido recibida correctamente. Nos pondremos en contacto contigo pronto.</p>
                </div>
            </div>
        );
    }

    // Parse schema fields (simplified - supports basic field types)
    const fields: FormField[] = (formData?.schema?.fields as FormField[]) || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Formulario de Bienestar
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {formData?.title || 'Formulario'}
                    </h1>
                    {formData?.description && (
                        <p className="text-muted-foreground text-lg">{formData.description}</p>
                    )}
                </div>

                {/* Form Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Dynamic Fields from Schema */}
                        {fields.map((field) => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    {field.label} {field.required && '*'}
                                </label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={answers[field.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                                        required={field.required}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-brand focus:border-transparent transition-all min-h-[120px]"
                                        placeholder={field.placeholder}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        value={answers[field.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                                        required={field.required}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                    >
                                        <option value="">Selecciona una opción</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        value={answers[field.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                                        required={field.required}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-gradient-to-r from-brand to-brand/80 text-white font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Enviar
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Powered by KURA OS · Tu información está protegida
                </p>
            </div>
        </div>
    );
}
