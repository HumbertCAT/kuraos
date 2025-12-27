'use client';

import { Link } from '@/i18n/navigation';
import { ArrowRight, AlertCircle, Clock, Sparkles, ChevronRight } from 'lucide-react';

interface ActiveJourney {
    id: string;
    patientId: string;
    patientName: string;
    journeyName: string;
    journeyType: 'psychedelic' | 'coaching' | 'integration' | 'microdosing';
    status: 'ACTIVE' | 'BLOCKED' | 'PAYMENT_PENDING' | 'AWAITING_INTAKE';
    priority: 'high' | 'medium' | 'normal';
}

interface ActiveJourneysWidgetProps {
    journeys?: ActiveJourney[];
    maxItems?: number;
}

// Journey type colors (left border)
const journeyTypeColors: Record<string, string> = {
    psychedelic: 'border-l-teal-500',
    coaching: 'border-l-blue-500',
    integration: 'border-l-violet-500',
    microdosing: 'border-l-amber-500',
};

// Status badge styles
const statusConfig: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    ACTIVE: {
        label: 'Activo',
        className: 'bg-success/10 text-success'
    },
    BLOCKED: {
        label: 'Bloqueado',
        className: 'bg-risk/10 text-risk',
        icon: <AlertCircle className="w-3 h-3" />
    },
    PAYMENT_PENDING: {
        label: 'Esperando Pago',
        className: 'bg-warning/10 text-warning',
        icon: <Clock className="w-3 h-3" />
    },
    AWAITING_INTAKE: {
        label: 'En Intake',
        className: 'bg-brand/10 text-brand'
    },
};

// Mock data for demonstration
const MOCK_JOURNEYS: ActiveJourney[] = [
    {
        id: '1',
        patientId: 'p1',
        patientName: 'Javier Roca',
        journeyName: 'Retiro Ibiza',
        journeyType: 'psychedelic',
        status: 'BLOCKED',
        priority: 'high',
    },
    {
        id: '2',
        patientId: 'p2',
        patientName: 'Sofía Blanco',
        journeyName: 'Programa Microdosis',
        journeyType: 'microdosing',
        status: 'PAYMENT_PENDING',
        priority: 'medium',
    },
    {
        id: '3',
        patientId: 'p3',
        patientName: 'Lucrezia B.',
        journeyName: 'Integración 8 sem',
        journeyType: 'integration',
        status: 'ACTIVE',
        priority: 'normal',
    },
];

/**
 * ActiveJourneysWidget - "The Priority Queue"
 * 
 * Shows ongoing patient journeys that need attention.
 * Mini-Boarding Pass style for quick action.
 */
export function ActiveJourneysWidget({
    journeys = MOCK_JOURNEYS,
    maxItems = 4
}: ActiveJourneysWidgetProps) {
    const displayJourneys = journeys.slice(0, maxItems);

    return (
        <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai" />
                    <h3 className="type-ui text-muted-foreground tracking-wider">JOURNEYS ACTIVOS</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{journeys.length} total</span>
            </div>

            {/* Journey Cards Stack */}
            <div className="space-y-2">
                {displayJourneys.map((journey) => {
                    const status = statusConfig[journey.status];
                    const borderColor = journeyTypeColors[journey.journeyType] || 'border-l-gray-400';

                    return (
                        <Link
                            key={journey.id}
                            href={`/patients/${journey.patientId}`}
                            className={`block p-3 rounded-lg border-l-4 ${borderColor} bg-muted/30 hover:bg-muted/50 transition-all active:scale-[0.98] group`}
                        >
                            {/* Top Row: Patient + Journey */}
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="type-body font-semibold text-foreground text-sm">
                                    {journey.patientName}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                    {journey.journeyName}
                                </span>
                            </div>

                            {/* Bottom Row: Status + Action */}
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
                                    {status.icon}
                                    {status.label}
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* See All Link */}
            {journeys.length > maxItems && (
                <Link
                    href="/patients"
                    className="btn btn-ghost btn-sm w-full mt-3 justify-center text-muted-foreground"
                >
                    Ver todos los Journeys
                    <ChevronRight className="w-4 h-4" />
                </Link>
            )}

            {/* Empty State */}
            {displayJourneys.length === 0 && (
                <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sin journeys activos</p>
                </div>
            )}
        </div>
    );
}
