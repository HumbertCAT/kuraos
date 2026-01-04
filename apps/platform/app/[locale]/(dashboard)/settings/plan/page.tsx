'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles,
    Users,
    Zap,
    Building2,
    Crown,
    AlertTriangle,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

// Types
interface AiSpend {
    tier: string;
    spend_usd: number;  // Treat as EUR
    limit_usd: number;  // Treat as EUR
    usage_percent: number;
    period_days: number;
}

// Plan configuration (static data)
const PLANS = {
    BUILDER: {
        name: 'Builder',
        price: 0,
        fee: 5,
        patients: 3,
        aiLimit: 10,
        icon: Zap,
        color: 'bg-muted',
        borderColor: 'border-border',
        features: ['3 pacientes', '10€ IA/mes', '5% comisión', 'Soporte email'],
    },
    PRO: {
        name: 'Pro',
        price: 49,
        fee: 2,
        patients: 50,
        aiLimit: 50,
        icon: Crown,
        color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        borderColor: 'border-purple-500/50',
        features: ['50 pacientes', '50€ IA/mes', '2% comisión', 'Soporte prioritario', 'Integraciones avanzadas'],
    },
    CENTER: {
        name: 'Center',
        price: 149,
        fee: 1,
        patients: 150,
        aiLimit: 200,
        icon: Building2,
        color: 'bg-gradient-to-br from-amber-400 to-orange-500',
        borderColor: 'border-amber-500/50',
        features: ['150 pacientes', '200€ IA/mes', '1% comisión', 'Soporte dedicado', 'Multi-terapeuta', 'White-label'],
    },
} as const;

type TierKey = keyof typeof PLANS;

// EUR Formatter (Spanish locale)
function formatEUR(value: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

// Progress bar color based on usage
function getBarColor(percent: number): string {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
}

export default function PlanPage() {
    const { organization } = useAuth();
    const [aiSpend, setAiSpend] = useState<AiSpend | null>(null);
    const [patientCount, setPatientCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const currentTier = (organization?.tier as TierKey) || 'BUILDER';
    const currentPlan = PLANS[currentTier];

    useEffect(() => {
        loadAiSpend();
    }, []);

    async function loadAiSpend() {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

            // Load AI spend and patient count in parallel
            const [spendRes, patientsRes] = await Promise.all([
                fetch(`${API_URL}/auth/me/ai-spend`, { credentials: 'include' }),
                fetch(`${API_URL}/patients?per_page=1`, { credentials: 'include' }),
            ]);

            if (spendRes.ok) {
                const data = await spendRes.json();
                setAiSpend(data);
            }

            if (patientsRes.ok) {
                const data = await patientsRes.json();
                setPatientCount(data.meta?.total || data.total || 0);
            }
        } catch (err) {
            console.error('Failed to load plan data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Calculate usage percentages
    const aiUsagePercent = aiSpend?.usage_percent || 0;
    const patientUsagePercent = (patientCount / currentPlan.patients) * 100;
    const showAiWarning = aiUsagePercent >= 90;
    const showPatientWarning = patientUsagePercent >= 90;

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>Cargando plan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ================================================== */}
            {/* SECTION 1: HERO & USAGE (The "Pressure" Section) */}
            {/* ================================================== */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 ${currentTier === 'BUILDER' ? 'bg-gradient-to-r from-slate-600 to-slate-700' : currentTier === 'PRO' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-white" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">Mi Plan</h2>
                                <p className="text-white/70 text-sm">Uso y límites actuales</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-full font-bold text-sm text-white">
                            {currentPlan.name.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side: Status & Fee */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Plan Actual</p>
                            <p className="text-3xl font-bold text-foreground">{currentPlan.name}</p>
                        </div>

                        {/* Fee Highlight */}
                        <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Comisión Plataforma</p>
                                    <p className="text-3xl font-bold text-red-500">{currentPlan.fee}%</p>
                                </div>
                                {currentTier !== 'CENTER' && (
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Ahorra subiendo de nivel</p>
                                        <p className="text-sm font-medium text-emerald-500">
                                            → {PLANS[currentTier === 'BUILDER' ? 'PRO' : 'CENTER'].fee}% con {currentTier === 'BUILDER' ? 'Pro' : 'Center'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price display */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-foreground">{currentPlan.price}</span>
                            <span className="text-xl text-muted-foreground">€/mes</span>
                        </div>
                    </div>

                    {/* Right Side: Usage Gauges */}
                    <div className="space-y-4">
                        {/* AI Budget Gauge */}
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-brand" />
                                    <span className="text-sm font-medium">Presupuesto IA</span>
                                </div>
                                <span className="text-sm font-mono">
                                    {formatEUR(aiSpend?.spend_usd || 0)} / {formatEUR(aiSpend?.limit_usd || currentPlan.aiLimit)}
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(aiUsagePercent)}`}
                                    style={{ width: `${Math.min(aiUsagePercent, 100)}%` }}
                                />
                            </div>
                            {showAiWarning && (
                                <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>⚠️ Límite casi alcanzado</span>
                                </div>
                            )}
                        </div>

                        {/* Patients Gauge */}
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-brand" />
                                    <span className="text-sm font-medium">Pacientes</span>
                                </div>
                                <span className="text-sm font-mono">
                                    {patientCount} / {currentPlan.patients}
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(patientUsagePercent)}`}
                                    style={{ width: `${Math.min(patientUsagePercent, 100)}%` }}
                                />
                            </div>
                            {showPatientWarning && (
                                <div className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>⚠️ Límite casi alcanzado</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================================================== */}
            {/* SECTION 2: THE UPGRADE GRID (The "Solution" Section) */}
            {/* ================================================== */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Planes Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.keys(PLANS) as TierKey[]).map((tierKey) => {
                        const plan = PLANS[tierKey];
                        const isCurrent = tierKey === currentTier;
                        const isUpgrade = (currentTier === 'BUILDER' && tierKey !== 'BUILDER') ||
                            (currentTier === 'PRO' && tierKey === 'CENTER');
                        const isHighlighted = (currentTier === 'BUILDER' && tierKey === 'PRO') ||
                            (currentTier === 'PRO' && tierKey === 'CENTER');
                        const Icon = plan.icon;

                        return (
                            <div
                                key={tierKey}
                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${isCurrent
                                    ? 'bg-brand/5 border-brand'
                                    : isHighlighted
                                        ? 'bg-card border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]'
                                        : 'bg-card border-border hover:border-muted-foreground/30'
                                    }`}
                            >
                                {/* Recommended badge */}
                                {isHighlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                                        RECOMENDADO
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-xl ${plan.color} ${tierKey === 'BUILDER' ? 'text-foreground' : 'text-white'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{plan.name}</h4>
                                        {isCurrent && (
                                            <span className="text-xs text-brand">Plan Actual</span>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-lg text-muted-foreground"> €/mes</span>
                                </div>

                                {/* Fee Badge */}
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${plan.fee <= 1
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : plan.fee <= 2
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    Comisión: {plan.fee}%
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                {isCurrent ? (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed"
                                    >
                                        Plan Actual
                                    </button>
                                ) : isUpgrade ? (
                                    <button
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                                    >
                                        Mejorar Plan
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-muted/50 text-muted-foreground/50 rounded-xl font-medium cursor-not-allowed"
                                    >
                                        —
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footnote */}
            <p className="text-xs text-muted-foreground text-center">
                Todos los precios en EUR. IVA no incluido. Los límites se reinician mensualmente.
            </p>
        </div>
    );
}
