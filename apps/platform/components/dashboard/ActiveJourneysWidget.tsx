'use client';

import { Link } from '@/i18n/navigation';
import { ArrowRight, AlertCircle, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

// Premium Demo Data - matches Golden Seed Protocol archetypes
// Priority order: Action required first (Ghost, Red Flag), then Active (Whale, Success)
// STATIC UUIDs aligned with backend reboot_local_universe_PREMIUM.py
const MOCK_JOURNEYS: ActiveJourney[] = [
    {
        id: '1',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', // Julian
        patientName: 'Julian Soler',
        journeyName: 'Neuro-Repatterning Strategy',
        journeyType: 'coaching',
        status: 'PAYMENT_PENDING',
        priority: 'high',
    },
    {
        id: '2',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', // Elena
        patientName: 'Elena Velázquez',
        journeyName: 'The Sovereign Mind Protocol',
        journeyType: 'psychedelic',
        status: 'BLOCKED',
        priority: 'high',
    },
    {
        id: '3',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Marcus
        patientName: 'Marcus Thorne',
        journeyName: 'The Sovereign Mind Protocol',
        journeyType: 'psychedelic',
        status: 'ACTIVE',
        priority: 'medium',
    },
    {
        id: '4',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', // Sarah
        patientName: 'Sarah Jenkins',
        journeyName: "Architects' Circle Membership",
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
    const t = useTranslations('Dashboard.activeJourneys');
    const displayJourneys = journeys.slice(0, maxItems);

    // Status badge styles with translated labels
    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
            ACTIVE: {
                label: t('active'),
                className: 'bg-success/10 text-success'
            },
            BLOCKED: {
                label: t('blocked'),
                className: 'bg-risk/10 text-risk',
                icon: <AlertCircle className="w-3 h-3" />
            },
            PAYMENT_PENDING: {
                label: t('awaitingPayment'),
                className: 'bg-warning/10 text-warning',
                icon: <Clock className="w-3 h-3" />
            },
            AWAITING_INTAKE: {
                label: t('integration'),
                className: 'bg-brand/10 text-brand'
            },
        };
        return configs[status] || configs.ACTIVE;
    };

    return (
        <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ai" />
                    <h3 className="type-ui text-muted-foreground tracking-wider">{t('title')}</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{journeys.length} {t('total')}</span>
            </div>

            {/* Journey Cards Stack */}
            <div className="space-y-2">
                {displayJourneys.map((journey) => {
                    const status = getStatusConfig(journey.status);
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
                    {t('title')}
                    <ChevronRight className="w-4 h-4" />
                </Link>
            )}

            {/* Empty State */}
            {displayJourneys.length === 0 && (
                <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t('title')}</p>
                </div>
            )}
        </div>
    );
}
