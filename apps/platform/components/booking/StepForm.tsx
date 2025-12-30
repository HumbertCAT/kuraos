/**
 * StepForm - Client details form with useState validation.
 * Collects name, email, phone, and optional notes.
 */
'use client';

import { useState, FormEvent } from 'react';
import { User, Mail, Phone, FileText, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { useBookingStore, ClientDetails } from '@/stores/booking-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StepFormProps {
    therapistId: string;
    locale: string;
    onNext: () => void;
    onBack: () => void;
}

const BOOKING_EXPIRATION_MINUTES = 10;

export function StepForm({ therapistId, locale, onNext, onBack }: StepFormProps) {
    const {
        service,
        slot,
        clientDetails,
        setClientDetails,
        setPaymentIntent,
        setExpiration,
        clientTimezone
    } = useBookingStore();

    // Form state
    const [name, setName] = useState(clientDetails?.name || '');
    const [email, setEmail] = useState(clientDetails?.email || '');
    const [phone, setPhone] = useState(clientDetails?.phone || '');
    const [notes, setNotes] = useState(clientDetails?.notes || '');

    // Validation errors
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function validate(): boolean {
        const newErrors: { name?: string; email?: string } = {};

        if (!name || name.length < 2) {
            newErrors.name = 'Mínimo 2 caracteres';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            newErrors.email = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleFormSubmit(e: FormEvent) {
        e.preventDefault();

        if (!validate()) return;
        if (!service || !slot) return;

        setSubmitting(true);
        setError(null);

        try {
            // Save client details to store
            const details: ClientDetails = { name, email, phone, notes };
            setClientDetails(details);

            // Step 1: Create booking (PENDING status)
            const bookingResult = await api.publicBooking.createBooking({
                service_id: service.id,
                therapist_id: therapistId,
                slot_start: slot.start,
                target_timezone: clientTimezone,
                patient_name: name,
                patient_email: email,
                patient_phone: phone || null,
                patient_notes: notes || null,
            });

            // Step 2: Create payment intent
            const paymentResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ booking_id: bookingResult.booking_id }),
            });

            if (!paymentResult.ok) {
                const err = await paymentResult.json();
                throw new Error(err.detail || 'Error al procesar el pago');
            }

            const paymentData = await paymentResult.json();

            // Store in Zustand
            setPaymentIntent(bookingResult.booking_id, paymentData.client_secret);
            setExpiration(BOOKING_EXPIRATION_MINUTES);

            onNext();
        } catch (err: any) {
            console.error('Booking error:', err);
            setError(err.message || 'Error al crear la reserva. Inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    function formatSlotDisplay() {
        if (!slot) return '';
        const date = new Date(slot.start);
        return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: clientTimezone,
        });
    }

    return (
        <div className="space-y-6">
            {/* Booking summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-medium text-foreground">{service?.title}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuándo</span>
                    <span className="font-medium text-foreground">{formatSlotDisplay()}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                        {service?.price} {service?.currency}
                    </span>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Nombre completo *
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre"
                            className={cn(
                                "w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-foreground",
                                "focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all",
                                errors.name ? "border-destructive" : "border-border"
                            )}
                        />
                    </div>
                    {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Email *
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className={cn(
                                "w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-foreground",
                                "focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all",
                                errors.email ? "border-destructive" : "border-border"
                            )}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-xs text-destructive mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Teléfono <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+34 600 000 000"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Notas <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="¿Algo que debamos saber antes de la sesión?"
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        'Continuar al pago'
                    )}
                </button>
            </form>

            {/* Back button */}
            <button
                onClick={onBack}
                disabled={submitting}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
                <ChevronLeft className="w-4 h-4" />
                Cambiar horario
            </button>
        </div>
    );
}
