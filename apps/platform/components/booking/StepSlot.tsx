/**
 * StepSlot - Date and time slot selection with timezone intelligence.
 * Displays calendar picker and available time slots in client's local timezone.
 * Features: availability dots, retry on error, week navigation.
 */
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { useBookingStore } from '@/stores/booking-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay, Locale } from 'date-fns';
import { es, enUS, ca } from 'date-fns/locale';

interface StepSlotProps {
    therapistId: string;
    locale: string;
    onNext: () => void;
    onBack: () => void;
}

interface Slot {
    start: string;
    end: string;
    spots_left: number;
}

const localeMap: Record<string, Locale> = { es, en: enUS, ca };

export function StepSlot({ therapistId, locale, onNext, onBack }: StepSlotProps) {
    const { service, selectedDate, slot: selectedSlot, setSelectedDate, setSlot, clientTimezone } = useBookingStore();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weekStart, setWeekStart] = useState(startOfDay(new Date()));

    // Track which dates have availability (for blue dots)
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const dateLocale = localeMap[locale] || enUS;

    // Generate 7 days from weekStart
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = startOfDay(new Date());

    // Load week availability when week changes
    useEffect(() => {
        if (service) {
            loadWeekAvailability();
        }
    }, [weekStart, service]);

    // Load slots when specific date is selected
    useEffect(() => {
        if (selectedDate && service) {
            loadSlots(selectedDate);
        }
    }, [selectedDate, service]);

    async function loadWeekAvailability() {
        if (!service) return;
        setLoadingAvailability(true);

        const startDate = format(days[0], 'yyyy-MM-dd');
        const endDate = format(days[6], 'yyyy-MM-dd');

        try {
            const data = await api.publicBooking.listSlots(
                therapistId,
                service.id,
                startDate,
                endDate
            );

            // Group slots by date and check availability
            const datesWithSlots = new Set<string>();
            data.forEach((slot: Slot) => {
                if (slot.spots_left > 0) {
                    const slotDate = slot.start.split('T')[0];
                    datesWithSlots.add(slotDate);
                }
            });
            setAvailableDates(datesWithSlots);
        } catch (err) {
            console.error('Error loading week availability:', err);
            // Don't show error for availability check - it's just a hint
        } finally {
            setLoadingAvailability(false);
        }
    }

    async function loadSlots(date: string) {
        if (!service) return;
        setLoading(true);
        setError(null);

        try {
            const data = await api.publicBooking.listSlots(
                therapistId,
                service.id,
                date,
                date
            );
            // Filter only available slots
            setSlots(data.filter((s: Slot) => s.spots_left > 0));
        } catch (err: any) {
            console.error('Error loading slots:', err);
            setError(err.message || 'Error al cargar los horarios');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }

    function handleRetry() {
        if (selectedDate) {
            loadSlots(selectedDate);
        }
    }

    function handleDateSelect(date: Date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        setSlot(null as any); // Reset slot selection
        setError(null);
    }

    function handleSlotSelect(slot: Slot) {
        setSlot(slot);
        onNext();
    }

    function formatSlotTime(isoString: string) {
        const date = new Date(isoString);
        return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: clientTimezone,
        });
    }

    function navigateWeek(direction: 'prev' | 'next') {
        const offset = direction === 'next' ? 7 : -7;
        const newStart = addDays(weekStart, offset);
        // Don't allow past dates
        if (newStart >= startOfDay(new Date())) {
            setWeekStart(newStart);
            setSelectedDate(null as any);
            setSlots([]);
            setError(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Service summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">Servicio seleccionado</p>
                <p className="font-semibold text-foreground">{service?.title}</p>
                <p className="text-sm text-muted-foreground">
                    {service?.duration_minutes} min • {service?.price} {service?.currency}
                </p>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateWeek('prev')}
                    disabled={weekStart <= today}
                    className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-foreground">
                    {format(days[0], 'MMMM yyyy', { locale: dateLocale })}
                </span>
                <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day selector with availability dots */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate === dateStr;
                    const isPast = day < today;
                    const hasAvailability = availableDates.has(dateStr);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => !isPast && handleDateSelect(day)}
                            disabled={isPast}
                            className={cn(
                                "relative flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all",
                                isPast && "opacity-40 cursor-not-allowed",
                                isSelected
                                    ? "bg-brand text-white"
                                    : "bg-card border border-border hover:border-brand/50"
                            )}
                        >
                            <span className="text-xs uppercase">
                                {format(day, 'EEE', { locale: dateLocale })}
                            </span>
                            <span className="text-lg font-bold">
                                {format(day, 'd')}
                            </span>

                            {/* Availability indicator dot */}
                            {!isPast && hasAvailability && !isSelected && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Timezone indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Horarios en tu zona: {clientTimezone}</span>
            </div>

            {/* Time slots */}
            <div className="min-h-[200px]">
                {!selectedDate ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        Selecciona un día para ver los horarios disponibles
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive opacity-70" />
                        <p className="text-destructive text-sm mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </button>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        No hay horarios disponibles este día.
                        <br />
                        Prueba con otra fecha.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSlotSelect(slot)}
                                className={cn(
                                    "px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95",
                                    selectedSlot?.start === slot.start
                                        ? "bg-brand text-white shadow-lg"
                                        : "bg-card border border-border hover:border-brand hover:bg-accent"
                                )}
                            >
                                {formatSlotTime(slot.start)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Cambiar servicio
            </button>
        </div>
    );
}
