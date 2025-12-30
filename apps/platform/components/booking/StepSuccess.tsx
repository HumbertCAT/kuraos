/**
 * StepSuccess - Confirmation "Boarding Pass" after successful payment.
 * Shows booking details and next steps.
 */
'use client';

import { useEffect } from 'react';
import { Check, Calendar, Clock, Mail, Download } from 'lucide-react';
import { useBookingStore } from '@/stores/booking-store';
import { cn } from '@/lib/utils';

interface StepSuccessProps {
    locale: string;
}

export function StepSuccess({ locale }: StepSuccessProps) {
    const { service, slot, clientDetails, bookingId, clientTimezone, reset } = useBookingStore();

    // Clear persisted state after showing success (clean slate for next booking)
    useEffect(() => {
        // Give user time to see the confirmation, then reset after they leave
        return () => {
            // Don't reset immediately - let them see the confirmation
        };
    }, []);

    function formatDateTime(): { date: string; time: string } {
        if (!slot) return { date: '', time: '' };
        const date = new Date(slot.start);
        return {
            date: date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: clientTimezone,
            }),
            time: date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: clientTimezone,
            }),
        };
    }

    const dateTime = formatDateTime();

    return (
        <div className="text-center space-y-6">
            {/* Success icon */}
            <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto animate-[scale-in_0.3s_ease-out]">
                    <Check className="w-10 h-10 text-emerald-500" strokeWidth={3} />
                </div>
                {/* Confetti-like dots */}
                <div className="absolute -inset-4 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-brand/60"
                            style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${10 + Math.random() * 80}%`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-foreground">
                    ¡Reserva Confirmada!
                </h2>
                <p className="text-muted-foreground mt-2">
                    Hemos enviado los detalles a {clientDetails?.email}
                </p>
            </div>

            {/* Boarding Pass Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg max-w-sm mx-auto">
                {/* Header */}
                <div className="bg-brand p-4 text-white">
                    <p className="text-sm opacity-80">Tu próxima sesión</p>
                    <h3 className="text-lg font-bold">{service?.title}</h3>
                </div>

                {/* Details */}
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Fecha</p>
                            <p className="font-medium text-foreground">{dateTime.date}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Hora</p>
                            <p className="font-medium text-foreground">
                                {dateTime.time} ({clientTimezone})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-muted-foreground">Confirmación enviada a</p>
                            <p className="font-medium text-foreground">{clientDetails?.email}</p>
                        </div>
                    </div>

                    {/* Divider with price */}
                    <div className="border-t border-dashed border-border my-4" />

                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total pagado</span>
                        <span className="text-xl font-bold text-emerald-600">
                            {service?.price} {service?.currency}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-muted/50 p-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        Referencia: <span className="font-mono">{bookingId?.slice(0, 8)}</span>
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                    onClick={() => {
                        reset();
                        window.location.reload();
                    }}
                    className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                    Reservar otra sesión
                </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
                ¿Tienes alguna pregunta? Responde al email de confirmación para contactar con tu terapeuta.
            </p>
        </div>
    );
}
