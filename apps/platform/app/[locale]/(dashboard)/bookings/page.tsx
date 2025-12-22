'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Clock, User, Search, CheckCircle, XCircle, AlertCircle, MoreVertical, Edit, Trash2, Check, X, CalendarCheck } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'future' | 'past'>('future');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);

    const t = {
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
            patient: 'Cliente',
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
    }[locale] || {
        title: 'Bookings', subtitle: 'View and manage patient bookings', future: 'Upcoming', past: 'Past', search: 'Search...', allStatus: 'All',
        confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed',
        noBookings: 'No bookings', noBookingsDesc: 'No bookings yet.',
        patient: 'Patient', service: 'Service', dateTime: 'Date & Time', status: 'Status',
        actions: 'Actions', confirm: 'Confirm', cancel: 'Cancel', complete: 'Complete', delete: 'Delete',
        calendarView: 'Calendar View',
    };

    useEffect(() => {
        loadBookings();
    }, []);

    async function loadBookings() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/booking/`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error('Error loading bookings', err);
        } finally {
            setLoading(false);
        }
    }

    async function updateBookingStatus(bookingId: string, newStatus: string) {
        try {
            const res = await fetch(`${API_URL}/booking/${bookingId}/status?new_status=${newStatus}`, {
                method: 'PATCH',
                credentials: 'include',
            });
            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b));
            } else {
                console.error('Error updating status:', await res.text());
            }
        } catch (err) {
            console.error('Error updating booking status', err);
        }
        setOpenMenu(null);
    }

    async function deleteBooking(bookingId: string) {
        if (!confirm('¿Seguro que quieres eliminar esta reserva?')) return;
        try {
            const res = await fetch(`${API_URL}/booking/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setBookings(prev => prev.filter(b => b.id !== bookingId));
            }
        } catch (err) {
            console.error('Error deleting booking', err);
        }
        setOpenMenu(null);
    }

    async function cancelBookingWithReason(bookingId: string) {
        const reason = prompt('Motivo de cancelación (opcional):');
        try {
            const res = await fetch(`${API_URL}/booking/${bookingId}/cancel`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || null }),
            });
            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
                alert('Reserva cancelada correctamente');
            } else {
                const error = await res.json();
                alert(`Error: ${error.detail || 'No se pudo cancelar'}`);
            }
        } catch (err) {
            console.error('Error cancelling booking', err);
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

    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        CONFIRMED: { color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle className="w-4 h-4" />, label: t.confirmed },
        PENDING: { color: 'text-amber-600 bg-amber-50', icon: <AlertCircle className="w-4 h-4" />, label: t.pending },
        CANCELLED: { color: 'text-red-600 bg-red-50', icon: <XCircle className="w-4 h-4" />, label: t.cancelled },
        COMPLETED: { color: 'text-indigo-600 bg-indigo-50', icon: <CheckCircle className="w-4 h-4" />, label: t.completed },
    };

    if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <SectionHeader
                    icon={CalendarCheck}
                    title={t.title}
                    subtitle={t.subtitle}
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-500"
                    shadowColor="shadow-emerald-200"
                />

                {/* Tabs + Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-200 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('future')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'future' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            <Calendar className="w-4 h-4" />
                            {t.future}
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'past' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            <Clock className="w-4 h-4" />
                            {t.past}
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t.search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="CONFIRMED">{t.confirmed}</option>
                            <option value="PENDING">{t.pending}</option>
                            <option value="CANCELLED">{t.cancelled}</option>
                            <option value="COMPLETED">{t.completed}</option>
                        </select>
                    </div>
                </div>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                        <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">{t.noBookings}</h3>
                        <p className="text-slate-500 mt-1">{t.noBookingsDesc}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t.patient}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t.service}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t.dateTime}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t.status}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBookings.map((booking) => {
                                    const startDate = new Date(booking.start_time);
                                    const endDate = new Date(booking.end_time);
                                    const config = statusConfig[booking.status] || statusConfig.PENDING;

                                    return (
                                        <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                                        {booking.patient_name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/patients/${booking.patient_id}`}
                                                            className="font-medium text-slate-800 hover:text-indigo-600 hover:underline transition-colors"
                                                        >
                                                            {booking.patient_name}
                                                        </Link>
                                                        {booking.patient_email && <p className="text-xs text-slate-500">{booking.patient_email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{booking.service_title}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-800 font-medium">
                                                    {startDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                                    {config.icon}
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={() => setOpenMenu(openMenu === booking.id ? null : booking.id)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                    {openMenu === booking.id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-xl shadow-lg z-10 overflow-hidden">
                                                            {booking.status === 'PENDING' && (
                                                                <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                                                                    <Check className="w-4 h-4" /> {t.confirm}
                                                                </button>
                                                            )}
                                                            {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                                                <button onClick={() => updateBookingStatus(booking.id, 'COMPLETED')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
                                                                    <CheckCircle className="w-4 h-4" /> {t.complete}
                                                                </button>
                                                            )}
                                                            {booking.status !== 'CANCELLED' && (
                                                                <button onClick={() => cancelBookingWithReason(booking.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50">
                                                                    <X className="w-4 h-4" /> {t.cancel}
                                                                </button>
                                                            )}
                                                            <button onClick={() => deleteBooking(booking.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t">
                                                                <Trash2 className="w-4 h-4" /> {t.delete}
                                                            </button>
                                                        </div>
                                                    )}
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
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.calendarView}</h2>
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
            </div>
        </div>
    );
}

