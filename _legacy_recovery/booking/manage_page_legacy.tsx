'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, CalendarClock, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

interface BookingDetails {
    booking_id: string;
    service_title: string;
    start_time: string;
    end_time: string;
    status: string;
    patient_name: string;
    patient_email: string;
    amount_paid: number;
    currency: string;
    can_cancel: boolean;
    can_reschedule: boolean;
    cancel_reason?: string;
    reschedule_reason?: string;
}

export default function ManageBookingPage() {
    const params = useParams();
    const token = params.token as string;
    const locale = (params.locale as string) || 'es';

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const t = {
        es: {
            title: 'Gestionar Reserva',
            loading: 'Cargando...',
            notFound: 'Reserva no encontrada',
            notFoundDesc: 'El enlace puede haber expirado o ser inválido.',
            service: 'Servicio',
            dateTime: 'Fecha y hora',
            status: 'Estado',
            patient: 'Paciente',
            amountPaid: 'Importe pagado',
            reschedule: 'Reprogramar',
            cancel: 'Cancelar Reserva',
            cancelConfirm: '¿Seguro que quieres cancelar esta reserva?',
            cancelReason: 'Motivo de cancelación (opcional)',
            cancelButton: 'Sí, cancelar',
            back: 'Volver',
            cancelled: 'Cancelada',
            confirmed: 'Confirmada',
            pending: 'Pendiente',
            completed: 'Completada',
            cannotCancel: 'Esta reserva no puede ser cancelada',
            cannotReschedule: 'Esta reserva no puede ser reprogramada',
        },
        en: {
            title: 'Manage Booking',
            loading: 'Loading...',
            notFound: 'Booking not found',
            notFoundDesc: 'The link may have expired or is invalid.',
            service: 'Service',
            dateTime: 'Date & Time',
            status: 'Status',
            patient: 'Patient',
            amountPaid: 'Amount paid',
            reschedule: 'Reschedule',
            cancel: 'Cancel Booking',
            cancelConfirm: 'Are you sure you want to cancel this booking?',
            cancelReason: 'Reason for cancellation (optional)',
            cancelButton: 'Yes, cancel',
            back: 'Back',
            cancelled: 'Cancelled',
            confirmed: 'Confirmed',
            pending: 'Pending',
            completed: 'Completed',
            cannotCancel: 'This booking cannot be cancelled',
            cannotReschedule: 'This booking cannot be rescheduled',
        },
    }[locale] || {
        title: 'Manage Booking', loading: 'Loading...', notFound: 'Not found', notFoundDesc: '',
        service: 'Service', dateTime: 'Date', status: 'Status', patient: 'Patient', amountPaid: 'Paid',
        reschedule: 'Reschedule', cancel: 'Cancel', cancelConfirm: 'Cancel?', cancelReason: 'Reason',
        cancelButton: 'Cancel', back: 'Back', cancelled: 'Cancelled', confirmed: 'Confirmed',
        pending: 'Pending', completed: 'Completed', cannotCancel: '', cannotReschedule: '',
    };

    useEffect(() => {
        loadBooking();
    }, [token]);

    async function loadBooking() {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/public/booking/manage/${token}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
            } else {
                setError(t.notFound);
            }
        } catch (err) {
            setError(t.notFound);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        setCancelling(true);
        try {
            const res = await fetch(`${API_URL}/public/booking/manage/${token}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: cancelReason || null }),
            });
            if (res.ok) {
                setBooking(prev => prev ? { ...prev, status: 'CANCELLED', can_cancel: false, can_reschedule: false } : null);
                setShowCancelModal(false);
            } else {
                const err = await res.json();
                alert(err.detail || 'Error');
            }
        } catch (err) {
            alert('Error al cancelar');
        } finally {
            setCancelling(false);
        }
    }

    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        CONFIRMED: { color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle className="w-5 h-5" />, label: t.confirmed },
        PENDING: { color: 'text-amber-600 bg-amber-50', icon: <AlertCircle className="w-5 h-5" />, label: t.pending },
        CANCELLED: { color: 'text-red-600 bg-red-50', icon: <XCircle className="w-5 h-5" />, label: t.cancelled },
        COMPLETED: { color: 'text-indigo-600 bg-indigo-50', icon: <CheckCircle className="w-5 h-5" />, label: t.completed },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">{t.loading}</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">{t.notFound}</h1>
                    <p className="text-slate-500">{t.notFoundDesc}</p>
                </div>
            </div>
        );
    }

    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    const config = statusConfig[booking.status] || statusConfig.PENDING;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-8">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
                </div>

                {/* Booking Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Status Banner */}
                    <div className={`px-6 py-4 ${config.color.split(' ')[1]} border-b`}>
                        <div className="flex items-center justify-center gap-2">
                            {config.icon}
                            <span className={`font-semibold ${config.color.split(' ')[0]}`}>{config.label}</span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">{t.service}</p>
                                <p className="text-lg font-semibold text-slate-800">{booking.service_title}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">{t.dateTime}</p>
                                <p className="text-lg font-semibold text-slate-800">
                                    {startDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-indigo-600 font-medium">
                                    {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {booking.amount_paid > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 font-bold text-sm">€</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">{t.amountPaid}</p>
                                    <p className="text-lg font-semibold text-emerald-600">
                                        {booking.amount_paid.toFixed(2)} {booking.currency}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <div className="border-t bg-slate-50 p-6 space-y-3">
                            {booking.can_reschedule ? (
                                <Link
                                    href={`/book/manage/${token}/reschedule`}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    <CalendarClock className="w-5 h-5" />
                                    {t.reschedule}
                                </Link>
                            ) : (
                                <p className="text-center text-sm text-slate-500">{booking.reschedule_reason || t.cannotReschedule}</p>
                            )}

                            {booking.can_cancel ? (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    {t.cancel}
                                </button>
                            ) : (
                                <p className="text-center text-sm text-slate-500">{booking.cancel_reason || t.cannotCancel}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{t.cancelConfirm}</h3>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder={t.cancelReason}
                            className="w-full p-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                            >
                                {t.back}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {cancelling ? '...' : t.cancelButton}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
