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
import { QuickNote } from '@/components/dashboard/QuickNote';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { Brain, Wallet, Target, Users } from 'lucide-react';

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
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
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
        <div className="grid grid-cols-12 gap-6 p-6">
            {/* ========== ROW 1: HERO - THE BRIEFING (span-12) ========== */}
            <div className="col-span-12">
                <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-5">
                    <h1 className="type-h2 mb-1">{getGreeting()}, {firstName}</h1>
                    <p className="type-ui text-muted-foreground mb-4">Tu resumen diario está listo</p>
                    <BriefingPlayer compact />
                </div>
            </div>

            {/* ========== ROW 2: VITAL SIGNS (span-12, 3 cards) ========== */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                <VitalSignCard
                    label="Ingresos Mes"
                    value={`€${data.monthlyRevenue.toFixed(0)}`}
                    badge={data.pendingPayments > 0 ? `+€${data.pendingPayments.toFixed(0)} pend.` : undefined}
                    badgeType="warning"
                    icon={<Wallet className="w-5 h-5" />}
                    iconColor="text-emerald-500"
                />
                <VitalSignCard
                    label="Nuevos Leads"
                    value={data.newLeadsThisWeek}
                    badge="Esta semana"
                    icon={<Target className="w-5 h-5" />}
                    iconColor="text-blue-500"
                />
                <VitalSignCard
                    label={`${terminology.plural} Activos`}
                    value={data.totalPatients}
                    action={{ label: 'Ver lista', href: '/patients' }}
                    icon={<Users className="w-5 h-5" />}
                    iconColor="text-teal-500"
                />
            </div>

            {/* ========== ROW 3: THE CORE (8 + 4 split) ========== */}

            {/* LEFT: Focus Area - "The Present" (span-8) */}
            <div className="col-span-12 lg:col-span-8">
                <FocusSessionCard
                    nextSession={data.nextSession}
                    onViewFullAgenda={() => window.location.href = '/calendar'}
                />
            </div>

            {/* RIGHT: Quick Tools Sidebar (span-4) */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <QuickNote />
                <RecentPatients />
            </div>
        </div>
    );
}
