'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Clock, ChevronRight, ChevronLeft, Check, CreditCard, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getUserTimezone, toISOWithTimezone } from '@/utils/datetime';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Initialize Stripe
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface Service {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    currency: string;
    kind: string;
}

interface Slot {
    start: string;
    end: string;
    spots_total: number;
    spots_booked: number;
    spots_left: number;
}

interface BookingResponse {
    booking_id: string;
    status: string;
    service_title: string;
    slot_start: string;
    slot_end: string;
    amount: number;
    currency: string;
}

type Step = 1 | 2 | 3 | 4;

// Payment Form Component
function PaymentForm({
    onSuccess,
    onError
}: {
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href + '?success=true',
            },
            redirect: 'if_required',
        });

        if (error) {
            onError(error.message || 'Payment failed');
            setProcessing(false);
        } else {
            onSuccess();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {processing ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        Pay Now
                    </>
                )}
            </button>
        </form>
    );
}

export default function BookingWizardPage() {
    const params = useParams();
    const therapistId = params.therapist_id as string;
    const locale = (params.locale as string) || 'en';

    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Form data
    const [patientName, setPatientName] = useState('');
    const [patientEmail, setPatientEmail] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [patientNotes, setPatientNotes] = useState('');

    // Date range for slots
    const today = new Date();
    const [selectedDate] = useState<Date>(today);

    useEffect(() => {
        loadServices();
    }, [therapistId]);

    async function loadServices() {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/public/booking/services?therapist_id=${therapistId}`
            );
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (err) {
            console.error('Error loading services', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadSlots(serviceId: string, date: Date) {
        setLoadingSlots(true);
        try {
            const startDate = date.toISOString().split('T')[0];
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 30);
            const endDateStr = endDate.toISOString().split('T')[0];

            const res = await fetch(
                `${API_URL}/public/booking/slots?therapist_id=${therapistId}&service_id=${serviceId}&start_date=${startDate}&end_date=${endDateStr}`
            );
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (err) {
            console.error('Error loading slots', err);
        } finally {
            setLoadingSlots(false);
        }
    }

    function selectService(service: Service) {
        setSelectedService(service);
        setStep(2);
        loadSlots(service.id, selectedDate);
    }

    function selectSlot(slot: Slot) {
        setSelectedSlot(slot);
        setStep(3);
    }

    async function handleSubmitDetails() {
        if (!selectedService || !selectedSlot) return;

        setSubmitting(true);
        try {
            // Ensure slot_start has timezone (backend requires Z or +offset)
            // Just append Z - slots are returned from backend as-is and should be sent back unchanged
            let slotStart = selectedSlot.start;
            if (!slotStart.endsWith('Z') && !slotStart.match(/[+-]\d{2}:\d{2}$/)) {
                slotStart = slotStart + 'Z';
            }

            // Step 1: Create booking
            const bookingRes = await fetch(`${API_URL}/public/booking/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: selectedService.id,
                    therapist_id: therapistId,
                    slot_start: slotStart,
                    target_timezone: getUserTimezone(), // IANA timezone for DST protection
                    patient_name: patientName,
                    patient_email: patientEmail,
                    patient_phone: patientPhone || null,
                    patient_notes: patientNotes || null,
                }),
            });

            if (!bookingRes.ok) {
                const error = await bookingRes.json();
                // Handle detail as object or string
                const errorMsg = typeof error.detail === 'string'
                    ? error.detail
                    : (error.detail?.msg || error.message || JSON.stringify(error.detail) || 'Error creating booking');
                alert(errorMsg);
                setSubmitting(false);
                return;
            }

            const bookingData = await bookingRes.json();
            setBooking(bookingData);

            // Step 2: Create Payment Intent (if price > 0)
            if (selectedService.price > 0 && stripePromise) {
                const paymentRes = await fetch(`${API_URL}/payments/create-payment-intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking_id: bookingData.booking_id }),
                });

                if (paymentRes.ok) {
                    const paymentData = await paymentRes.json();
                    setClientSecret(paymentData.client_secret);
                    setStep(4);
                } else {
                    // Payment setup failed - show error instead of silently completing
                    const errorData = await paymentRes.json().catch(() => ({}));
                    console.error('Payment intent failed:', paymentRes.status, errorData);
                    alert(`Error creating payment: ${errorData.detail || 'Payment service unavailable'}`);
                    // Booking was created but payment failed - still mark as complete but in PENDING state
                    setBookingComplete(true);
                }
            } else {
                // Free service, mark as complete
                setBookingComplete(true);
            }
        } catch (err) {
            console.error('Error submitting', err);
            alert('Network error');
        } finally {
            setSubmitting(false);
        }
    }

    function handlePaymentSuccess() {
        setBookingComplete(true);
    }

    function handlePaymentError(msg: string) {
        setPaymentError(msg);
    }

    async function handleGoBackFromPayment() {
        // Cancel the pending booking to release the slot
        if (booking) {
            try {
                await fetch(`${API_URL}/public/booking/bookings/${booking.booking_id}`, {
                    method: 'DELETE',
                });
            } catch (err) {
                console.error('Error cancelling booking', err);
            }
        }
        setBooking(null);
        setClientSecret(null);
        setStep(3);
    }

    const t = {
        en: {
            title: 'Book an Appointment',
            step1: 'Select Service',
            step2: 'Choose Date & Time',
            step3: 'Your Details',
            step4: 'Payment',
            back: 'Back',
            continue: 'Continue to Payment',
            confirmFree: 'Confirm Booking',
            name: 'Full Name',
            email: 'Email',
            phone: 'Phone (optional)',
            notes: 'Notes for therapist',
            noSlots: 'No available slots for this week',
            success: 'Booking Confirmed!',
            successMsg: 'You will receive an email confirmation shortly.',
            min: 'min',
            payNow: 'Pay Now',
        },
        es: {
            title: 'Reservar Cita',
            step1: 'Seleccionar Servicio',
            step2: 'Elegir Fecha y Hora',
            step3: 'Tus Datos',
            step4: 'Pago',
            back: 'Atrás',
            continue: 'Continuar al Pago',
            confirmFree: 'Confirmar Reserva',
            name: 'Nombre Completo',
            email: 'Email',
            phone: 'Teléfono (opcional)',
            notes: 'Notas para el terapeuta',
            noSlots: 'No hay horarios disponibles esta semana',
            success: '¡Reserva Confirmada!',
            successMsg: 'Recibirás un email de confirmación en breve.',
            min: 'min',
            payNow: 'Pagar Ahora',
        }
    }[locale] || {
        title: 'Book an Appointment',
        step1: 'Select Service',
        step2: 'Choose Date & Time',
        step3: 'Your Details',
        step4: 'Payment',
        back: 'Back',
        continue: 'Continue to Payment',
        confirmFree: 'Confirm Booking',
        name: 'Full Name',
        email: 'Email',
        phone: 'Phone (optional)',
        notes: 'Notes for therapist',
        noSlots: 'No available slots',
        success: 'Booking Confirmed!',
        successMsg: 'You will receive an email confirmation shortly.',
        min: 'min',
        payNow: 'Pay Now',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="animate-pulse text-indigo-600">Loading...</div>
            </div>
        );
    }

    if (bookingComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.success}</h2>
                        <p className="text-slate-600">{t.successMsg}</p>
                    </div>

                    {/* Booking Details */}
                    {booking && selectedSlot && (
                        <div className="bg-slate-50 rounded-xl p-5 space-y-3">
                            <div>
                                <div className="text-sm text-slate-500">Service</div>
                                <div className="font-semibold text-slate-800">{booking.service_title}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Date & Time</div>
                                <div className="font-semibold text-slate-800">
                                    {new Date(booking.slot_start).toLocaleDateString(locale, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </div>
                                <div className="text-indigo-600 font-medium">
                                    {new Date(booking.slot_start).toLocaleTimeString(locale, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <div className="text-sm text-slate-500">Amount Paid</div>
                                <div className="text-lg font-bold text-green-600">
                                    {booking.amount.toFixed(2)} {booking.currency.toUpperCase()}
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 text-center pt-2">
                                Booking ID: {booking.booking_id.slice(0, 8)}...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const totalSteps = selectedService && selectedService.price > 0 && stripePromise ? 4 : 3;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <h1 className="text-3xl font-bold text-slate-800 text-center mb-8">{t.title}</h1>

                {/* Progress */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, ...(totalSteps === 4 ? [4] : [])].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {s}
                            </div>
                            {s < totalSteps && (
                                <div className={`w-12 h-1 mx-1 rounded ${step > s ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Services */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t.step1}</h2>
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => selectService(service)}
                                data-testid="service-card"
                                className="w-full bg-white rounded-xl p-5 text-left border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600">
                                            {service.title}
                                        </h3>
                                        {service.description && (
                                            <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                                        )}
                                        <div className="flex gap-4 mt-3 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {service.duration_minutes} {t.min}
                                            </span>
                                            <span className="font-medium text-indigo-600">
                                                {service.price > 0 ? `${service.price} ${service.currency}` : 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-400 group-hover:text-indigo-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Slots */}
                {step === 2 && (
                    <div>
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 mb-4"
                        >
                            <ChevronLeft size={20} />
                            {t.back}
                        </button>

                        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t.step2}</h2>

                        {loadingSlots ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">{t.noSlots}</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {slots.map((slot, idx) => {
                                    const date = new Date(slot.start);
                                    const dateStr = date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
                                    const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => selectSlot(slot)}
                                            className="bg-white rounded-lg p-3 text-center border-2 border-transparent hover:border-indigo-500 hover:shadow transition-all"
                                        >
                                            <div className="text-sm font-medium text-slate-800">{dateStr}</div>
                                            <div className="text-lg font-semibold text-indigo-600">{timeStr}</div>
                                            {slot.spots_left < slot.spots_total && slot.spots_left > 0 && (
                                                <div className="text-xs font-medium text-amber-600 mt-1">
                                                    {slot.spots_left} spots left
                                                </div>
                                            )}
                                            {slot.spots_total > 1 && slot.spots_left === slot.spots_total && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {slot.spots_left} spots available
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <div>
                        <button
                            onClick={() => setStep(2)}
                            className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 mb-4"
                        >
                            <ChevronLeft size={20} />
                            {t.back}
                        </button>

                        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t.step3}</h2>

                        <div className="bg-white rounded-xl p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.name} *</label>
                                <input
                                    type="text"
                                    name="patient_name"
                                    data-testid="patient-name-input"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.email} *</label>
                                <input
                                    type="email"
                                    name="patient_email"
                                    data-testid="patient-email-input"
                                    value={patientEmail}
                                    onChange={(e) => setPatientEmail(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.phone}</label>
                                <input
                                    type="tel"
                                    name="patient_phone"
                                    data-testid="patient-phone-input"
                                    value={patientPhone}
                                    onChange={(e) => setPatientPhone(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t.notes}</label>
                                <textarea
                                    value={patientNotes}
                                    onChange={(e) => setPatientNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Summary */}
                            {selectedService && selectedSlot && (
                                <div className="bg-indigo-50 rounded-lg p-4 mt-4">
                                    <div className="text-sm text-slate-600 mb-1">{selectedService.title}</div>
                                    <div className="font-semibold text-slate-800">
                                        {new Date(selectedSlot.start).toLocaleDateString(locale, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="text-indigo-600 font-medium">
                                        {new Date(selectedSlot.start).toLocaleTimeString(locale, {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className="text-lg font-bold text-slate-800 mt-2">
                                        {selectedService.price > 0 ? `${selectedService.price} ${selectedService.currency}` : 'Free'}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmitDetails}
                                disabled={submitting || !patientName || !patientEmail}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : selectedService && selectedService.price > 0 ? (
                                    <>
                                        <CreditCard size={20} />
                                        {t.continue}
                                    </>
                                ) : (
                                    t.confirmFree
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Payment */}
                {step === 4 && clientSecret && stripePromise && (
                    <div>
                        <button
                            onClick={handleGoBackFromPayment}
                            className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 mb-4"
                        >
                            <ChevronLeft size={20} />
                            {t.back}
                        </button>

                        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t.step4}</h2>

                        <div className="bg-white rounded-xl p-6">
                            {paymentError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
                                    {paymentError}
                                </div>
                            )}

                            {/* Summary */}
                            {selectedService && booking && (
                                <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                                    <div className="text-sm text-slate-600 mb-1">{booking.service_title}</div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {selectedService.price.toFixed(2)} {selectedService.currency}
                                    </div>
                                </div>
                            )}

                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                />
                            </Elements>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
