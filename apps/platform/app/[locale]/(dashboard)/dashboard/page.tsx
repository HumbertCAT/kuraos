'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, API_URL } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';
import { useAuth } from '@/context/auth-context';
import BriefingPlayer from '@/components/BriefingPlayer';
import { VitalSignCard } from '@/components/dashboard/VitalSignCard';
import { FocusSessionCard } from '@/components/dashboard/FocusSessionCard';
import { PipelineVelocity } from '@/components/dashboard/PipelineVelocity';
import { QuickNote } from '@/components/dashboard/QuickNote';
import { ActiveJourneysWidget } from '@/components/dashboard/ActiveJourneysWidget';
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
}

export default function DashboardPage() {
    const t = useTranslations('Dashboard');
    const terminology = useTerminology();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greeting.morning');
        if (hour < 19) return t('greeting.afternoon');
        return t('greeting.evening');
    };

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [patientsResult, bookingsResult, leadsResult] = await Promise.allSettled([
                    api.patients.list(),
                    api.bookings.list({}),
                    fetch(`${API_URL}/leads/?limit=100`, { credentials: 'include' }).then(r => r.ok ? r.json() : { leads: [] }),
                ]);

                const patientsRes = patientsResult.status === 'fulfilled' ? patientsResult.value : { patients: [], total: 0 };
                const bookingsRes = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
                const leadsRes = leadsResult.status === 'fulfilled' ? leadsResult.value : { leads: [] };

                const totalPatients = patientsRes.total || (patientsRes.patients || []).length;
                const bookings = (bookingsRes || []) as BookingSummary[];

                // Calculate revenue
                const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
                const monthlyRevenue = confirmedBookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0);
                const pendingPayments = bookings
                    .filter(b => b.status === 'PENDING')
                    .reduce((sum, b) => sum + (b.service_price || 450), 0);

                // Leads this week
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const leads = leadsRes.leads || [];
                const newLeadsThisWeek = leads.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length;

                // Find next upcoming session (within next 24 hours)
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const upcomingBookings = bookings
                    .filter(b => {
                        const bookingDate = new Date(b.start_time);
                        return bookingDate > now && bookingDate < tomorrow &&
                            (b.status === 'CONFIRMED' || b.status === 'PENDING');
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
                        // Mock Aletheia insight for demonstration
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
                <h1 className="type-h1 text-foreground">{getGreeting()}, {firstName}</h1>
                <p className="type-body text-muted-foreground mt-1">Tu resumen diario está listo</p>
                <div className="mt-3">
                    <BriefingPlayer compact />
                </div>
            </header>

            {/* ========== ROW 1: CLINICAL COCKPIT (Top Priority) ========== */}
            <div className="grid grid-cols-12 gap-6">
                {/* LEFT: Focus Area - "The Present" (span-8) */}
                <div className="col-span-12 lg:col-span-8">
                    <FocusSessionCard
                        nextSession={data.nextSession}
                        onViewFullAgenda={() => window.location.href = '/calendar'}
                    />
                </div>

                {/* RIGHT: Urgent Journeys (span-4) */}
                <div className="col-span-12 lg:col-span-4">
                    <ActiveJourneysWidget />
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
                    value="85%"
                    trend={{
                        direction: 'up',
                        label: t('vitalSigns.highDemand'),
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
                    <PipelineVelocity />
                </div>

                {/* RIGHT: Quick Note (span-4) */}
                <div className="col-span-12 lg:col-span-4">
                    <QuickNote />
                </div>
            </div>
        </div>
    );
}
