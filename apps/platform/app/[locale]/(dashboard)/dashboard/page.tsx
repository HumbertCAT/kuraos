'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api, API_URL } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';
import { useAuth } from '@/context/auth-context';
import BriefingPlayer from '@/components/BriefingPlayer';
import { VitalSignCard } from '@/components/dashboard/VitalSignCard';
import { FocusSessionCard } from '@/components/dashboard/FocusSessionCard';
import { PipelineVelocity } from '@/components/dashboard/PipelineVelocity';
import { ReferralWidget } from '@/components/dashboard/ReferralWidget';
import { ActiveJourneysWidget } from '@/components/dashboard/ActiveJourneysWidget';
// import { ActivationWidget } from '@/components/dashboard/ActivationWidget'; // v1.1.8 - Temporarily disabled
import { Brain, Wallet, Target, Activity } from 'lucide-react';

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
    totalPatients: number;
    monthlyRevenue: number;
    pendingPayments: number;
    newLeadsThisWeek: number;
    nextSession?: {
        id: string;
        patientName: string;
        patientInitials: string;
        serviceName: string;
        startTime: Date;
        aletheiaInsight?: {
            type: 'warning' | 'info' | 'success';
            message: string;
        };
    } | null;
    // Wired data for widgets
    pipelineStages: Array<{ key: string; labelKey: 'new' | 'contacted' | 'closing'; count: number; color: string; icon: React.ReactNode | null }>;
    activeJourneys: Array<{
        id: string;
        patientId: string;
        patientName: string;
        journeyName: string;
        journeyType: 'psychedelic' | 'coaching' | 'integration' | 'microdosing';
        status: 'ACTIVE' | 'BLOCKED' | 'PAYMENT_PENDING' | 'AWAITING_INTAKE';
        priority: 'high' | 'medium' | 'normal';
    }>;
    occupancyRate: number;
    thisMonthSessions: number;
}

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const tGreeting = useTranslations('Greeting');
    const terminology = useTerminology();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return tGreeting('morning', { name: firstName });
        if (hour < 19) return tGreeting('afternoon', { name: firstName });
        return tGreeting('evening', { name: firstName });
    };

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [patientsResult, bookingsResult, leadsResult] = await Promise.allSettled([
                    api.patients.list(1),
                    api.bookings.list({
                        start_date: new Date().toISOString().split('T')[0], // API takes YYYY-MM-DD
                        sort_by: 'start_time',
                        order: 'asc',
                        per_page: 20
                    }),
                    api.leads.list({ limit: 100 }),
                ]);

                const patientsRes = patientsResult.status === 'fulfilled' ? patientsResult.value : { data: [], meta: { total: 0 } } as any;
                const bookingsRes = bookingsResult.status === 'fulfilled' ? bookingsResult.value : { data: [] };
                const leadsRes = leadsResult.status === 'fulfilled' ? leadsResult.value : { data: [], leads: [] };

                const patients = patientsRes.data || [];
                const totalPatients = patientsRes.meta?.total || patients.length;
                const bookings = (bookingsRes.data || []) as BookingSummary[];

                // Calculate revenue
                const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
                const monthlyRevenue = confirmedBookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0);
                const pendingPayments = bookings
                    .filter(b => b.status === 'PENDING')
                    .reduce((sum, b) => sum + (b.service_price || 450), 0);

                // ------ WIRING: Pipeline Velocity (Leads by Status) ------
                const leads = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.leads || []);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const newLeadsThisWeek = leads.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length;

                // Calculate pipeline stages from leads
                const pipelineStages = [
                    { key: 'new', labelKey: 'new' as const, count: leads.filter((l: any) => l.status === 'NEW').length, color: 'bg-success', icon: null },
                    { key: 'contacted', labelKey: 'contacted' as const, count: leads.filter((l: any) => l.status === 'CONTACTED' || l.status === 'QUALIFIED').length, color: 'bg-warning', icon: null },
                    { key: 'closing', labelKey: 'closing' as const, count: leads.filter((l: any) => l.status === 'CONVERTED' || l.status === 'NEGOTIATING').length, color: 'bg-brand', icon: null },
                ];

                // ------ WIRING: Active Journeys (Patients with journey_status) ------
                const activeJourneys = patients
                    .filter((p: any) => p.journey_status && p.journey_status !== 'INACTIVE')
                    .slice(0, 5)
                    .map((p: any) => ({
                        id: p.id,
                        patientId: p.id,
                        patientName: `${p.first_name} ${p.last_name}`,
                        journeyName: p.journey_name || 'Treatment Journey',
                        journeyType: (p.journey_type || 'coaching') as 'psychedelic' | 'coaching' | 'integration' | 'microdosing',
                        status: (p.journey_status || 'ACTIVE') as 'ACTIVE' | 'BLOCKED' | 'PAYMENT_PENDING' | 'AWAITING_INTAKE',
                        priority: p.journey_status === 'BLOCKED' || p.journey_status === 'PAYMENT_PENDING' ? 'high' as const : 'normal' as const,
                    }));

                // ------ WIRING: Monthly Sessions (Occupancy) ------
                const thisMonthSessions = confirmedBookings.length;
                const targetMonthlySlots = 40; // Benchmark: 40 sessions/month
                const occupancyRate = Math.min(100, Math.round((thisMonthSessions / targetMonthlySlots) * 100));

                // Find next upcoming session
                const now = new Date();
                const upcomingBookings = bookings
                    .filter(b => {
                        const bookingDate = new Date(b.start_time);
                        return bookingDate > now && (b.status === 'CONFIRMED' || b.status === 'PENDING');
                    })
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                let nextSession: DashboardData['nextSession'] = null;

                if (upcomingBookings.length > 0) {
                    const next = upcomingBookings[0];
                    const initials = next.patient_name
                        .split(' ')
                        .map((n: string) => n.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                    nextSession = {
                        id: next.id,
                        patientName: next.patient_name,
                        patientInitials: initials,
                        serviceName: next.service_title,
                        startTime: new Date(next.start_time),
                        aletheiaInsight: {
                            type: 'warning',
                            message: 'Último reporte: Sueño irregular',
                        },
                    };
                }

                setData({
                    totalPatients,
                    monthlyRevenue,
                    pendingPayments,
                    newLeadsThisWeek,
                    nextSession,
                    // New wired data
                    pipelineStages,
                    activeJourneys,
                    occupancyRate,
                    thisMonthSessions,
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

    const firstName = user?.full_name?.split(' ')[0] || 'Usuario';

    return (
        <div className="p-6 space-y-6">
            {/* ========== GHOST HEADER: THE BRIEFING ========== */}
            <header className="pb-2">
                <h1 className="type-h1 text-foreground">{getGreeting()}</h1>
                <p className="type-body text-muted-foreground mt-1">{tGreeting('subtitle')}</p>
                <div className="mt-3">
                    <BriefingPlayer compact />
                </div>
            </header>

            {/* ========== ONBOARDING PROTOCOL (v1.1.8 - Temporarily disabled) ========== */}
            {/* <ActivationWidget /> */}

            {/* ========== ROW 1: CLINICAL COCKPIT (Top Priority) ========== */}
            <div className="grid grid-cols-12 gap-6">
                {/* LEFT: Focus Area - "The Present" (span-8) */}
                <div className="col-span-12 lg:col-span-8">
                    <FocusSessionCard
                        nextSession={data.nextSession}
                        onViewFullAgenda={() => router.push('/calendar')}
                    />
                </div>

                {/* RIGHT: Urgent Journeys (span-4) */}
                <div className="col-span-12 lg:col-span-4">
                    <ActiveJourneysWidget journeys={data.activeJourneys} />
                </div>
            </div>

            {/* ========== ROW 2: BUSINESS PULSE (Secondary) ========== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <VitalSignCard
                    label={t('vitalSigns.monthlyIncome')}
                    value={`€${data.monthlyRevenue.toFixed(0)}`}
                    trend={{
                        direction: data.monthlyRevenue > 0 ? 'up' : 'neutral',
                        label: `+15% ${t('vitalSigns.vsLastMonth')}`,
                        isPositive: true,
                    }}
                    icon={<Wallet className="w-5 h-5" />}
                    iconColor="text-success"
                />
                <VitalSignCard
                    label={t('vitalSigns.newLeads')}
                    value={data.newLeadsThisWeek}
                    trend={{
                        direction: 'neutral',
                        label: t('vitalSigns.sameAsLastWeek'),
                    }}
                    icon={<Target className="w-5 h-5" />}
                    iconColor="text-brand"
                />
                <VitalSignCard
                    label={t('vitalSigns.occupancyRate')}
                    value={`${data.occupancyRate}%`}
                    badge={`${data.thisMonthSessions} ${t('vitalSigns.sessions')}`}
                    badgeType="success"
                    trend={{
                        direction: data.occupancyRate > 50 ? 'up' : 'neutral',
                        label: data.occupancyRate > 70 ? t('vitalSigns.highDemand') : t('vitalSigns.sameAsLastWeek'),
                        isPositive: true,
                    }}
                    icon={<Activity className="w-5 h-5" />}
                    iconColor="text-ai"
                />
            </div>

            {/* ========== ROW 3: GROWTH & TOOLS (Tertiary) ========== */}
            <div className="grid grid-cols-12 gap-6">
                {/* LEFT: Pipeline (span-8) */}
                <div className="col-span-12 lg:col-span-8">
                    <PipelineVelocity stages={data.pipelineStages} />
                </div>

                {/* RIGHT: The Mycelium (span-4) */}
                <div className="col-span-12 lg:col-span-4">
                    <ReferralWidget />
                </div>
            </div>
        </div>
    );
}
