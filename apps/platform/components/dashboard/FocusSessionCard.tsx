'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Clock, Coffee, AlertTriangle, ChevronRight, Calendar, User } from 'lucide-react';

interface NextSession {
    id: string;
    patientName: string;
    patientInitials: string;
    serviceName: string;
    startTime: Date;
    aletheiaInsight?: {
        type: 'warning' | 'info' | 'success';
        message: string;
    };
}

interface FocusSessionCardProps {
    nextSession?: NextSession | null;
    onViewFullAgenda?: () => void;
}

/**
 * FocusSessionCard - "The Present"
 * 
 * Shows the next upcoming session (active state) or 
 * a relaxed "agenda clear" state (free time).
 * 
 * Philosophy: Focus on what's happening NOW.
 */
export function FocusSessionCard({ nextSession, onViewFullAgenda }: FocusSessionCardProps) {
    const [timeUntil, setTimeUntil] = useState<string>('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        if (!nextSession) return;

        function updateTime() {
            const now = new Date();
            const diff = nextSession!.startTime.getTime() - now.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);

            if (minutes < 0) {
                setTimeUntil('Ahora');
                setIsUrgent(true);
            } else if (minutes < 15) {
                setTimeUntil(`En ${minutes} min`);
                setIsUrgent(true);
            } else if (minutes < 60) {
                setTimeUntil(`En ${minutes} min`);
                setIsUrgent(false);
            } else if (hours < 2) {
                setTimeUntil(`En ${hours}h ${minutes % 60}m`);
                setIsUrgent(false);
            } else {
                setTimeUntil(`En ${hours} horas`);
                setIsUrgent(false);
            }
        }

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [nextSession]);

    // ============ STATE B: FREE TIME ============
    if (!nextSession) {
        return (
            <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Coffee Icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center">
                            <Coffee className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="type-h2 text-foreground">Agenda despejada</h2>
                            <p className="type-body text-muted-foreground mt-1">
                                No tienes sesiones programadas próximamente.
                            </p>
                        </div>
                    </div>

                    {/* Secondary Action */}
                    <button
                        onClick={onViewFullAgenda}
                        className="btn btn-ghost text-muted-foreground"
                    >
                        Ver Agenda Completa
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Subtle suggestion */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        💡 Buen momento para revisar notas o contactar leads pendientes.
                    </p>
                    <div className="flex gap-2">
                        <Link href="/leads" className="btn btn-sm btn-secondary">
                            Ver Leads
                        </Link>
                        <Link href="/patients" className="btn btn-sm btn-secondary">
                            Ver Clientes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ============ STATE A: ACTIVE SESSION ============
    return (
        <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-6 relative overflow-hidden">
            {/* Subtle gradient overlay for urgency */}
            {isUrgent && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent pointer-events-none" />
            )}

            <div className="relative flex items-start justify-between gap-6">
                {/* LEFT: Patient Info */}
                <div className="flex items-center gap-4">
                    {/* Patient Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand/70 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                        <span className="type-h2 font-bold">{nextSession.patientInitials}</span>
                    </div>
                    <div>
                        <p className="type-ui text-muted-foreground tracking-wider">PRÓXIMA SESIÓN</p>
                        <h2 className="type-h2 text-foreground mt-1">{nextSession.patientName}</h2>
                        <p className="type-body text-muted-foreground">{nextSession.serviceName}</p>
                    </div>
                </div>

                {/* RIGHT: Time & Actions */}
                <div className="flex flex-col items-end gap-3">
                    {/* Time Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isUrgent
                        ? 'bg-brand/10 text-brand'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        <Clock className={`w-4 h-4 ${isUrgent ? 'animate-pulse' : ''}`} />
                        <span className="type-ui font-medium">{timeUntil}</span>
                    </div>

                    {/* Aletheia Insight (if any) */}
                    {nextSession.aletheiaInsight && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${nextSession.aletheiaInsight.type === 'warning'
                            ? 'bg-warning/10 text-warning'
                            : nextSession.aletheiaInsight.type === 'info'
                                ? 'bg-ai/10 text-ai'
                                : 'bg-success/10 text-success'
                            }`}>
                            {nextSession.aletheiaInsight.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                            <span>{nextSession.aletheiaInsight.message}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <Link
                        href={`/patients/${nextSession.id}`}
                        className="btn btn-brand shadow-lg shadow-brand/20"
                    >
                        Preparar Sesión
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Bottom bar: Quick actions */}
            <div className="relative mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <button
                    onClick={onViewFullAgenda}
                    className="btn btn-ghost btn-sm text-muted-foreground"
                >
                    <Calendar className="w-4 h-4" />
                    Ver Agenda Completa
                </button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>Última sesión hace 2 semanas</span>
                </div>
            </div>
        </div>
    );
}
