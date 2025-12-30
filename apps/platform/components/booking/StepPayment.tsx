/**
 * StepPayment - Stripe PaymentElement for secure payment processing.
 * Includes expiration timer for zombie booking prevention.
 */
'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Clock, AlertCircle, Loader2, Shield } from 'lucide-react';
import { useBookingStore } from '@/stores/booking-store';
import { cn } from '@/lib/utils';

// Initialize Stripe outside component to avoid re-renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StepPaymentProps {
    locale: string;
    onSuccess: () => void;
}

function PaymentForm({ locale, onSuccess }: { locale: string; onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const { service, getRemainingSeconds, isExpired, reset } = useBookingStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState(getRemainingSeconds());

    // Update timer every second
    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = getRemainingSeconds();
            setRemainingTime(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [getRemainingSeconds]);

    // Format timer display
    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!stripe || !elements) return;

        // Check expiration
        if (isExpired()) {
            setError('Tu sesión ha expirado. Por favor, vuelve a seleccionar un horario.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw new Error(submitError.message);
            }

            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
            });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent?.status === 'succeeded') {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    }

    // Expired state
    if (isExpired()) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Sesión expirada</h3>
                <p className="text-muted-foreground mt-2">
                    El tiempo para completar tu reserva ha terminado.
                </p>
                <button
                    onClick={reset}
                    className="mt-6 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-colors"
                >
                    Empezar de nuevo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Timer warning */}
            <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                remainingTime <= 120
                    ? "bg-destructive/10 border border-destructive/20"
                    : "bg-amber-500/10 border border-amber-500/20"
            )}>
                <Clock className={cn(
                    "w-5 h-5",
                    remainingTime <= 120 ? "text-destructive" : "text-amber-600"
                )} />
                <div className="flex-1">
                    <p className={cn(
                        "text-sm font-medium",
                        remainingTime <= 120 ? "text-destructive" : "text-amber-700"
                    )}>
                        Tu reserva expira en {formatTime(remainingTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Completa el pago para confirmar tu sesión
                    </p>
                </div>
            </div>

            {/* Payment summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border flex justify-between items-center">
                <span className="text-foreground font-medium">{service?.title}</span>
                <span className="text-xl font-bold text-foreground">
                    {service?.price} {service?.currency}
                </span>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Stripe PaymentElement */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                    <PaymentElement
                        options={{
                            layout: 'tabs',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !stripe || !elements}
                    className="w-full py-4 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Procesando pago...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-5 h-5" />
                            Pagar {service?.price} {service?.currency}
                        </>
                    )}
                </button>
            </form>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Pago seguro procesado por Stripe</span>
            </div>
        </div>
    );
}

export function StepPayment({ locale, onSuccess }: StepPaymentProps) {
    const { clientSecret } = useBookingStore();

    if (!clientSecret) {
        return (
            <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
                <p className="text-muted-foreground mt-4">Preparando pago...</p>
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#6366f1',
                        borderRadius: '12px',
                    },
                },
            }}
        >
            <PaymentForm locale={locale} onSuccess={onSuccess} />
        </Elements>
    );
}
