'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Clock, Plus } from 'lucide-react';

interface TimeSlot {
    time: string;
    type: 'available' | 'booked';
    title?: string;
    patient?: string;
}

interface DayAgendaProps {
    slots: TimeSlot[];
    onNewBooking?: () => void;
}

export function DayAgenda({ slots, onNewBooking }: DayAgendaProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    // Calculate "Now" line position
    const getTimeInMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + (minutes || 0);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="type-h2 text-sm">Agenda de Hoy</h3>
                    <p className="text-xs text-muted-foreground capitalize">{today}</p>
                </div>
                {onNewBooking && (
                    <button
                        onClick={onNewBooking}
                        className="flex items-center gap-1 text-xs text-brand hover:underline"
                    >
                        <Plus className="w-3 h-3" />
                        Agendar
                    </button>
                )}
            </div>

            {/* Timeline */}
            <div className="relative space-y-2">
                {slots.map((slot, idx) => {
                    const slotMinutes = getTimeInMinutes(slot.time);
                    const nextSlotMinutes = slots[idx + 1]
                        ? getTimeInMinutes(slots[idx + 1].time)
                        : slotMinutes + 60;

                    // Check if "Now" line should appear before this slot
                    const showNowLine = now >= slotMinutes && now < nextSlotMinutes;

                    return (
                        <div key={`${slot.time}-${idx}`} className="relative">
                            {/* Now Line */}
                            {showNowLine && (
                                <div className="absolute left-0 right-0 flex items-center gap-2 z-10"
                                    style={{ top: `${((now - slotMinutes) / (nextSlotMinutes - slotMinutes)) * 100}%` }}>
                                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <div className="flex-1 h-0.5 bg-brand" />
                                    <span className="text-[10px] font-mono text-brand">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}

                            {/* Slot */}
                            {slot.type === 'available' ? (
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors cursor-pointer">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-mono">{slot.time}</span>
                                    <span className="text-xs">Disponible</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 border-l-4 border-brand">
                                    <Clock className="w-4 h-4 text-brand" />
                                    <div className="flex-1">
                                        <span className="text-xs font-mono text-muted-foreground">{slot.time}</span>
                                        <p className="text-sm font-medium text-foreground">{slot.title}</p>
                                        {slot.patient && (
                                            <p className="text-xs text-muted-foreground">{slot.patient}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {slots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Sin citas programadas hoy
                    </div>
                )}
            </div>
        </div>
    );
}
