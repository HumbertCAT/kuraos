'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import FormRenderer from '@/components/FormRenderer';

interface FormSchema {
    version: string;
    fields: Array<{
        id: string;
        type: 'text' | 'textarea' | 'select' | 'checkbox';
        label: string;
        required?: boolean;
        options?: string[];
        placeholder?: string;
    }>;
}

interface FormData {
    title: string;
    description: string | null;
    schema: FormSchema;
    therapy_type: string;
    form_type: string;
    patient_first_name: string;
    expires_at: string;
}

interface SubmissionResult {
    success: boolean;
    message: string;
    risk_level: string;
    requires_review: boolean;
    is_flagged: boolean;
}

export default function PublicFormPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params.token as string;

    const [formData, setFormData] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

    // Build prefill values from URL params
    const initialValues = useMemo(() => {
        const values: Record<string, string> = {};
        const prefillName = searchParams.get('prefill_name');
        const prefillEmail = searchParams.get('prefill_email');

        // Map common field IDs that might be used in templates
        if (prefillName) {
            values['full_name'] = prefillName;
            values['name'] = prefillName;
            values['nombre_completo'] = prefillName;
        }
        if (prefillEmail) {
            values['email'] = prefillEmail;
            values['correo'] = prefillEmail;
        }
        return values;
    }, [searchParams]);

    useEffect(() => {
        loadForm();
    }, [token]);

    async function loadForm() {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/public/forms/${token}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Este formulario no existe o ha expirado.');
                } else {
                    setError('Error al cargar el formulario.');
                }
                return;
            }

            const data = await response.json();
            setFormData(data);
        } catch (err) {
            setError('Error de conexión. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(answers: Record<string, any>) {
        setSubmitting(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/public/forms/${token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers }),
                }
            );

            if (!response.ok) {
                throw new Error('Error al enviar el formulario');
            }

            const result = await response.json();
            setSubmissionResult(result);
            setSubmitted(true);
        } catch (err) {
            setError('Error al enviar el formulario. Por favor, inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
                    <p className="text-slate-600">Cargando formulario...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-800 mb-2">Formulario no disponible</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    // Success state - with Safety Hold for CRITICAL risk
    if (submitted && submissionResult) {
        const isCritical = submissionResult.risk_level === 'CRITICAL';
        const needsReview = submissionResult.requires_review || submissionResult.is_flagged;

        // Safety Hold page for CRITICAL submissions
        if (isCritical) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-2 border-amber-200">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-slate-800 mb-2">Revisión de Seguridad</h1>
                        <p className="text-slate-600 mb-4">
                            Gracias por tu honestidad, {formData?.patient_first_name}.
                        </p>
                        <p className="text-sm text-slate-500 bg-amber-50 p-4 rounded-lg">
                            Basándonos en tu historial médico, necesitamos revisar tu solicitud
                            antes de continuar. Tu terapeuta te contactará personalmente en breve.
                        </p>
                    </div>
                </div>
            );
        }

        // Review needed (HIGH risk, but not CRITICAL)
        if (needsReview) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-slate-800 mb-2">¡Formulario enviado!</h1>
                        <p className="text-slate-600">
                            Gracias, {formData?.patient_first_name}. Tu terapeuta revisará
                            tus respuestas y se pondrá en contacto contigo.
                        </p>
                    </div>
                </div>
            );
        }

        // Normal success
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-800 mb-2">¡Formulario enviado!</h1>
                    <p className="text-slate-600">
                        Gracias por completar el formulario, {formData?.patient_first_name}.
                        Tu terapeuta recibirá tus respuestas.
                    </p>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-8 text-white">
                        <h1 className="text-2xl font-bold mb-2">{formData?.title}</h1>
                        {formData?.description && (
                            <p className="text-slate-300">{formData.description}</p>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <p className="text-sm text-slate-600">
                            Hola <span className="font-medium">{formData?.patient_first_name}</span>,
                            por favor completa el siguiente formulario.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    {formData?.schema && (
                        <FormRenderer
                            schema={formData.schema}
                            onSubmit={handleSubmit}
                            submitting={submitting}
                            initialValues={initialValues}
                        />
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    Powered by TherapistOS
                </p>
            </div>
        </div>
    );
}
