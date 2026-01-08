/**
 * BookingWizard - Main orchestrator for the public booking flow.
 * Manages step navigation and renders appropriate step components.
 */
'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useBookingStore, BookingService } from '@/stores/booking-store';
import { StepService } from './StepService';
import { StepSlot } from './StepSlot';
import { StepForm } from './StepForm';
import { StepPayment } from './StepPayment';
import { StepSuccess } from './StepSuccess';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Step = 'service' | 'slot' | 'form' | 'payment' | 'success';

interface BookingWizardProps {
    therapistId: string;
    locale: string;
}

const STEPS: { id: Step; label: string }[] = [
    { id: 'service', label: 'Servicio' },
    { id: 'slot', label: 'Horario' },
    { id: 'form', label: 'Datos' },
    { id: 'payment', label: 'Pago' },
];

export function BookingWizard({ therapistId, locale }: BookingWizardProps) {
    const [currentStep, setCurrentStep] = useState<Step>('service');
    const [services, setServices] = useState<BookingService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const {
        service: selectedService,
        slot: selectedSlot,
        clientSecret,
        setTherapistId,
        reset,
    } = useBookingStore();

    // Hydration guard - prevents mismatch between server and persisted client state
    useEffect(() => {
        setMounted(true);
    }, []);

    // Initialize therapist and check for existing session
    useEffect(() => {
        if (!mounted) return;

        setTherapistId(therapistId);
        loadServices();

        // Resume session if data exists
        if (selectedService && selectedSlot && clientSecret) {
            setCurrentStep('payment');
        } else if (selectedService && selectedSlot) {
            setCurrentStep('form');
        } else if (selectedService) {
            setCurrentStep('slot');
        }
    }, [therapistId, mounted]);

    async function loadServices() {
        setLoading(true);
        try {
            const data = await api.publicBooking.listServices(therapistId);
            setServices(data);
        } catch (err: any) {
            setError('No se pudieron cargar los servicios');
        } finally {
            setLoading(false);
        }
    }

    function goToStep(step: Step) {
        setCurrentStep(step);
    }

    function getCurrentStepIndex() {
        return STEPS.findIndex(s => s.id === currentStep);
    }

    // Hydration skeleton - show while client mounts
    if (!mounted) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="space-y-4 w-full max-w-md">
                    <div className="h-2 bg-muted rounded-full animate-pulse" />
                    <div className="h-32 bg-muted rounded-2xl animate-pulse" />
                    <div className="h-32 bg-muted rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">😕</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Oops</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Success step (no progress bar)
    if (currentStep === 'success') {
        return <StepSuccess locale={locale} />;
    }

    return (
        <div className="space-y-8">
            {/* Progress bar */}
            <div className="relative">
                {/* Line behind */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                <div
                    className="absolute top-4 left-0 h-0.5 bg-brand transition-all duration-300"
                    style={{ width: `${(getCurrentStepIndex() / (STEPS.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                    {STEPS.map((step, index) => {
                        const isCompleted = index < getCurrentStepIndex();
                        const isCurrent = step.id === currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                        isCompleted && "bg-brand text-white",
                                        isCurrent && "bg-brand text-white ring-4 ring-brand/20",
                                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground border border-border"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xs mt-2 hidden sm:block",
                                    isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
                {currentStep === 'service' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                Selecciona un servicio
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Elige el tipo de sesión que deseas reservar
                            </p>
                        </div>
                        <StepService
                            services={services}
                            onNext={() => goToStep('slot')}
                        />
                    </>
                )}

                {currentStep === 'slot' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                Elige fecha y hora
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Selecciona un horario que te convenga
                            </p>
                        </div>
                        <StepSlot
                            therapistId={therapistId}
                            locale={locale}
                            onNext={() => goToStep('form')}
                            onBack={() => goToStep('service')}
                        />
                    </>
                )}

                {currentStep === 'form' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                Tus datos
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Necesitamos algunos datos para confirmar tu reserva
                            </p>
                        </div>
                        <StepForm
                            therapistId={therapistId}
                            locale={locale}
                            onNext={() => {
                                // Skip payment for free services
                                if (selectedService && selectedService.price === 0) {
                                    goToStep('success');
                                } else {
                                    goToStep('payment');
                                }
                            }}
                            onBack={() => goToStep('slot')}
                        />
                    </>
                )}

                {currentStep === 'payment' && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                Completa tu pago
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Pago seguro con tarjeta o Apple/Google Pay
                            </p>
                        </div>
                        <StepPayment
                            locale={locale}
                            onSuccess={() => goToStep('success')}
                        />
                    </>
                )}
            </div>

            {/* Reset link */}
            {currentStep !== 'service' && currentStep !== 'payment' && (
                <div className="text-center">
                    <button
                        onClick={() => {
                            reset();
                            setCurrentStep('service');
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Empezar de nuevo
                    </button>
                </div>
            )}
        </div>
    );
}
