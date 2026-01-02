'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
    Lock, CreditCard, CheckCircle, Clock, AlertTriangle,
    FileCheck, UserCheck, Calendar, GraduationCap,
    ClipboardCheck, Sparkles, Ban, AlertCircle, Play,
    ChevronDown, ChevronUp, Send, Eye, MessageCircle
} from 'lucide-react';

/**
 * JourneyStatusCard v2.0 - "The Flight Boarding Pass"
 * 
 * Rich journey cards with:
 * - Glass/Tactile aesthetic
 * - Smart Timeline with icons (✅ past, 🔵 current, ⚪ future)
 * - Dynamic "Next Action" area
 * - Type-based left border gradient (Psychedelic=Teal, Medical=Red)
 */

// ============ JOURNEY DEFINITIONS ============
const JOURNEY_DEFINITIONS: Record<string, {
    name: string;
    emoji: string;
    description: string;
    type: 'psychedelic' | 'coaching' | 'medical' | 'wellness' | 'default';
    stages: string[];
}> = {
    retreat_ibiza: {
        name: "The Sovereign Mind Protocol",
        emoji: "🧬",
        description: "Retiro Ibiza 2025",
        type: 'psychedelic',
        stages: ["APPLICATION", "SCREENING", "PREPARATION", "IMMERSION", "INTEGRATION", "ALUMNI"],
    },
    architects_circle: {
        name: "Architects' Circle Membership",
        emoji: "🏛️",
        description: "Membresía ejecutiva exclusiva",
        type: 'coaching',
        stages: ["ONBOARDING", "ACTIVE_MEMBER", "ALUMNI"],
    },
    neuro_repatterning: {
        name: "Neuro-Repatterning Strategy",
        emoji: "🧠",
        description: "Estrategia de reprogramación neural",
        type: 'coaching',
        stages: ["DISCOVERY", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"],
    },
    microdosis_fadiman: {
        name: "Programa Microdosis",
        emoji: "🍄",
        description: "Protocolo Fadiman - 10 semanas",
        type: 'psychedelic',
        stages: ["ONBOARDING", "WEEK_1", "WEEK_3", "WEEK_5", "WEEK_8", "WEEK_10", "COMPLETED"],
    },
    carta_natal: {
        name: "Lectura Carta Natal",
        emoji: "⭐",
        description: "Sesión personalizada",
        type: 'wellness',
        stages: ["AWAITING_BIRTH_DATA", "ANALYSIS_IN_PROGRESS", "READY_FOR_SESSION", "COMPLETED"],
    },
    despertar_8s: {
        name: "Programa El Despertar",
        emoji: "💪",
        description: "8 sesiones de coaching transpersonal",
        type: 'coaching',
        stages: ["ONBOARDING", "DEEP_DIVE", "STAGNATION_ALERT", "GRADUATED"],
    },
    yoga_urban_om: {
        name: "Urban Om Yoga",
        emoji: "🧘",
        description: "Vinyasa Flow classes",
        type: 'wellness',
        stages: ["AWAITING_WAIVER", "ACTIVE_STUDENT", "PAUSED", "INACTIVE"],
    },
    intake: {
        name: "Proceso de Intake",
        emoji: "📋",
        description: "Evaluación inicial",
        type: 'default',
        stages: ["SCREENING_PENDING", "BLOCKED_HIGH_RISK", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"],
    },
    booking: {
        name: "Reserva",
        emoji: "📅",
        description: "Estado de la reserva",
        type: 'default',
        stages: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
    },
    stabilization_program: {
        name: "Programa de Estabilización",
        emoji: "🛡️",
        description: "Terapia Integrativa (sin sustancias)",
        type: 'medical',
        stages: ["INTAKE", "TREATMENT_ACTIVE", "CONSOLIDATION", "MAINTENANCE", "GRADUATED"],
    },
};

// ============ STATUS CONFIG ============
const STATUS_CONFIG: Record<string, {
    label: string;
    shortLabel: string;
    category: 'blocked' | 'waiting' | 'active' | 'success' | 'warning';
    icon: typeof Lock;
    actionRequired?: boolean;
    nextActionLabel?: string;
    nextActionType?: 'brand' | 'destructive' | 'secondary';
}> = {
    // Blocked states
    BLOCKED_MEDICAL: {
        label: "Bloqueado - Contraindicación médica",
        shortLabel: "Bloqueado",
        category: 'blocked',
        icon: Ban,
        actionRequired: true,
        nextActionLabel: "Revisar Bloqueo",
        nextActionType: 'destructive'
    },
    BLOCKED_HIGH_RISK: {
        label: "Bloqueado - Revisión manual",
        shortLabel: "Bloqueado",
        category: 'blocked',
        icon: Lock,
        actionRequired: true,
        nextActionLabel: "Revisar Caso",
        nextActionType: 'destructive'
    },

    // Warning states
    STAGNATION_ALERT: {
        label: "Estancado - Sin actividad",
        shortLabel: "Estancado",
        category: 'warning',
        icon: AlertTriangle,
        actionRequired: true,
        nextActionLabel: "Contactar",
        nextActionType: 'brand'
    },

    // Waiting states
    AWAITING_SCREENING: {
        label: "Esperando screening",
        shortLabel: "Screening",
        category: 'waiting',
        icon: ClipboardCheck,
        actionRequired: true,
        nextActionLabel: "Enviar Formulario",
        nextActionType: 'brand'
    },
    AWAITING_PAYMENT: {
        label: "Esperando pago",
        shortLabel: "Pago Pendiente",
        category: 'waiting',
        icon: CreditCard,
        actionRequired: true,
        nextActionLabel: "Reenviar Link Pago",
        nextActionType: 'brand'
    },
    AWAITING_BIRTH_DATA: {
        label: "Esperando datos de nacimiento",
        shortLabel: "Pendiente Datos",
        category: 'waiting',
        icon: Calendar,
        actionRequired: true,
        nextActionLabel: "Solicitar Datos",
        nextActionType: 'brand'
    },
    AWAITING_WAIVER: {
        label: "Esperando waiver",
        shortLabel: "Waiver",
        category: 'waiting',
        icon: FileCheck,
        actionRequired: true,
        nextActionLabel: "Enviar Waiver",
        nextActionType: 'brand'
    },
    SCREENING_PENDING: { label: "Screening pendiente", shortLabel: "Screening", category: 'waiting', icon: Clock },
    PENDING: { label: "Pendiente", shortLabel: "Pendiente", category: 'waiting', icon: Clock },

    // Active/In Progress states
    PREPARATION_PHASE: { label: "En preparación", shortLabel: "Preparación", category: 'active', icon: Sparkles },
    ANALYSIS_IN_PROGRESS: { label: "Análisis en progreso", shortLabel: "Análisis", category: 'active', icon: Sparkles },
    ONBOARDING: { label: "Onboarding activo", shortLabel: "Onboarding", category: 'active', icon: Play },

    // Sovereign Mind Protocol stages
    APPLICATION: { label: "Solicitud recibida", shortLabel: "Solicitud", category: 'waiting', icon: ClipboardCheck },
    SCREENING: { label: "Evaluación en curso", shortLabel: "Screening", category: 'active', icon: Sparkles },
    PREPARATION: { label: "Fase de preparación", shortLabel: "Preparación", category: 'active', icon: Sparkles },
    IMMERSION: { label: "Inmersión activa", shortLabel: "Inmersión", category: 'active', icon: Sparkles },
    INTEGRATION: { label: "Integración post-ceremonia", shortLabel: "Integración", category: 'active', icon: Sparkles },
    ALUMNI: { label: "Alumni del programa", shortLabel: "Alumni", category: 'success', icon: GraduationCap },
    ACTIVE_MEMBER: { label: "Miembro activo", shortLabel: "Activo", category: 'success', icon: UserCheck },
    DISCOVERY: { label: "Descubrimiento inicial", shortLabel: "Discovery", category: 'active', icon: Sparkles },

    DEEP_DIVE: { label: "Fase intensa", shortLabel: "Deep Dive", category: 'active', icon: Sparkles },
    ACTIVE_STUDENT: { label: "Estudiante activo", shortLabel: "Activo", category: 'success', icon: UserCheck },
    READY_FOR_SESSION: {
        label: "Listo para sesión",
        shortLabel: "Listo",
        category: 'active',
        icon: CheckCircle,
        nextActionLabel: "Ver Diario Clínico",
        nextActionType: 'secondary'
    },
    TREATMENT_ACTIVE: {
        label: "En tratamiento",
        shortLabel: "En Tratamiento",
        category: 'active',
        icon: Sparkles,
        nextActionLabel: "Ver Diario Clínico",
        nextActionType: 'secondary'
    },
    INTAKE: { label: "Evaluación inicial", shortLabel: "Intake", category: 'waiting', icon: ClipboardCheck },
    CONSOLIDATION: { label: "Consolidación", shortLabel: "Consolidación", category: 'active', icon: Sparkles },
    MAINTENANCE: { label: "Mantenimiento", shortLabel: "Mantenimiento", category: 'success', icon: CheckCircle },

    // Microdosis stages
    WEEK_1: { label: "Semana 1 - Iniciación", shortLabel: "Sem 1", category: 'active', icon: Sparkles },
    WEEK_3: { label: "Semana 3 - Ajuste", shortLabel: "Sem 3", category: 'active', icon: Sparkles },
    WEEK_5: { label: "Semana 5 - Consolidación", shortLabel: "Sem 5", category: 'active', icon: Sparkles },
    WEEK_8: { label: "Semana 8 - Integración", shortLabel: "Sem 8", category: 'active', icon: Sparkles },
    WEEK_10: { label: "Semana 10 - Cierre", shortLabel: "Sem 10", category: 'success', icon: CheckCircle },

    // Success states
    CONFIRMED: { label: "Confirmado", shortLabel: "Confirmado", category: 'success', icon: CheckCircle },
    COMPLETED: { label: "Completado", shortLabel: "Completado", category: 'success', icon: CheckCircle },
    GRADUATED: { label: "Graduado", shortLabel: "Graduado", category: 'success', icon: GraduationCap },

    // Other
    PAUSED: { label: "Pausado", shortLabel: "Pausado", category: 'warning', icon: AlertCircle },
    INACTIVE: { label: "Inactivo", shortLabel: "Inactivo", category: 'blocked', icon: Lock },
    CANCELLED: { label: "Cancelado", shortLabel: "Cancelado", category: 'blocked', icon: Ban },
    PAYMENT_FAILED: { label: "Pago fallido", shortLabel: "Error pago", category: 'warning', icon: AlertTriangle },
};

// ============ TYPE-BASED STYLING ============
const JOURNEY_TYPE_STYLES = {
    psychedelic: 'border-l-brand bg-brand/5',
    coaching: 'border-l-blue-500 bg-blue-500/5',
    medical: 'border-l-risk bg-risk/5',
    wellness: 'border-l-ai bg-ai/5',
    default: 'border-l-muted-foreground bg-muted/5',
};

const CATEGORY_BADGE = {
    blocked: 'badge badge-risk',
    warning: 'badge badge-warning',
    waiting: 'badge badge-warning',
    active: 'badge badge-ai',
    success: 'badge badge-success',
};

// ============ SINGLE JOURNEY CARD ============
interface JourneyCardProps {
    journeyKey: string;
    currentStatus: string;
}

function JourneyCard({ journeyKey, currentStatus }: JourneyCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const journeyDef = JOURNEY_DEFINITIONS[journeyKey] || {
        name: journeyKey.replace(/_/g, " "),
        emoji: "📋",
        description: "",
        type: 'default' as const,
        stages: [currentStatus],
    };

    const statusConfig = STATUS_CONFIG[currentStatus] || {
        label: currentStatus,
        shortLabel: currentStatus,
        category: 'waiting' as const,
        icon: Clock,
    };

    const currentIndex = journeyDef.stages.indexOf(currentStatus);
    const isTerminal = statusConfig.category === 'success' || statusConfig.category === 'blocked';
    const Icon = statusConfig.icon;

    // Button style based on action type
    const getButtonClass = () => {
        switch (statusConfig.nextActionType) {
            case 'destructive': return 'btn btn-sm btn-destructive';
            case 'brand': return 'btn btn-sm btn-brand';
            default: return 'btn btn-sm btn-secondary';
        }
    };

    return (
        <div className={`card border-l-4 ${JOURNEY_TYPE_STYLES[journeyDef.type]} overflow-hidden`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{journeyDef.emoji}</span>
                    <div>
                        <h4 className="type-ui font-semibold text-foreground">{journeyDef.name}</h4>
                        {journeyDef.description && (
                            <p className="text-xs text-muted-foreground">{journeyDef.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={CATEGORY_BADGE[statusConfig.category]}>
                        {statusConfig.shortLabel.toUpperCase()}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Smart Timeline */}
                    <div className="flex items-center gap-1">
                        {journeyDef.stages.map((stage, index) => {
                            const stageConfig = STATUS_CONFIG[stage];
                            const isCurrentStage = stage === currentStatus;
                            const isPastStage = index < currentIndex && currentIndex >= 0;
                            const isFutureStage = index > currentIndex && currentIndex >= 0;
                            const isBlockedPath = statusConfig.category === 'blocked' && isCurrentStage;

                            return (
                                <div key={stage} className="flex items-center flex-1">
                                    {/* Timeline Node */}
                                    <div className="relative group flex flex-col items-center">
                                        {isPastStage && !isBlockedPath ? (
                                            // Past: Green Check
                                            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                        ) : isCurrentStage ? (
                                            // Current: Pulsing ring
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${statusConfig.category === 'blocked' ? 'bg-risk' :
                                                statusConfig.category === 'warning' ? 'bg-warning' :
                                                    statusConfig.category === 'success' ? 'bg-success' :
                                                        'bg-brand animate-pulse'
                                                }`}>
                                                <Icon className="w-3 h-3 text-white" />
                                            </div>
                                        ) : (
                                            // Future: Ghost
                                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 bg-muted/50" />
                                        )}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                                                {stageConfig?.shortLabel || stage.replace(/_/g, " ")}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connector Line */}
                                    {index < journeyDef.stages.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-1 ${isPastStage && !isBlockedPath
                                            ? 'bg-success'
                                            : 'bg-muted-foreground/20'
                                            } ${isFutureStage ? 'border-dashed border-t border-muted-foreground/30 bg-transparent h-0' : ''}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Current Stage Label */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Inicio</span>
                        <span className={`font-medium ${statusConfig.category === 'blocked' ? 'text-risk' :
                            statusConfig.category === 'warning' ? 'text-warning' :
                                statusConfig.category === 'success' ? 'text-success' :
                                    'text-brand'
                            }`}>
                            {isTerminal
                                ? (statusConfig.category === 'success' ? '✓ Completado' : '✗ Bloqueado')
                                : `⋯ ${statusConfig.label}`
                            }
                        </span>
                    </div>

                    {/* Next Action Area */}
                    {statusConfig.nextActionLabel && (
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="text-xs text-muted-foreground">
                                {statusConfig.actionRequired && (
                                    <span className="inline-flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-warning" />
                                        Acción requerida
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button className={getButtonClass()}>
                                    {statusConfig.category === 'blocked' ? (
                                        <Eye className="w-3 h-3" />
                                    ) : statusConfig.category === 'waiting' ? (
                                        <Send className="w-3 h-3" />
                                    ) : (
                                        <Eye className="w-3 h-3" />
                                    )}
                                    {statusConfig.nextActionLabel}
                                </button>
                                <button className="btn btn-sm btn-ghost p-2">
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============ MAIN COMPONENT ============
interface JourneyStatusCardProps {
    journeyStatus: Record<string, string>;
}

export default function JourneyStatusCard({ journeyStatus }: JourneyStatusCardProps) {
    if (!journeyStatus || Object.keys(journeyStatus).length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ai" />
                <h3 className="type-ui text-ai tracking-wider">PATIENT JOURNEY</h3>
            </div>

            {/* Journey Cards Stack */}
            <div className="space-y-3">
                {Object.entries(journeyStatus).map(([journeyKey, currentStatus]) => (
                    <JourneyCard
                        key={journeyKey}
                        journeyKey={journeyKey}
                        currentStatus={currentStatus}
                    />
                ))}
            </div>
        </div>
    );
}
