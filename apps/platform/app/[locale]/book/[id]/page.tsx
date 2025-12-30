'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Calendar, Clock, CreditCard, ChevronRight, ChevronLeft, User, Mail, Phone, FileText, Check, Loader2 } from 'lucide-react';

interface Service {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    price: number;
    currency: string;
    kind: 'ONE_ON_ONE' | 'GROUP';
}

interface Slot {
    start: string;
    end: string;
    spots_total: number;
    spots_booked: number;
    spots_left: number;
}

type WizardStep = 'service' | 'date' | 'slot' | 'details' | 'confirm';

export default function BookingPage() {
    const params = useParams();
    const therapistId = params.id as string;
    const locale = params.locale as string;

    // Wizard state
    const [step, setStep] = useState<WizardStep>('service');
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    // Form state
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientNotes, setClientNotes] = useState('');

    // Loading/error states
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Load services on mount
    useEffect(() => {
        if (therapistId) {
            loadServices();
        }
    }, [therapistId]);

    async function loadServices() {
        try {
            const data = await api.publicBooking.listServices(therapistId);
            setServices(data);
        } catch (err: any) {
            setError('Terapeuta no encontrado o sin servicios disponibles.');
        } finally {
            setLoading(false);
        }
    }

    // Load slots when date changes
    async function loadSlots(date: string) {
        if (!selectedService || !date) return;

        setLoadingSlots(true);
        try {
            // Query 1 day range
            const data = await api.publicBooking.listSlots(
                therapistId,
                selectedService.id,
                date,
                date
            );
            setSlots(data.filter((s: Slot) => s.spots_left > 0));
        } catch (err) {
            console.error('Error loading slots:', err);
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }

    // Handle service selection
    function handleSelectService(service: Service) {
        setSelectedService(service);
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
        setStep('date');
    }

    // Handle date selection
    function handleDateChange(date: string) {
        setSelectedDate(date);
        setSelectedSlot(null);
        loadSlots(date);
    }

    // Handle slot selection
    function handleSelectSlot(slot: Slot) {
        setSelectedSlot(slot);
        setStep('details');
    }

    // Submit booking
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedService || !selectedSlot || !clientName || !clientEmail) return;

        setSubmitting(true);
        try {
            const result = await api.publicBooking.createBooking({
                service_id: selectedService.id,
                therapist_id: therapistId,
                slot_start: selectedSlot.start,
                patient_name: clientName,
                patient_email: clientEmail,
                patient_phone: clientPhone || null,
                patient_notes: clientNotes || null,
            });
            setBookingResult(result);
            setStep('confirm');
        } catch (err: any) {
            setError(err.message || 'Error al crear la reserva');
        } finally {
            setSubmitting(false);
        }
    }

    // Format time from ISO string
    function formatTime(isoString: string) {
        const date = new Date(isoString);
        return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Error state
    if (error && step !== 'confirm') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="text-5xl mb-4">😕</div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Oops!</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    // Confirmation step
    if (step === 'confirm' && bookingResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        ¡Reserva Confirmada!
                    </h1>
                    <p className="text-slate-600 mb-6">
                        Hemos enviado los detalles a tu email.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Servicio</span>
                            <span className="font-medium text-slate-900">{bookingResult.service_title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Fecha</span>
                            <span className="font-medium text-slate-900">
                                {new Date(bookingResult.slot_start).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Hora</span>
                            <span className="font-medium text-slate-900">
                                {formatTime(bookingResult.slot_start)}
                            </span>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                            <span className="text-slate-500">Total</span>
                            <span className="font-bold text-emerald-600">
                                {bookingResult.amount} {bookingResult.currency}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">
                        Referencia: {bookingResult.booking_id}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {['service', 'date', 'details'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s || ['service', 'date', 'details'].indexOf(step) > i
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                {i < 2 && (
                                    <div className={`w-20 sm:w-32 h-1 mx-2 rounded ${['service', 'date', 'details'].indexOf(step) > i
                                            ? 'bg-indigo-600'
                                            : 'bg-slate-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Servicio</span>
                        <span>Fecha y hora</span>
                        <span>Tus datos</span>
                    </div>
                </div>

                {/* Step 1: Service Selection */}
                {step === 'service' && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900">Reservar Sesión</h1>
                            <p className="text-slate-600">Selecciona un servicio para continuar</p>
                        </div>

                        {services.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No hay servicios disponibles.
                            </div>
                        ) : (
                            services.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => handleSelectService(service)}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-6 cursor-pointer border-2 border-transparent hover:border-indigo-200 group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {service.title}
                                            </h3>
                                            {service.description && (
                                                <p className="text-slate-500 mt-1 text-sm line-clamp-2">
                                                    {service.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-sm">
                                                    <Clock size={16} className="text-indigo-500" />
                                                    {service.duration_minutes} min
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-700">
                                                    <CreditCard size={16} className="text-emerald-500" />
                                                    {service.price} {service.currency}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="ml-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Step 2: Date & Slot Selection */}
                {step === 'date' && selectedService && (
                    <div className="space-y-6">
                        <button
                            onClick={() => setStep('service')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Volver a servicios
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                                <Calendar className="text-indigo-500" />
                                <div>
                                    <h2 className="font-semibold text-slate-900">{selectedService.title}</h2>
                                    <p className="text-sm text-slate-500">{selectedService.duration_minutes} min • {selectedService.price} {selectedService.currency}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Selecciona una fecha
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {loadingSlots ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                </div>
                            ) : slots.length > 0 ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Horarios disponibles
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectSlot(slot)}
                                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedSlot?.start === slot.start
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                                                    }`}
                                            >
                                                {formatTime(slot.start)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : selectedDate ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    No hay horarios disponibles para esta fecha.
                                    <br />
                                    Prueba con otro día.
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Step 3: Client Details */}
                {step === 'details' && selectedService && selectedSlot && (
                    <div className="space-y-6">
                        <button
                            onClick={() => setStep('date')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Cambiar horario
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            {/* Summary */}
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Calendar className="text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">{selectedService.title}</h2>
                                    <p className="text-sm text-slate-500">
                                        {new Date(selectedSlot.start).toLocaleDateString()} • {formatTime(selectedSlot.start)}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Nombre completo *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="Tu nombre"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            placeholder="tu@email.com"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Teléfono (opcional)
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="tel"
                                            value={clientPhone}
                                            onChange={(e) => setClientPhone(e.target.value)}
                                            placeholder="+34 600 000 000"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Notas (opcional)
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <textarea
                                            value={clientNotes}
                                            onChange={(e) => setClientNotes(e.target.value)}
                                            placeholder="¿Algo que debamos saber?"
                                            rows={3}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Price summary */}
                                <div className="bg-slate-50 rounded-xl p-4 mt-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Total a pagar</span>
                                        <span className="text-2xl font-bold text-slate-900">
                                            {selectedService.price} {selectedService.currency}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !clientName || !clientEmail}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            Confirmar Reserva
                                            <ChevronRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
