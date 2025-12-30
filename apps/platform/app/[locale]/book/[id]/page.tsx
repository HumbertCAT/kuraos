/**
 * Public Booking Page - The Revenue Engine
 * 
 * This page is UNAUTHENTICATED and allows external clients to book sessions.
 * Uses the BookingWizard component for a multi-step booking flow with Stripe payment.
 */
'use client';

import { useParams } from 'next/navigation';
import { BookingWizard } from '@/components/booking';

export default function PublicBookingPage() {
    const params = useParams();
    const therapistId = params.id as string;
    const locale = (params.locale as string) || 'es';

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Reservar Sesión
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Selecciona un servicio, fecha y completa tu reserva
                    </p>
                </div>

                {/* Wizard */}
                <BookingWizard
                    therapistId={therapistId}
                    locale={locale}
                />

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-muted-foreground">
                    <p>
                        Pago seguro procesado por Stripe.
                        {' '}
                        <a
                            href="https://kuraos.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                        >
                            Powered by KURA OS
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
