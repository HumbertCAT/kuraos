'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Clock, User, Search, CheckCircle, XCircle, AlertCircle, Edit, Trash2, Check, X, CalendarCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PaginationToolbar from '@/components/ui/pagination-toolbar';

import { api, API_URL, ListMetadata } from '@/lib/api';
const locales = { es, en: enUS };

interface Booking {
    id: string;
    patient_id: string;
    patient_name: string;
    patient_email?: string;
    service_title: string;
    start_time: string;
    end_time: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
    created_at: string;
}

export default function BookingsPage() {
    const params = useParams();
    const locale = params.locale as string || 'es';

    const localizer = useMemo(() => dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
        getDay,
        locales,
    }), []);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [meta, setMeta] = useState<ListMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'future' | 'past'>('future');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);

    const translations = {
        es: {
            title: 'Reservas',
            subtitle: 'Consulta, confirma y gestiona las reservas de tus pacientes. Filtra por estado y visualiza en calendario.',
            future: 'Próximas',
            past: 'Anteriores',
            search: 'Buscar por nombre o servicio...',
            allStatus: 'Todos los estados',
            confirmed: 'Confirmada',
            pending: 'Pendiente',
            cancelled: 'Cancelada',
            completed: 'Completada',
            noBookings: 'No hay reservas',
            noBookingsDesc: 'Las reservas aparecerán aquí cuando tus clientes agenden citas.',
            patient: 'Paciente',
            service: 'Servicio',
            dateTime: 'Fecha y hora',
            status: 'Estado',
            actions: 'Acciones',
            confirm: 'Confirmar',
            cancel: 'Cancelar',
            complete: 'Completar',
            delete: 'Eliminar',
            calendarView: 'Vista de Calendario',
        },
        en: {
            title: 'Bookings',
            subtitle: 'View, confirm, and manage patient bookings. Filter by status and visualize in calendar view.',
            future: 'Upcoming',
            past: 'Past',
            search: 'Search by patient or service...',
            allStatus: 'All statuses',
            confirmed: 'Confirmed',
            pending: 'Pending',
            cancelled: 'Cancelled',
            completed: 'Completed',
            noBookings: 'No bookings',
            noBookingsDesc: 'Bookings will appear here when your clients schedule appointments.',
            patient: 'Patient',
            service: 'Service',
            dateTime: 'Date & Time',
            status: 'Status',
            actions: 'Actions',
            confirm: 'Confirm',
            cancel: 'Cancel',
            complete: 'Complete',
            delete: 'Delete',
            calendarView: 'Calendar View',
        },
        ca: {
            title: 'Reserves',
            subtitle: 'Consulta, confirma i gestiona les reserves dels teus pacients. Filtra per estat i visualitza en calendari.',
            future: 'Properes',
            past: 'Anteriors',
            search: 'Cercar per pacient o servei...',
            allStatus: 'Tots els estats',
            confirmed: 'Confirmada',
            pending: 'Pendent',
            cancelled: 'Cancel·lada',
            completed: 'Completada',
            noBookings: 'No hi ha reserves',
            noBookingsDesc: 'Les reserves apareixeran aquí quan els teus clients agendin cites.',
            patient: 'Pacient',
            service: 'Servei',
            dateTime: 'Data i hora',
            status: 'Estat',
            actions: 'Accions',
            confirm: 'Confirmar',
            cancel: 'Cancel·lar',
            complete: 'Completar',
            delete: 'Eliminar',
            calendarView: 'Vista de Calendari',
        },
    };

    const t = translations[locale as 'es' | 'en' | 'ca'] || translations.en;

    const statusConfig: Record<string, { label: string; className: string }> = {
        CONFIRMED: { label: t.confirmed, className: 'badge badge-success' },
        PENDING: { label: t.pending, className: 'badge badge-warning' },
        CANCELLED: { label: t.cancelled, className: 'badge badge-risk' },
        COMPLETED: { label: t.completed, className: 'badge badge-secondary' },
    };

    useEffect(() => {
        loadBookings();
    }, []);

    async function loadBookings() {
        setLoading(true);
        try {
            const resp = await api.bookings.list({
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                per_page: 20
            });
            setBookings(resp.data);
            setMeta(resp.meta);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBookings();
    }, [page, statusFilter]);

    async function updateBookingStatus(bookingId: string, newStatus: string) {
        try {
            await api.bookings.updateStatus(bookingId, newStatus);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b));
        } catch (err) {
            console.error('Error updating booking status', err);
        }
        setOpenMenu(null);
    }

    async function deleteBooking(bookingId: string) {
        if (!confirm('¿Seguro que quieres eliminar esta reserva?')) return;
        try {
            await api.bookings.delete(bookingId);
            setBookings(prev => prev.filter(b => b.id !== bookingId));
        } catch (err) {
            console.error('Error deleting booking', err);
        }
        setOpenMenu(null);
    }

    // Generate avatar initials and color (from Clinical Roster pattern)
    function getAvatarProps(booking: Booking) {
        const initials = (booking.patient_name?.split(' ').map(n => n[0]).join('') || '?').toUpperCase().substring(0, 2);
        const colors = [
            'from-violet-500 to-fuchsia-500',
            'from-blue-500 to-cyan-500',
            'from-emerald-500 to-teal-500',
            'from-orange-500 to-amber-500',
            'from-pink-500 to-rose-500',
            'from-indigo-500 to-purple-500',
        ];
        const colorIndex = (booking.patient_name?.charCodeAt(0) || 0) % colors.length;
        return { initials, gradient: colors[colorIndex] };
    }
    async function cancelBookingWithReason(bookingId: string) {
        const reason = prompt('Motivo de cancelación (opcional):');
        try {
            await api.bookings.cancel(bookingId, reason || undefined);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
            alert('Reserva cancelada correctamente');
        } catch (err: any) {
            console.error('Error cancelling booking', err);
            alert(`Error: ${err.message || 'No se pudo cancelar'}`);
        }
        setOpenMenu(null);
    }

    const now = new Date();

    const filteredBookings = bookings
        .filter(b => {
            const bookingDate = new Date(b.start_time);
            if (activeTab === 'future') return bookingDate >= now;
            return bookingDate < now;
        })
        .filter(b => {
            if (statusFilter !== 'all' && b.status !== statusFilter) return false;
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return b.patient_name?.toLowerCase().includes(search) || b.service_title?.toLowerCase().includes(search);
            }
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.start_time).getTime();
            const dateB = new Date(b.start_time).getTime();
            return activeTab === 'future' ? dateA - dateB : dateB - dateA;
        });

    const calendarEvents = bookings.map(b => ({
        id: b.id,
        title: `${b.patient_name} - ${b.service_title}`,
        start: new Date(b.start_time),
        end: new Date(b.end_time),
        status: b.status,
    }));

    const eventStyleGetter = (event: any) => {
        const statusColors: Record<string, string> = {
            CONFIRMED: '#10b981',
            PENDING: '#f59e0b',
            CANCELLED: '#ef4444',
            COMPLETED: '#6366f1',
        };
        return { style: { backgroundColor: statusColors[event.status] || '#6366f1', borderRadius: '6px', color: 'white', border: 'none' } };
    };

    const metrics = useMemo(() => {
        return {
            total: meta?.total || 0,
            upcoming: bookings.filter(b => new Date(b.start_time) >= now).length,
            pending: bookings.filter(b => b.status === 'PENDING').length,
            revenue: meta?.extra?.total_confirmed_revenue || 0
        };
    }, [bookings, now, meta]);

    if (loading) return <div className="p-6 text-center text-foreground/60">Loading...</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                icon={CalendarCheck}
                kicker="CONNECT"
                title={t.title}
                subtitle={
                    <div className="flex flex-col gap-1">
                        <p>{t.subtitle}</p>
                        <div className="flex gap-4 text-xs font-mono text-muted-foreground items-center mt-2">
                            <span><span className="text-foreground font-medium">{metrics.total}</span> Total</span>
                            <span><span className="text-brand font-medium">{metrics.upcoming}</span> {t.future}</span>
                            <span><span className="text-amber-500 font-medium">{metrics.pending}</span> {t.pending}</span>
                            <span><span className="text-emerald-500 font-medium">{metrics.revenue}€</span> Ingresos</span>
                        </div>
                    </div>
                }
            />

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">{t.noBookings}</h3>
                    <p className="text-foreground/60 mt-1">{t.noBookingsDesc}</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {/* Control Deck Toolbar */}
                    <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Tabs (Segmented Control) */}
                        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit order-2 sm:order-1">
                            <button
                                onClick={() => setActiveTab('future')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'future' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t.future}
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'past' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t.past}
                            </button>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-brand/50 outline-none transition-all"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-muted-foreground focus:ring-2 focus:ring-brand/50 outline-none transition-all"
                            >
                                <option value="all">{t.allStatus}</option>
                                <option value="CONFIRMED">{t.confirmed}</option>
                                <option value="PENDING">{t.pending}</option>
                                <option value="CANCELLED">{t.cancelled}</option>
                                <option value="COMPLETED">{t.completed}</option>
                            </select>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-brand/15 to-transparent">
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">{t.patient}</th>
                                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase hidden md:table-cell">{t.service}</th>
                                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">{t.dateTime}</th>
                                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider uppercase">ESTADO</th>
                                <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider uppercase">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-0">
                            {filteredBookings.map((booking) => {
                                const startDate = new Date(booking.start_time);
                                const endDate = new Date(booking.end_time);
                                const config = statusConfig[booking.status] || statusConfig.PENDING;
                                const { initials, gradient } = getAvatarProps(booking);

                                return (
                                    <tr
                                        key={booking.id}
                                        className="border-b border-border hover:bg-muted/40 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium text-xs flex-shrink-0`}>
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <Link
                                                        href={`/patients/${booking.patient_id}`}
                                                        className="type-ui font-medium text-foreground hover:text-brand transition-colors truncate block"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {booking.patient_name}
                                                    </Link>
                                                    {booking.patient_email && (
                                                        <p className="text-xs text-muted-foreground truncate leading-tight">
                                                            {booking.patient_email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="type-body text-muted-foreground">{booking.service_title}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="type-ui font-mono text-muted-foreground text-xs uppercase">
                                                {startDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="type-ui font-mono text-xs text-muted-foreground/60">
                                                {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={config.className}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                {booking.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                                                        className="p-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                                        title={t.confirm}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                                        className="p-2 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                                                        title={t.complete}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => cancelBookingWithReason(booking.id)}
                                                        className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
                                                        title={t.cancel}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteBooking(booking.id)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                    title={t.delete}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Calendar View */}
            <div className="bg-card rounded-xl border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t.calendarView}</h2>
                <BigCalendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    views={[Views.WEEK, Views.MONTH, Views.DAY]}
                    view={currentView}
                    onView={setCurrentView}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    eventPropGetter={eventStyleGetter}
                    culture={locale}
                    min={new Date(2000, 0, 1, 8, 0, 0)}
                    max={new Date(2000, 0, 1, 21, 0, 0)}
                />
            </div>
            {/* Pagination */}
            {meta && meta.filtered > 0 && (
                <div className="mt-4 border-t bg-card rounded-b-xl overflow-hidden">
                    <PaginationToolbar
                        meta={meta}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </div>
    );
}

