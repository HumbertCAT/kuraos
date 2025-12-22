'use client';

import {
    Lock, CreditCard, CheckCircle, Clock, AlertTriangle,
    Plane, FileCheck, UserCheck, Calendar, GraduationCap,
    ClipboardCheck, Sparkles, Ban, AlertCircle, Play
} from 'lucide-react';

/**
 * JourneyStatusCard - Enhanced Visual Journey Timeline
 * 
 * Shows the current state as a visual step progression.
 * Each journey type has defined stages shown as a timeline.
 */

// Journey stage configurations with ordered steps
const JOURNEY_DEFINITIONS: Record<string, {
    name: string;
    emoji: string;
    description: string;
    stages: string[];
}> = {
    // Psychedelic Retreat
    retreat_ibiza_2025: {
        name: "Retiro Ibiza 2025",
        emoji: "🧬",
        description: "Ceremonia Grupal Psilocibina",
        stages: ["AWAITING_SCREENING", "BLOCKED_MEDICAL", "PREPARATION_PHASE", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"],
    },

    // Microdosis Protocol
    microdosis_fadiman: {
        name: "Programa Microdosis",
        emoji: "🍄",
        description: "Protocolo Fadiman - 10 semanas",
        stages: ["ONBOARDING", "WEEK_1", "WEEK_3", "WEEK_5", "WEEK_8", "WEEK_10", "COMPLETED"],
    },

    // Astrology
    carta_natal: {
        name: "Lectura Carta Natal",
        emoji: "⭐",
        description: "Sesión personalizada con Leo Star",
        stages: ["AWAITING_BIRTH_DATA", "ANALYSIS_IN_PROGRESS", "READY_FOR_SESSION", "COMPLETED"],
    },

    // Coaching
    despertar_8s: {
        name: "Programa El Despertar",
        emoji: "💪",
        description: "8 sesiones de coaching transpersonal",
        stages: ["ONBOARDING", "DEEP_DIVE", "STAGNATION_ALERT", "GRADUATED"],
    },

    // Yoga
    yoga_urban_om: {
        name: "Urban Om Yoga",
        emoji: "🧘",
        description: "Vinyasa Flow classes",
        stages: ["AWAITING_WAIVER", "ACTIVE_STUDENT", "PAUSED", "INACTIVE"],
    },

    // Legacy intake
    intake: {
        name: "Proceso de Intake",
        emoji: "📋",
        description: "Evaluación inicial",
        stages: ["SCREENING_PENDING", "BLOCKED_HIGH_RISK", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"],
    },

    booking: {
        name: "Reserva",
        emoji: "📅",
        description: "Estado de la reserva",
        stages: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
    },

    // Stabilization Program (for patients blocked from psychedelic services)
    stabilization_program: {
        name: "Programa de Estabilización",
        emoji: "🛡️",
        description: "Terapia Integrativa (sin sustancias)",
        stages: ["INTAKE", "TREATMENT_ACTIVE", "CONSOLIDATION", "MAINTENANCE", "GRADUATED"],
    },
};

// Status visual config
const STATUS_CONFIG: Record<string, {
    label: string;
    shortLabel: string;
    type: 'blocked' | 'waiting' | 'active' | 'success' | 'warning';
    icon: typeof Lock;
}> = {
    // Blocked states
    BLOCKED_MEDICAL: { label: "Bloqueado - Contraindicación médica", shortLabel: "Bloqueado", type: 'blocked', icon: Ban },
    BLOCKED_HIGH_RISK: { label: "Bloqueado - Revisión manual", shortLabel: "Bloqueado", type: 'blocked', icon: Lock },

    // Warning states
    STAGNATION_ALERT: { label: "Estancado - Sin actividad", shortLabel: "Estancado", type: 'warning', icon: AlertTriangle },

    // Waiting states
    AWAITING_SCREENING: { label: "Esperando screening", shortLabel: "Screening", type: 'waiting', icon: ClipboardCheck },
    AWAITING_PAYMENT: { label: "Esperando pago", shortLabel: "Pago", type: 'waiting', icon: CreditCard },
    AWAITING_BIRTH_DATA: { label: "Esperando datos de nacimiento", shortLabel: "Datos", type: 'waiting', icon: Calendar },
    AWAITING_WAIVER: { label: "Esperando waiver", shortLabel: "Waiver", type: 'waiting', icon: FileCheck },
    SCREENING_PENDING: { label: "Screening pendiente", shortLabel: "Screening", type: 'waiting', icon: Clock },
    PENDING: { label: "Pendiente", shortLabel: "Pendiente", type: 'waiting', icon: Clock },

    // Active/In Progress states
    PREPARATION_PHASE: { label: "En preparación", shortLabel: "Preparación", type: 'active', icon: Sparkles },
    ANALYSIS_IN_PROGRESS: { label: "Análisis en progreso", shortLabel: "Análisis", type: 'active', icon: Sparkles },
    ONBOARDING: { label: "Onboarding activo", shortLabel: "Onboarding", type: 'active', icon: Play },
    DEEP_DIVE: { label: "Fase intensa", shortLabel: "Deep Dive", type: 'active', icon: Sparkles },
    ACTIVE_STUDENT: { label: "Estudiante activo", shortLabel: "Activo", type: 'success', icon: UserCheck },
    READY_FOR_SESSION: { label: "Listo para sesión", shortLabel: "Listo", type: 'active', icon: CheckCircle },
    TREATMENT_ACTIVE: { label: "En tratamiento", shortLabel: "Tratamiento", type: 'active', icon: Sparkles },
    INTAKE: { label: "Evaluación inicial", shortLabel: "Intake", type: 'waiting', icon: ClipboardCheck },
    CONSOLIDATION: { label: "Consolidación", shortLabel: "Consolidación", type: 'active', icon: Sparkles },
    MAINTENANCE: { label: "Mantenimiento", shortLabel: "Mantenimiento", type: 'success', icon: CheckCircle },

    // Microdosis stages
    WEEK_1: { label: "Semana 1 - Iniciación", shortLabel: "Sem 1", type: 'active', icon: Sparkles },
    WEEK_3: { label: "Semana 3 - Ajuste", shortLabel: "Sem 3", type: 'active', icon: Sparkles },
    WEEK_5: { label: "Semana 5 - Consolidación", shortLabel: "Sem 5", type: 'active', icon: Sparkles },
    WEEK_8: { label: "Semana 8 - Integración", shortLabel: "Sem 8", type: 'active', icon: Sparkles },
    WEEK_10: { label: "Semana 10 - Cierre", shortLabel: "Sem 10", type: 'success', icon: CheckCircle },

    // Success states
    CONFIRMED: { label: "Confirmado", shortLabel: "Confirmado", type: 'success', icon: CheckCircle },
    COMPLETED: { label: "Completado", shortLabel: "Completado", type: 'success', icon: CheckCircle },
    GRADUATED: { label: "Graduado", shortLabel: "Graduado", type: 'success', icon: GraduationCap },

    // Other
    PAUSED: { label: "Pausado", shortLabel: "Pausado", type: 'warning', icon: AlertCircle },
    INACTIVE: { label: "Inactivo", shortLabel: "Inactivo", type: 'blocked', icon: Lock },
    CANCELLED: { label: "Cancelado", shortLabel: "Cancelado", type: 'blocked', icon: Ban },
    PAYMENT_FAILED: { label: "Pago fallido", shortLabel: "Error pago", type: 'warning', icon: AlertTriangle },
};

const TYPE_COLORS = {
    blocked: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', dot: 'bg-red-500', badgeBg: 'bg-white', badgeText: 'text-red-700', badgeBorder: 'border-red-300' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-500', badgeBg: 'bg-white', badgeText: 'text-amber-700', badgeBorder: 'border-amber-300' },
    waiting: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', dot: 'bg-yellow-500', badgeBg: 'bg-white', badgeText: 'text-yellow-700', badgeBorder: 'border-yellow-300' },
    active: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500', badgeBg: 'bg-white', badgeText: 'text-blue-700', badgeBorder: 'border-blue-300' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', badgeBg: 'bg-white', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-300' },
};

interface JourneyStatusCardProps {
    journeyStatus: Record<string, string>;
}

export default function JourneyStatusCard({ journeyStatus }: JourneyStatusCardProps) {
    if (!journeyStatus || Object.keys(journeyStatus).length === 0) {
        return null;
    }

    return (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 flex items-center gap-2">
                <Plane className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-caption">
                    PATIENT JOURNEY
                </h3>
            </div>

            {/* Journey cards */}
            <div className="p-4 space-y-4">
                {Object.entries(journeyStatus).map(([journeyKey, currentStatus]) => {
                    const journeyDef = JOURNEY_DEFINITIONS[journeyKey] || {
                        name: journeyKey.replace(/_/g, " "),
                        emoji: "📋",
                        description: "",
                        stages: [currentStatus],
                    };

                    const statusConfig = STATUS_CONFIG[currentStatus] || {
                        label: currentStatus,
                        shortLabel: currentStatus,
                        type: 'waiting' as const,
                        icon: Clock,
                    };

                    const colors = TYPE_COLORS[statusConfig.type];
                    const Icon = statusConfig.icon;

                    // Find current stage index
                    const currentIndex = journeyDef.stages.indexOf(currentStatus);
                    const isTerminal = statusConfig.type === 'success' || statusConfig.type === 'blocked';

                    return (
                        <div
                            key={journeyKey}
                            className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}
                        >
                            {/* Journey header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{journeyDef.emoji}</span>
                                    <div>
                                        <h4 className={`font-semibold font-headline ${colors.text}`}>{journeyDef.name}</h4>
                                        {journeyDef.description && (
                                            <p className="text-xs text-slate-500">{journeyDef.description}</p>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-caption rounded-full ${colors.badgeBg} ${colors.badgeText} border ${colors.badgeBorder} shadow-sm`}>
                                    <Icon className="w-4 h-4" />
                                    {statusConfig.label.toUpperCase()}
                                </span>
                            </div>

                            {/* Progress steps - visual timeline */}
                            <div className="flex items-center gap-1 mt-3">
                                {journeyDef.stages.map((stage, index) => {
                                    const stageConfig = STATUS_CONFIG[stage];
                                    const isCurrentStage = stage === currentStatus;
                                    const isPastStage = index < currentIndex && currentIndex >= 0;
                                    const isFutureStage = index > currentIndex && currentIndex >= 0;
                                    const isBlockedPath = statusConfig.type === 'blocked' && isCurrentStage;

                                    // Determine step appearance
                                    let stepBg = 'bg-slate-200';
                                    let stepBorder = 'border-slate-300';
                                    let showPulse = false;

                                    if (isCurrentStage) {
                                        const c = TYPE_COLORS[statusConfig.type];
                                        stepBg = c.dot;
                                        stepBorder = c.border;
                                        showPulse = statusConfig.type === 'waiting' || statusConfig.type === 'active';
                                    } else if (isPastStage && !isBlockedPath) {
                                        stepBg = 'bg-emerald-400';
                                        stepBorder = 'border-emerald-500';
                                    }

                                    return (
                                        <div key={stage} className="flex items-center flex-1">
                                            {/* Step dot */}
                                            <div className="relative group">
                                                <div className={`w-4 h-4 rounded-full border-2 ${stepBg} ${stepBorder} ${showPulse ? 'animate-pulse' : ''}`} />

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                                        {stageConfig?.shortLabel || stage.replace(/_/g, " ")}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Connector line */}
                                            {index < journeyDef.stages.length - 1 && (
                                                <div className={`flex-1 h-1 mx-1 rounded ${isPastStage && !isBlockedPath ? 'bg-emerald-400' : 'bg-slate-200'
                                                    }`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Stage labels (condensed) */}
                            <div className="flex justify-between mt-2 text-xs text-slate-400">
                                <span>Inicio</span>
                                <span>{isTerminal ? (statusConfig.type === 'success' ? '✓ Completado' : '✗ Finalizado') : '⋯ En progreso'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
