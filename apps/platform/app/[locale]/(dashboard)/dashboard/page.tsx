'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';
import {
    Brain, Sparkles, Users, Calendar, FileText, DollarSign,
    AlertTriangle, TrendingUp, ChevronRight, Clock, CheckCircle,
    Zap, Target, ArrowUpRight, ArrowDownRight, LayoutGrid,
    MessageSquareWarning
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import PendingActionsWidget from '@/components/PendingActionsWidget';
import BriefingPlayer from '@/components/BriefingPlayer';

/**
 * Main Dashboard - Command Center for TherapistOS
 * 
 * The "wow landing" for investors showing everything at a glance:
 * - AletheIA Suggestions
 * - Priority Patients
 * - Recent Activity
 * - Revenue Summary
 */

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
    service_price?: number;  // Optional - for pending payment calculations
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
}

// AletheIA Suggestion type - chat_risk is HIGHEST priority
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

// Generate AI suggestions from patient data
function generateAISuggestions(patients: PatientSummary[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    patients.forEach(patient => {
        if (!patient.journey_status) return;

        Object.entries(patient.journey_status).forEach(([journey, status]) => {
            const fullName = `${patient.first_name} ${patient.last_name}`;

            if (status === 'BLOCKED_MEDICAL' || status === 'BLOCKED_HIGH_RISK') {
                suggestions.push({
                    id: `${patient.id}-blocked`,
                    type: 'critical',
                    title: `⛔ ${fullName} - Bloqueado`,
                    description: 'Requiere revisión manual antes de continuar el proceso.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Ver Paciente',
                    actionLink: `/patients/${patient.id}`,
                });
            } else if (status === 'STAGNATION_ALERT') {
                suggestions.push({
                    id: `${patient.id}-stagnant`,
                    type: 'warning',
                    title: `⚠️ ${fullName} - Sin Actividad`,
                    description: 'Llevan tiempo sin interacción. Considera contactar para seguimiento.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Contactar',
                    actionLink: `/patients/${patient.id}`,
                });
            } else if (status === 'AWAITING_PAYMENT') {
                suggestions.push({
                    id: `${patient.id}-payment`,
                    type: 'action',
                    title: `💳 ${fullName} - Pago Pendiente`,
                    description: 'El recordatorio de pago fue enviado automáticamente.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Ver Estado',
                    actionLink: `/patients/${patient.id}`,
                });
            } else if (status === 'AWAITING_BIRTH_DATA' || status === 'AWAITING_WAIVER') {
                suggestions.push({
                    id: `${patient.id}-data`,
                    type: 'action',
                    title: `📋 ${fullName} - Datos Pendientes`,
                    description: 'Esperando información del paciente para continuar.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Enviar Recordatorio',
                    actionLink: `/patients/${patient.id}`,
                });
            } else if (status === 'PREPARATION_PHASE') {
                suggestions.push({
                    id: `${patient.id}-prep`,
                    type: 'insight',
                    title: `✨ ${fullName} - En Preparación`,
                    description: 'Buen momento para enviar material pre-sesión.',
                    patientId: patient.id,
                    patientName: fullName,
                    actionLabel: 'Enviar Material',
                    actionLink: `/patients/${patient.id}`,
                });
            }
        });
    });

    // Sort: critical first, then warning, then action, then insight
    const priority: Record<string, number> = { critical: 0, chat_risk: 0, warning: 1, action: 2, insight: 3 };
    suggestions.sort((a, b) => priority[a.type] - priority[b.type]);

    return suggestions.slice(0, 5); // Max 5 suggestions
}

// Suggestion card colors - chat_risk has pulsing red
const suggestionColors = {
    chat_risk: { bg: 'bg-red-100', border: 'border-red-400 animate-pulse', icon: 'text-red-600' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
    action: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
    insight: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500' },
};

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const terminology = useTerminology();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                console.log('[Dashboard] Starting data load...');

                // Parallel API calls with individual error handling
                const [patientsResult, bookingsResult, formsResult, riskAlertsResult] = await Promise.allSettled([
                    api.patients.list(),
                    api.bookings.list({}),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1'}/forms/templates`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1'}/monitoring/risk-alerts?hours=48`, { credentials: 'include' }).then(r => r.ok ? r.json() : { alerts: [] }),
                ]);

                // Log individual results for debugging
                console.log('[Dashboard] Patients result:', patientsResult);
                console.log('[Dashboard] Bookings result:', bookingsResult);
                console.log('[Dashboard] Forms result:', formsResult);

                // Extract data with proper error handling
                const patientsRes = patientsResult.status === 'fulfilled' ? patientsResult.value : { patients: [], total: 0 };
                const bookingsRes = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
                const formsRes = formsResult.status === 'fulfilled' ? formsResult.value : [];
                const riskAlertsRes = riskAlertsResult.status === 'fulfilled' ? riskAlertsResult.value : { alerts: [] };

                // Log any failed requests
                const failures: string[] = [];
                if (patientsResult.status === 'rejected') {
                    console.error('[Dashboard] Patients API failed:', patientsResult.reason);
                    failures.push('pacientes');
                }
                if (bookingsResult.status === 'rejected') {
                    console.error('[Dashboard] Bookings API failed:', bookingsResult.reason);
                    failures.push('reservas');
                }
                if (formsResult.status === 'rejected') {
                    console.error('[Dashboard] Forms API failed:', formsResult.reason);
                    failures.push('formularios');
                }

                if (failures.length > 0) {
                    setError(`Error cargando: ${failures.join(', ')}. Revisa la consola del navegador.`);
                }

                const patients = patientsRes.patients || [];
                const totalPatients = patientsRes.total || patients.length;
                console.log('[Dashboard] Total patients:', totalPatients, 'Array length:', patients.length);

                const bookings = (bookingsRes || []).map((b: any) => ({
                    id: b.id,
                    patient_name: b.patient_name || 'Paciente',
                    service_title: b.service_title || 'Servicio',
                    start_time: b.start_time,
                    status: b.status,
                    amount_paid: b.amount_paid || 0,
                }));

                // Forms stats
                const forms = Array.isArray(formsRes) ? formsRes : [];
                const totalForms = forms.length;
                const activeForms = forms.filter((f: any) => f.is_active).length;
                console.log('[Dashboard] Forms:', totalForms, 'active:', activeForms);

                // Calculate priority patients (blocked, stagnant, awaiting action)
                const priorityStatuses = ['BLOCKED_MEDICAL', 'BLOCKED_HIGH_RISK', 'STAGNATION_ALERT', 'AWAITING_PAYMENT'];
                const priorityPatients = patients.filter((p: PatientSummary) => {
                    if (!p.journey_status) return false;
                    return Object.values(p.journey_status).some(s => priorityStatuses.includes(s));
                });

                // Calculate revenue (from confirmed bookings)
                const confirmedBookings = bookings.filter((b: BookingSummary) =>
                    b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                );
                const monthlyRevenue = confirmedBookings.reduce((sum: number, b: BookingSummary) => sum + b.amount_paid, 0);
                const pendingPayments = bookings
                    .filter((b: BookingSummary) => b.status === 'PENDING')
                    .reduce((sum: number, b: BookingSummary) => sum + (b.service_price || 450), 0); // Fallback to 450€ for demo

                // Generate AI suggestions from patient journeys
                const aiSuggestions = generateAISuggestions(patients);

                // Add WhatsApp risk alerts as HIGHEST PRIORITY (chat_risk)
                const riskAlerts: AISuggestion[] = (riskAlertsRes.alerts || []).map((alert: any) => ({
                    id: `chat-risk-${alert.id}`,
                    type: 'chat_risk' as const,
                    title: `🚨 ${alert.patient_name} - Alerta de Chat`,
                    description: alert.risk_flags?.join(', ') || alert.summary,
                    patientId: alert.patient_id,
                    patientName: alert.patient_name,
                    actionLabel: 'Ver Monitorización',
                    actionLink: `/patients/${alert.patient_id}?tab=monitoring`,
                }));

                // Merge: chat_risk first, then sorted suggestions
                const priority = { chat_risk: -1, critical: 0, warning: 1, action: 2, insight: 3 };
                const allSuggestions = [...riskAlerts, ...aiSuggestions];
                allSuggestions.sort((a, b) => priority[a.type] - priority[b.type]);

                setSuggestions(allSuggestions.slice(0, 6)); // Max 6 suggestions

                setData({
                    patients: patients.slice(0, 5), // Recent 5 for display
                    totalPatients,
                    priorityPatients,
                    bookings: bookings.slice(0, 5), // Recent 5 for display
                    totalBookings: bookings.length,
                    monthlyRevenue,
                    pendingPayments,
                    totalForms,
                    activeForms,
                });
                console.log('[Dashboard] Data loaded successfully');
            } catch (error) {
                console.error('[Dashboard] Failed to load dashboard:', error);
                setError(`Error general: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-slate-500">
                    <Brain className="w-6 h-6 animate-pulse text-purple-500" />
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-12 text-slate-500">Error loading dashboard</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <SectionHeader
                        icon={LayoutGrid}
                        title={t('title')}
                        subtitle={t('subtitle')}
                        gradientFrom="from-pink-500"
                        gradientTo="to-rose-500"
                        shadowColor="shadow-pink-200"
                    />
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">{t('loadingError')}</p>
                            <p className="text-sm text-amber-700">{error}</p>
                            <p className="text-xs text-amber-600 mt-1">{t('checkConsole')}</p>
                        </div>
                    </div>
                )}

                {/* Chief of Staff - Daily Audio Briefing */}
                <BriefingPlayer />

                {/* Pending Agent Actions (Human-in-the-Loop) */}
                <PendingActionsWidget />

                {/* Quick Stats - Premium Design */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Patients Card */}
                    <div className="group relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-4xl font-bold text-white font-headline">{data.totalPatients}</p>
                            </div>
                            <p className="text-sm text-indigo-100 font-medium font-caption uppercase tracking-wide">{terminology.plural} Totales</p>
                        </div>
                    </div>

                    {/* Bookings Card */}
                    <div className="group relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-3 right-3 text-xs text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">{data.totalBookings} {t('total')}</span>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-4xl font-bold text-white font-headline">
                                    {data.bookings.filter(b => new Date(b.start_time) > new Date()).length}
                                </p>
                            </div>
                            <p className="text-sm text-blue-100 font-medium font-caption uppercase tracking-wide">{t('upcomingBookings')}</p>
                        </div>
                    </div>

                    {/* Forms Card */}
                    <div className="group relative bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl p-5 shadow-lg shadow-fuchsia-200/50 hover:shadow-xl hover:shadow-fuchsia-300/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-3 right-3 text-xs text-emerald-200 bg-emerald-500/40 px-2 py-0.5 rounded-full">{data.activeForms} {t('active')}</span>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-4xl font-bold text-white font-headline">{data.totalForms}</p>
                            </div>
                            <p className="text-sm text-pink-100 font-medium font-caption uppercase tracking-wide">{t('forms')}</p>
                        </div>
                    </div>

                    {/* Attention Card */}
                    <div className="group relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-4xl font-bold text-white font-headline">{data.priorityPatients.length}</p>
                            </div>
                            <p className="text-sm text-amber-100 font-medium font-caption uppercase tracking-wide">{t('needsAttention')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - AletheIA Suggestions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* AletheIA Suggestions Card */}
                        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-xl border border-purple-200 overflow-hidden">
                            <div className="px-5 py-4 flex items-center gap-3 border-b border-purple-200">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-bold text-purple-900 flex items-center gap-2 font-headline">
                                        {t('aletheiaTitle')}
                                        <span className="text-xs font-normal px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full font-caption">
                                            ✨ AI
                                        </span>
                                    </h2>
                                    <p className="text-sm text-purple-600">{t('aletheiaSubtitle')}</p>
                                </div>
                                {suggestions.length > 0 && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-caption">
                                        {suggestions.length} {t('pending')}
                                    </span>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                {suggestions.length === 0 ? (
                                    <div className="text-center py-8 text-purple-600">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                                        <p className="font-medium">{t('allGood')}</p>
                                        <p className="text-sm text-purple-500">{t('noPriorityActions')}</p>
                                    </div>
                                ) : (
                                    suggestions.map(suggestion => {
                                        const colors = suggestionColors[suggestion.type];
                                        return (
                                            <div
                                                key={suggestion.id}
                                                className={`${colors.bg} ${colors.border} border rounded-lg p-4 flex items-start justify-between gap-4`}
                                            >
                                                <div className="flex items-start gap-3 flex-1">
                                                    <Zap className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                                                    <div>
                                                        <p className="font-medium text-slate-800">{suggestion.title}</p>
                                                        <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                                                    </div>
                                                </div>
                                                {suggestion.actionLink && (
                                                    <Link
                                                        href={suggestion.actionLink}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                                                    >
                                                        {suggestion.actionLabel}
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Recent Bookings */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <h2 className="font-semibold text-slate-800 font-headline">{t('upcomingReservations')}</h2>
                                </div>
                                <Link href="/bookings" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                                    {t('viewAllBookings')} <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {data.bookings.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        {t('noUpcomingBookings')}
                                    </div>
                                ) : (
                                    data.bookings.slice(0, 4).map(booking => (
                                        <div key={booking.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-medium text-slate-800">{booking.service_title}</p>
                                                <p className="text-sm text-slate-500">{booking.patient_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-600">
                                                    {new Date(booking.start_time).toLocaleDateString('es-ES', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-caption ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                                                    booking.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Quick Access */}
                    <div className="space-y-6">
                        {/* Priority Patients */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-amber-50">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <h2 className="font-semibold text-amber-800 font-headline">Requieren Atención</h2>
                                </div>
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-caption">
                                    {data.priorityPatients.length}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {data.priorityPatients.length === 0 ? (
                                    <div className="p-6 text-center text-slate-500">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                                        <p className="text-sm">{t('noPriorityPatients')}</p>
                                    </div>
                                ) : (
                                    data.priorityPatients.slice(0, 4).map(patient => {
                                        const status = patient.journey_status ? Object.values(patient.journey_status)[0] : '';
                                        const isBlocked = status.includes('BLOCKED');

                                        return (
                                            <Link
                                                key={patient.id}
                                                href={`/patients/${patient.id}`}
                                                className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {patient.first_name[0]}{patient.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800 text-sm">
                                                            {patient.first_name} {patient.last_name}
                                                        </p>
                                                        <p className={`text-xs font-caption ${isBlocked ? 'text-red-600' : 'text-amber-600'}`}>
                                                            {status.replace(/_/g, ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Recent Patients */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <h2 className="font-semibold text-slate-800 font-headline">{terminology.plural} Recientes</h2>
                                </div>
                                <Link href="/patients" className="text-sm text-indigo-600 hover:underline">
                                    {t('viewAll')}
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {data.patients.slice(0, 5).map(patient => (
                                    <Link
                                        key={patient.id}
                                        href={`/patients/${patient.id}`}
                                        className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                                                {patient.first_name[0]}{patient.last_name[0]}
                                            </div>
                                            <p className="font-medium text-slate-700 text-sm">
                                                {patient.first_name} {patient.last_name}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Summary - Monthly */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl overflow-hidden text-white">
                            {/* Header with Month Name */}
                            <div className="px-5 py-3 bg-black/10 flex items-center gap-3">
                                <DollarSign className="w-5 h-5" />
                                <h2 className="font-semibold font-headline">
                                    {new Date().toLocaleString('es', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleString('es', { month: 'long' }).slice(1)}
                                </h2>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Reservas del Mes */}
                                <div className="bg-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-emerald-200" />
                                        <span className="text-emerald-100 font-medium">Reservas</span>
                                    </div>
                                    <span className="text-2xl font-bold">
                                        {data.bookings.filter(b => {
                                            const d = new Date(b.start_time);
                                            const now = new Date();
                                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                        }).length}
                                    </span>
                                </div>

                                {/* Ingresos del Mes */}
                                <div className="bg-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-5 h-5 text-emerald-200" />
                                        <span className="text-emerald-100 font-medium">Ingresos</span>
                                    </div>
                                    <span className="text-2xl font-bold">{data.monthlyRevenue.toFixed(0)}€</span>
                                </div>

                                {/* Pendiente Total - Amber */}
                                <div className="bg-amber-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-200" />
                                        <span className="text-amber-100 font-medium">Pendiente</span>
                                    </div>
                                    <span className="text-2xl font-bold text-amber-200">{data.pendingPayments.toFixed(0)}€</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

