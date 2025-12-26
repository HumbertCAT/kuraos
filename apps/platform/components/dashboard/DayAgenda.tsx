'use client';

import { useState, useEffect } from 'react';
import { Clock, Coffee, Plus, Calendar } from 'lucide-react';

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

    // Get time in minutes for comparison
    const getTimeInMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + (minutes || 0);
    };

    // Smart filtering: only show booked slots + next available slot
    const bookedSlots = slots.filter(s => s.type === 'booked');
    const upcomingBookedSlots = bookedSlots.filter(s => getTimeInMinutes(s.time) >= now);

    // Find next available slot (after now)
    const nextAvailableSlot = slots.find(s =>
        s.type === 'available' && getTimeInMinutes(s.time) >= now
    );

    // Combine: upcoming booked + ONE available slot for "Agendar"
    const visibleSlots = [...upcomingBookedSlots];
    if (nextAvailableSlot && visibleSlots.length < 5) {
        visibleSlots.push(nextAvailableSlot);
    }

    // Sort by time
    visibleSlots.sort((a, b) => getTimeInMinutes(a.time) - getTimeInMinutes(b.time));

    // Check if agenda is clear (no upcoming bookings)
    const isAgendaClear = upcomingBookedSlots.length === 0;

    return (
        <div className="bg-card border border-border rounded-xl p-5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="type-ui uppercase tracking-wider text-muted-foreground">Agenda de Hoy</h3>
                    <p className="type-body text-foreground capitalize">{today}</p>
                </div>
                {onNewBooking && (
                    <button
                        onClick={onNewBooking}
                        className="flex items-center gap-1 type-body text-brand hover:underline"
                    >
                        <Plus className="w-4 h-4" />
                        Agendar
                    </button>
                )}
            </div>

            {/* Smart Content */}
            <div className="space-y-3">
                {isAgendaClear ? (
                    /* Empty State - Beautiful */
                    <div className="bg-muted/30 border border-dashed border-border rounded-xl p-6 text-center">
                        <Coffee className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                        <p className="type-body text-foreground mb-1">Agenda despejada</p>
                        <p className="type-body text-muted-foreground leading-relaxed">
                            Tiempo para Nurture o descanso.
                        </p>
                    </div>
                ) : (
                    /* Upcoming Events List */
                    visibleSlots.map((slot, idx) => (
                        <div key={`${slot.time}-${idx}`}>
                            {slot.type === 'booked' ? (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 border-l-4 border-brand">
                                    <Calendar className="w-5 h-5 text-brand flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono type-body text-muted-foreground">{slot.time}</span>
                                        </div>
                                        <p className="type-body font-medium text-foreground truncate">{slot.title}</p>
                                        {slot.patient && (
                                            <p className="type-body text-muted-foreground truncate">{slot.patient}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={onNewBooking}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors"
                                >
                                    <Clock className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-mono type-body">{slot.time}</span>
                                    <span className="type-body">— Disponible</span>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
