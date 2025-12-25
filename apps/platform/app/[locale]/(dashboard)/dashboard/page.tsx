'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, API_URL } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';
import { CyberCard } from '@/components/ui/CyberCard';
import {
    Brain, Users, Calendar, Target, Wallet,
    AlertTriangle, ChevronRight, Clock, CheckCircle,
    Zap, Activity
} from 'lucide-react';
import PendingActionsWidget from '@/components/PendingActionsWidget';
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

interface AISuggestion {
    id: string;
    type: 'chat_risk' | 'critical' | 'warning' | 'action' | 'insight';
    title: string;
    description: string;
    patientId?: string;
    patientName?: string;
    actionLabel?: string;
    actionLink?: string;
}

function generateAISuggestions(patients: PatientSummary[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    patients.forEach(patient => {
        if (!patient.journey_status) return;
        Object.entries(patient.journey_status).forEach(([, status]) => {
            const fullName = `${patient.first_name} ${patient.last_name}`;
            if (status === 'BLOCKED_MEDICAL' || status === 'BLOCKED_HIGH_RISK') {
                suggestions.push({
                    id: `${patient.id}-blocked`,
                    type: 'critical',
                    title: `${fullName} - Bloqueado`,
                    description: 'Requiere revisión manual antes de continuar.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Ver',
                    actionLink: `/patients/${patient.id}`,
                });
            } else if (status === 'STAGNATION_ALERT') {
                suggestions.push({
                    id: `${patient.id}-stagnant`,
                    type: 'warning',
                    title: `${fullName} - Sin Actividad`,
                    description: 'Sin interacción reciente.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Contactar',
                    actionLink: `/patients/${patient.id}`,
                });
            }
        });
    });
    const priority: Record<string, number> = { critical: 0, chat_risk: 0, warning: 1, action: 2, insight: 3 };
    suggestions.sort((a, b) => priority[a.type] - priority[b.type]);
    return suggestions.slice(0, 4);
}

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const terminology = useTerminology();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

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

                const aiSuggestions = generateAISuggestions(patients);
                setSuggestions(aiSuggestions);

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
                <div className="flex items-center gap-3 text-zinc-500">
                    <Brain className="w-6 h-6 animate-pulse text-ai" />
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-12 text-zinc-500">Error loading dashboard</div>;
    }

    const nextBooking = data.bookings.find(b => new Date(b.start_time) > new Date());

    return (
        <div className="space-y-6">
            {/* ZONE A: Chief of Staff (col-span-12) */}
            <div className="rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-zinc-900 text-white p-6 shadow-lg border border-white/10">
                <BriefingPlayer />
            </div>

            {/* Pending Actions */}
            <PendingActionsWidget />

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
                                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">El Foco</h2>
                                    <p className="text-sm text-zinc-500">Lo más importante ahora</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {nextBooking ? (
                            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border-subtle">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">Próxima Sesión</p>
                                        <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{nextBooking.service_title}</p>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{nextBooking.patient_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-mono font-bold text-brand">
                                            {new Date(nextBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(nextBooking.start_time).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border-subtle text-center">
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-brand" />
                                <p className="text-zinc-600 dark:text-zinc-400">Sin sesiones pendientes hoy</p>
                            </div>
                        )}
                    </CyberCard>

                    {/* AletheIA Suggestions */}
                    {suggestions.length > 0 && (
                        <CyberCard variant="ai" className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Brain className="w-5 h-5 text-ai" />
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">AletheIA Sugiere</h3>
                                <span className="text-xs px-2 py-0.5 rounded bg-ai/10 text-ai font-mono">{suggestions.length}</span>
                            </div>
                            <div className="space-y-2">
                                {suggestions.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border-subtle">
                                        <div className="flex items-center gap-3">
                                            <Zap className={`w-4 h-4 ${s.type === 'critical' ? 'text-risk' : s.type === 'warning' ? 'text-amber-500' : 'text-ai'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.title}</p>
                                                <p className="text-xs text-zinc-500">{s.description}</p>
                                            </div>
                                        </div>
                                        {s.actionLink && (
                                            <Link href={s.actionLink} className="text-xs text-brand hover:underline flex items-center gap-1">
                                                {s.actionLabel} <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CyberCard>
                    )}
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
                                    <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Nuevos Leads</p>
                                    <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{data.newLeadsThisWeek}</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-400">esta semana</span>
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
                                    <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">{terminology.plural}</p>
                                    <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{data.totalPatients}</p>
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
                                    <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Ingresos Mes</p>
                                    <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{data.monthlyRevenue.toFixed(0)}€</p>
                                </div>
                            </div>
                            {data.pendingPayments > 0 && (
                                <span className="text-xs text-amber-500 font-mono">+{data.pendingPayments.toFixed(0)}€ pend.</span>
                            )}
                        </div>
                    </CyberCard>

                    {/* Priority Patients Alert */}
                    {data.priorityPatients.length > 0 && (
                        <CyberCard variant="alert" className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="w-5 h-5 text-risk" />
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requieren Atención</p>
                                <span className="text-xs px-2 py-0.5 rounded bg-risk/10 text-risk font-mono">{data.priorityPatients.length}</span>
                            </div>
                            <div className="space-y-1">
                                {data.priorityPatients.slice(0, 3).map(p => (
                                    <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center justify-between p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{p.first_name} {p.last_name}</span>
                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Próximas Reservas</h3>
                        </div>
                        <Link href="/calendar" className="text-xs text-brand hover:underline flex items-center gap-1">
                            Ver todas <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {data.bookings.length === 0 ? (
                            <div className="p-6 text-center text-zinc-500">Sin reservas próximas</div>
                        ) : (
                            data.bookings.slice(0, 4).map(b => (
                                <div key={b.id} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{b.service_title}</p>
                                        <p className="text-xs text-zinc-500">{b.patient_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                            {new Date(b.start_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${b.status === 'CONFIRMED' ? 'bg-brand/10 text-brand' :
                                                b.status === 'COMPLETED' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' :
                                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
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
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{terminology.plural} Recientes</h3>
                        </div>
                        <Link href="/patients" className="text-xs text-brand hover:underline flex items-center gap-1">
                            Ver todos <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {data.patients.map(p => (
                            <Link key={p.id} href={`/patients/${p.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-medium">
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.first_name} {p.last_name}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </Link>
                        ))}
                    </div>
                </CyberCard>
            </div>
        </div>
    );
}
