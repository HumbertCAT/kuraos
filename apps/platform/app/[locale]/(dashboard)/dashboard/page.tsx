'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, API_URL } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';
import { CyberCard } from '@/components/ui/CyberCard';
import {
    Brain, Users, Calendar, Target, Wallet, AlertTriangle,
    ChevronRight, Clock, CheckCircle, Activity
} from 'lucide-react';
import BriefingPlayer from '@/components/BriefingPlayer';

interface PatientSummary {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    journey_status?: Record<string, string>;
}

interface BookingSummary {
    id: string;
    patient_name: string;
    service_title: string;
    service_price?: number;
    start_time: string;
    status: string;
    amount_paid: number;
}

interface DashboardData {
    patients: PatientSummary[];
    totalPatients: number;
    priorityPatients: PatientSummary[];
    bookings: BookingSummary[];
    totalBookings: number;
    monthlyRevenue: number;
    pendingPayments: number;
    totalForms: number;
    activeForms: number;
    newLeadsThisWeek: number;
}

// AI Suggestions moved to AletheiaObservatory sidebar (v1.0.5.1)

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const terminology = useTerminology();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    // suggestions state removed - now in sidebar Global Observatory

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [patientsResult, bookingsResult, formsResult, leadsResult] = await Promise.allSettled([
                    api.patients.list(),
                    api.bookings.list({}),
                    fetch(`${API_URL}/forms/templates`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                    fetch(`${API_URL}/leads/?limit=100`, { credentials: 'include' }).then(r => r.ok ? r.json() : { leads: [] }),
                ]);

                const patientsRes = patientsResult.status === 'fulfilled' ? patientsResult.value : { patients: [], total: 0 };
                const bookingsRes = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
                const formsRes = formsResult.status === 'fulfilled' ? formsResult.value : [];
                const leadsRes = leadsResult.status === 'fulfilled' ? leadsResult.value : { leads: [] };

                const patients = patientsRes.patients || [];
                const totalPatients = patientsRes.total || patients.length;
                const bookings = (bookingsRes || []).map((b: any) => ({
                    id: b.id,
                    patient_name: b.patient_name || 'Paciente',
                    service_title: b.service_title || 'Servicio',
                    start_time: b.start_time,
                    status: b.status,
                    amount_paid: b.amount_paid || 0,
                }));

                const forms = Array.isArray(formsRes) ? formsRes : [];
                const leads = leadsRes.leads || [];
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const newLeadsThisWeek = leads.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length;

                const priorityStatuses = ['BLOCKED_MEDICAL', 'BLOCKED_HIGH_RISK', 'STAGNATION_ALERT', 'AWAITING_PAYMENT'];
                const priorityPatients = patients.filter((p: PatientSummary) => {
                    if (!p.journey_status) return false;
                    return Object.values(p.journey_status).some(s => priorityStatuses.includes(s));
                });

                const confirmedBookings = bookings.filter((b: BookingSummary) =>
                    b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                );
                const monthlyRevenue = confirmedBookings.reduce((sum: number, b: BookingSummary) => sum + b.amount_paid, 0);
                const pendingPayments = bookings
                    .filter((b: BookingSummary) => b.status === 'PENDING')
                    .reduce((sum: number, b: BookingSummary) => sum + (b.service_price || 450), 0);

                // AI suggestions now handled by AletheiaObservatory sidebar

                setData({
                    patients: patients.slice(0, 5),
                    totalPatients,
                    priorityPatients,
                    bookings: bookings.slice(0, 5),
                    totalBookings: bookings.length,
                    monthlyRevenue,
                    pendingPayments,
                    totalForms: forms.length,
                    activeForms: forms.filter((f: any) => f.is_active).length,
                    newLeadsThisWeek,
                });
            } catch (error) {
                console.error('[Dashboard] Failed to load:', error);
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-foreground/60">
                    <Brain className="w-6 h-6 animate-pulse text-ai" />
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-12 text-foreground/60">Error loading dashboard</div>;
    }

    const nextBooking = data.bookings.find(b => new Date(b.start_time) > new Date());

    return (
        <div className="space-y-6">
            {/* ZONE A: Chief of Staff (col-span-12) - Elegant Glass */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm relative overflow-hidden dark:border-ai/30 dark:shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                {/* Subtle internal glow layer (dark mode only) */}
                <div className="absolute inset-0 bg-gradient-to-r from-ai/5 to-brand/5 opacity-0 pointer-events-none dark:opacity-50"></div>
                <div className="relative z-10">
                    <BriefingPlayer />
                </div>
            </div>

            {/* Pending Actions moved to AletheiaObservatory sidebar Agent Center */}

            {/* ZONE B: Focus Card + Pillar Stack (12-column grid) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left: Focus Card (col-span-8) */}
                <div className="xl:col-span-8 space-y-6">
                    {/* The Focus Card */}
                    <CyberCard className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-display text-foreground">El Foco</h2>
                                    <p className="text-sm text-muted-foreground">Lo más importante ahora</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {nextBooking ? (
                            <div className="p-4 rounded-lg bg-muted border border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-label text-muted-foreground mb-1">Próxima Sesión</p>
                                        <p className="text-xl font-display text-foreground">{nextBooking.service_title}</p>
                                        <p className="text-sm text-muted-foreground">{nextBooking.patient_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-stats font-bold text-brand">
                                            {new Date(nextBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-foreground/60">
                                            {new Date(nextBooking.start_time).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-muted border border-border text-center">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-brand" />
                                <p className="text-muted-foreground">Sin sesiones pendientes hoy</p>
                            </div>
                        )}
                    </CyberCard>

                    {/* AletheIA Suggestions moved to sidebar Global Observatory (v1.0.5.1) */}
                </div>

                {/* Right: Pillar Stack (col-span-4) */}
                <div className="xl:col-span-4 space-y-4">
                    {/* Metric 1: New Leads (Engage) */}
                    <CyberCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <Target className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-label text-muted-foreground">Nuevos Leads</p>
                                    <p className="text-2xl font-bold font-stats text-foreground">{data.newLeadsThisWeek}</p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">esta semana</span>
                        </div>
                    </CyberCard>

                    {/* Metric 2: Active Patients (Practice) */}
                    <CyberCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-teal-500" />
                                </div>
                                <div>
                                    <p className="font-label text-muted-foreground">{terminology.plural}</p>
                                    <p className="text-2xl font-bold font-stats text-foreground">{data.totalPatients}</p>
                                </div>
                            </div>
                            <Link href="/patients" className="text-xs text-brand hover:underline">Ver</Link>
                        </div>
                    </CyberCard>

                    {/* Metric 3: Month Revenue */}
                    <CyberCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-label text-muted-foreground">Ingresos Mes</p>
                                    <p className="text-2xl font-bold font-stats text-foreground">{data.monthlyRevenue.toFixed(0)}€</p>
                                </div>
                            </div>
                            {data.pendingPayments > 0 && (
                                <span className="text-xs text-amber-500 font-stats">+{data.pendingPayments.toFixed(0)}€ pend.</span>
                            )}
                        </div>
                    </CyberCard>

                    {/* Priority Patients Alert */}
                    {data.priorityPatients.length > 0 && (
                        <CyberCard variant="alert" className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="w-5 h-5 text-risk" />
                                <p className="text-sm font-display text-foreground">Requieren Atención</p>
                                <span className="text-xs px-2 py-0.5 rounded bg-risk/10 text-risk font-stats">{data.priorityPatients.length}</span>
                            </div>
                            <div className="space-y-1">
                                {data.priorityPatients.slice(0, 3).map(p => (
                                    <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors">
                                        <span className="text-sm text-foreground">{p.first_name} {p.last_name}</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </Link>
                                ))}
                            </div>
                        </CyberCard>
                    )}
                </div>
            </div>

            {/* ZONE C: Recent Lists (col-span-12) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Bookings */}
                <CyberCard>
                    <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-brand" />
                            <h3 className="font-semibold text-foreground">Próximas Reservas</h3>
                        </div>
                        <Link href="/calendar" className="text-xs text-brand hover:underline flex items-center gap-1">
                            Ver todas <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {data.bookings.length === 0 ? (
                            <div className="p-6 text-center text-foreground/60">Sin reservas próximas</div>
                        ) : (
                            data.bookings.slice(0, 4).map(b => (
                                <div key={b.id} className="px-6 py-3 flex items-center justify-between hover:bg-accent transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{b.service_title}</p>
                                        <p className="text-xs text-muted-foreground">{b.patient_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-muted-foreground">
                                            {new Date(b.start_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${b.status === 'CONFIRMED' ? 'bg-brand/10 text-brand' :
                                            b.status === 'COMPLETED' ? 'bg-muted text-muted-foreground' :
                                                'bg-warning/10 text-warning'
                                            }`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CyberCard>

                {/* Recent Patients */}
                <CyberCard>
                    <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-brand" />
                            <h3 className="font-semibold text-foreground">{terminology.plural} Recientes</h3>
                        </div>
                        <Link href="/patients" className="text-xs text-brand hover:underline flex items-center gap-1">
                            Ver todos <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {data.patients.map(p => (
                            <Link key={p.id} href={`/patients/${p.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-accent transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-medium">
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <p className="text-sm font-medium text-foreground ">{p.first_name} {p.last_name}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </CyberCard>
            </div>
        </div >
    );
}
