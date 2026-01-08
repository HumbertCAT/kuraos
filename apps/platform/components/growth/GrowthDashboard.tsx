'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, MousePointerClick, UserPlus,
    BarChart3, Sparkles, Gift, ArrowUpRight,
    Search, Calendar, Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import CreditsDisplay from '@/components/CreditsDisplay';

interface Metrics {
    link_visits: number;
    new_leads: number;
    converted_patients: number;
    conversion_rate: number;
}

export default function GrowthDashboard() {
    const [metrics, setMetrics] = useState<Metrics>({
        link_visits: 124, // Mock for now, will connect to views_count
        new_leads: 18,
        converted_patients: 3,
        conversion_rate: 14.5,
    });
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Visitas Link"
                    value={metrics.link_visits}
                    icon={MousePointerClick}
                    trend="+12%"
                    color="text-brand"
                    bgColor="bg-brand/10"
                />
                <MetricCard
                    title="Nuevos Leads"
                    value={metrics.new_leads}
                    icon={UserPlus}
                    trend="+5%"
                    color="text-success"
                    bgColor="bg-success/10"
                />
                <MetricCard
                    title="Pacientes"
                    value={metrics.converted_patients}
                    icon={Sparkles}
                    trend="Nuevo"
                    color="text-ai"
                    bgColor="bg-ai/10"
                />
                <MetricCard
                    title="Conversion"
                    value={`${metrics.conversion_rate}%`}
                    icon={BarChart3}
                    trend="+2.1%"
                    color="text-warning"
                    bgColor="bg-warning/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Loot / Gamification */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-brand/15 via-brand/5 to-transparent border border-brand/20 rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-all active:scale-[0.98]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Gift className="w-32 h-32 -rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-wider text-[10px] mb-2 font-display">
                                <Gift className="w-4 h-4" />
                                Growth Loot
                            </div>
                            <h3 className="type-h1 text-2xl mb-4">
                                Desbloquea tus primeros 50 KC
                            </h3>
                            <p className="type-body leading-relaxed mb-6">
                                Consigue tu primer paciente a través de tu Bio Link y te regalamos 50 Kura Credits para potenciar tus automatizaciones.
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-bold mb-1 font-display uppercase tracking-wider">
                                    <span className="text-foreground">Progreso</span>
                                    <span className="text-brand">3/5 pacientes</span>
                                </div>
                                <div className="h-2 w-full bg-brand/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand rounded-full w-[60%] shadow-[0_0_15px_rgba(var(--brand),0.4)]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm border-white/5">
                        <h4 className="type-h3 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand" />
                            Tu impacto emocional
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="type-body">Personas ayudadas</span>
                                <span className="font-mono font-bold text-foreground">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="type-body">Tiempo de respuesta</span>
                                <span className="font-mono font-bold text-success">12m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Funnel Visualization */}
                <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-8 shadow-sm border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="type-h1 text-xl">Embudo de Conversión</h3>
                            <p className="type-body">Análisis de flujo desde Instagram hasta sesión clínica.</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-muted/50 rounded-xl hover:bg-muted transition-all active:scale-90">
                                <Calendar className="w-4 h-4 text-foreground/70" />
                            </button>
                            <button className="p-2 bg-muted/50 rounded-xl hover:bg-muted transition-all active:scale-90">
                                <Filter className="w-4 h-4 text-foreground/70" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-12 py-4">
                        <FunnelStep
                            label="Visitas al Link"
                            count={metrics.link_visits}
                            percentage={100}
                            color="bg-brand"
                        />
                        <FunnelStep
                            label="Leads Captados"
                            count={metrics.new_leads}
                            percentage={(metrics.new_leads / metrics.link_visits) * 100}
                            color="bg-success"
                        />
                        <FunnelStep
                            label="Pacientes Convertidos"
                            count={metrics.converted_patients}
                            percentage={(metrics.converted_patients / metrics.link_visits) * 100}
                            color="bg-ai"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, color, bgColor }: any) {
    return (
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-95 group border-white/5">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${bgColor} ${color} transition-colors group-hover:bg-brand group-hover:text-white`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full font-display">
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </div>
            </div>
            <div>
                <p className="type-ui text-muted-foreground">{title}</p>
                <h3 className="type-h1 text-2xl mt-1 group-hover:translate-x-1 transition-transform origin-left">
                    {value}
                </h3>
            </div>
        </div>
    );
}

function FunnelStep({ label, count, percentage, color }: any) {
    return (
        <div className="relative group/step">
            <div className="flex items-center justify-between mb-2">
                <span className="type-ui text-foreground group-hover/step:text-brand transition-colors">{label}</span>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-bold">{count}</span>
                    <span className="type-ui text-muted-foreground min-w-[40px] text-right">
                        {percentage.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
