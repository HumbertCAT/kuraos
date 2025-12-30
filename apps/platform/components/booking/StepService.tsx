/**
 * StepService - Service selection step for booking wizard.
 * Displays available services as premium cards with radio selection.
 */
'use client';

import { Clock, CreditCard, Users, User } from 'lucide-react';
import { BookingService, useBookingStore } from '@/stores/booking-store';
import { cn } from '@/lib/utils';

interface StepServiceProps {
    services: BookingService[];
    onNext: () => void;
}

export function StepService({ services, onNext }: StepServiceProps) {
    const { service: selectedService, setService } = useBookingStore();

    function handleSelect(service: BookingService) {
        setService(service);
        onNext();
    }

    if (services.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No hay servicios disponibles</h3>
                <p className="text-muted-foreground mt-1">
                    Este terapeuta aún no ha configurado sus servicios.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {services.map((service) => (
                <button
                    key={service.id}
                    onClick={() => handleSelect(service)}
                    className={cn(
                        "w-full text-left p-6 rounded-xl border-2 transition-all duration-200",
                        "bg-card hover:bg-accent/50 active:scale-[0.99]",
                        selectedService?.id === service.id
                            ? "border-brand ring-2 ring-brand/20"
                            : "border-border hover:border-brand/50"
                    )}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground">
                                {service.title}
                            </h3>
                            {service.description && (
                                <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                                    {service.description}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground">
                                    <Clock className="w-4 h-4 text-brand" />
                                    {service.duration_minutes} min
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-600">
                                    <CreditCard className="w-4 h-4" />
                                    {service.price} {service.currency}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground">
                                    {service.kind === 'GROUP' ? (
                                        <><Users className="w-3 h-3" /> Grupal</>
                                    ) : (
                                        <><User className="w-3 h-3" /> Individual</>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Radio indicator */}
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 mt-1 transition-colors",
                            selectedService?.id === service.id
                                ? "border-brand bg-brand"
                                : "border-muted-foreground/30"
                        )}>
                            {selectedService?.id === service.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
