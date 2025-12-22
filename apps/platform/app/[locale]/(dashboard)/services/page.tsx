'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Edit, Trash2, Clock, Users, Euro, FileText, CalendarPlus, List, X, Package } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import SectionHeader from '@/components/SectionHeader';

import { API_URL } from '@/lib/api';

interface ServiceType {
    id: string;
    title: string;
    description: string | null;
    kind: 'ONE_ON_ONE' | 'GROUP';
    duration_minutes: number;
    price: number;
    currency: string;
    capacity: number;
    intake_form_id: string | null;
    intake_form_title: string | null;
    schedule_id: string | null;
    requires_approval: boolean;
    is_active: boolean;
}

interface FormTemplate {
    id: string;
    title: string;
}

interface Schedule {
    id: string;
    name: string;
    is_default: boolean;
}

export default function ServicesPage() {
    const params = useParams();
    const locale = params.locale as string || 'en';
    const { user: currentUser } = useAuth();

    const [services, setServices] = useState<ServiceType[]>([]);
    const [forms, setForms] = useState<FormTemplate[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleCalendars, setGoogleCalendars] = useState<{ id: string; name: string; primary: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<ServiceType | null>(null);
    const [saving, setSaving] = useState(false);

    // Bookings modal state
    const [showBookingsModal, setShowBookingsModal] = useState(false);
    const [selectedServiceForBookings, setSelectedServiceForBookings] = useState<ServiceType | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        kind: 'ONE_ON_ONE' as 'ONE_ON_ONE' | 'GROUP',
        duration_minutes: 60,
        price: 0,
        currency: 'EUR',
        capacity: 1,
        intake_form_id: '',
        schedule_id: '',
        booking_calendar_id: '',
        requires_approval: false,
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [servicesRes, formsRes, schedulesRes] = await Promise.all([
                fetch(`${API_URL}/services/?active_only=false`, { credentials: 'include' }),
                fetch(`${API_URL}/forms/templates`, { credentials: 'include' }),
                fetch(`${API_URL}/schedules/`, { credentials: 'include' }),
            ]);

            if (servicesRes.ok) {
                const data = await servicesRes.json();
                setServices(data.services || []);
            }
            if (formsRes.ok) {
                const data = await formsRes.json();
                setForms(data.templates || []);
            }
            if (schedulesRes.ok) {
                const data = await schedulesRes.json();
                setSchedules(data);
            }

            // Load Google Calendar data
            try {
                const statusRes = await fetch(`${API_URL}/integrations/google/status`, { credentials: 'include' });
                if (statusRes.ok) {
                    const status = await statusRes.json();
                    setGoogleConnected(status.connected);

                    if (status.connected) {
                        const calRes = await fetch(`${API_URL}/integrations/google/calendars`, { credentials: 'include' });
                        if (calRes.ok) {
                            const calData = await calRes.json();
                            setGoogleCalendars(calData.calendars || []);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading Google calendars', err);
            }
        } catch (err) {
            console.error('Error loading data', err);
        } finally {
            setLoading(false);
        }
    }


    function openCreateModal() {
        setEditingService(null);
        const defaultSchedule = schedules.find(s => s.is_default);
        setFormData({
            title: '',
            description: '',
            kind: 'ONE_ON_ONE',
            duration_minutes: 60,
            price: 0,
            currency: 'EUR',
            capacity: 1,
            intake_form_id: '',
            schedule_id: defaultSchedule?.id || '',
            booking_calendar_id: '',
            requires_approval: false,
            is_active: true,
        });
        setShowModal(true);
    }

    function openEditModal(service: ServiceType) {
        setEditingService(service);
        setFormData({
            title: service.title,
            description: service.description || '',
            kind: service.kind,
            duration_minutes: service.duration_minutes,
            price: service.price,
            currency: service.currency,
            capacity: service.capacity,
            intake_form_id: service.intake_form_id || '',
            schedule_id: service.schedule_id || '',
            booking_calendar_id: '',
            requires_approval: service.requires_approval,
            is_active: service.is_active,
        });
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                intake_form_id: formData.intake_form_id || null,
                schedule_id: formData.schedule_id || null,
            };

            const url = editingService
                ? `${API_URL}/services/${editingService.id}`
                : `${API_URL}/services/`;

            const response = await fetch(url, {
                method: editingService ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await loadData();
                setShowModal(false);
            } else {
                const error = await response.json();
                const message = typeof error.detail === 'string'
                    ? error.detail
                    : JSON.stringify(error.detail) || 'Error saving service';
                alert(message);
            }
        } catch (err) {
            console.error('Error saving', err);
            alert('Network error saving service');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(serviceId: string) {
        if (!confirm('¿Eliminar este servicio?')) return;

        try {
            const response = await fetch(`${API_URL}/services/${serviceId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setServices(services.filter(s => s.id !== serviceId));
            }
        } catch (err) {
            console.error('Error deleting', err);
        }
    }

    async function openBookingsModal(service: ServiceType) {
        setSelectedServiceForBookings(service);
        setShowBookingsModal(true);
        setLoadingBookings(true);
        try {
            const res = await fetch(`${API_URL}/booking/?service_id=${service.id}`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setLoadingBookings(false);
        }
    }

    const translations = {
        en: {
            title: 'Services',
            subtitle: 'Create and manage your service catalog. Set prices, durations, capacities, and booking pages.',
            addService: 'Add Service',
            noServices: 'No services yet',
            noServicesDesc: 'Create your first service to start accepting bookings',
            duration: 'Duration',
            price: 'Price',
            capacity: 'Capacity',
            intakeForm: 'Intake Form',
            none: 'None',
            create: 'Create Service',
            edit: 'Edit Service',
            save: 'Save',
            cancel: 'Cancel',
            oneOnOne: 'Individual',
            group: 'Group',
            minutes: 'min',
        },
        es: {
            title: 'Servicios',
            subtitle: 'Crea y gestiona tu catálogo de servicios. Define precios, duraciones, capacidades y páginas de reserva.',
            addService: 'Añadir Servicio',
            noServices: 'Sin servicios todavía',
            noServicesDesc: 'Crea tu primer servicio para empezar a aceptar reservas',
            duration: 'Duración',
            price: 'Precio',
            capacity: 'Capacidad',
            intakeForm: 'Formulario Intake',
            none: 'Ninguno',
            create: 'Crear Servicio',
            edit: 'Editar Servicio',
            save: 'Guardar',
            cancel: 'Cancelar',
            oneOnOne: 'Individual',
            group: 'Grupal',
            minutes: 'min',
        },
        ca: {
            title: 'Serveis',
            subtitle: 'Crea i gestiona el teu catàleg de serveis. Defineix preus, duracions, capacitats i pàgines de reserva.',
            addService: 'Afegir Servei',
            noServices: 'Encara no hi ha serveis',
            noServicesDesc: 'Crea el teu primer servei per començar a acceptar reserves',
            duration: 'Durada',
            price: 'Preu',
            capacity: 'Capacitat',
            intakeForm: 'Formulari Intake',
            none: 'Cap',
            create: 'Crear Servei',
            edit: 'Editar Servei',
            save: 'Desar',
            cancel: 'Cancel·lar',
            oneOnOne: 'Individual',
            group: 'Grupal',
            minutes: 'min',
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <SectionHeader
                        icon={Package}
                        title={t.title}
                        subtitle={t.subtitle}
                        gradientFrom="from-teal-500"
                        gradientTo="to-cyan-500"
                        shadowColor="shadow-teal-200"
                    />
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={20} />
                        {t.addService}
                    </button>
                </div>

                {/* Services Grid */}
                {services.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-slate-700">{t.noServices}</h3>
                        <p className="text-slate-500 mt-1">{t.noServicesDesc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map(service => (
                            <div
                                key={service.id}
                                className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${!service.is_active ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${service.kind === 'ONE_ON_ONE'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {service.kind === 'ONE_ON_ONE' ? t.oneOnOne : t.group}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <a
                                            href={`/${locale}/book/${currentUser?.id}`}
                                            target="_blank"
                                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                                            title="Preview booking"
                                        >
                                            <CalendarPlus size={16} />
                                        </a>
                                        <button
                                            onClick={() => openEditModal(service)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => openBookingsModal(service)}
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                            title="View bookings"
                                        >
                                            <List size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-slate-800 mb-2">{service.title}</h3>
                                {service.description && (
                                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.description}</p>
                                )}

                                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} className="text-slate-400" />
                                        {service.duration_minutes} {t.minutes}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Euro size={14} className="text-slate-400" />
                                        {service.price} {service.currency}
                                    </div>
                                    {service.kind === 'GROUP' && (
                                        <div className="flex items-center gap-1">
                                            <Users size={14} className="text-slate-400" />
                                            {service.capacity}
                                        </div>
                                    )}
                                </div>

                                {service.intake_form_title && (
                                    <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600">
                                        <FileText size={12} />
                                        {service.intake_form_title}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingService ? t.edit : t.create}
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {locale === 'es' ? 'Nombre' : 'Title'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={locale === 'es' ? 'Ej: Sesión de Terapia' : 'E.g., Therapy Session'}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {locale === 'es' ? 'Descripción' : 'Description'}
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Kind */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {locale === 'es' ? 'Tipo' : 'Type'}
                                    </label>
                                    <select
                                        value={formData.kind}
                                        onChange={e => setFormData({ ...formData, kind: e.target.value as 'ONE_ON_ONE' | 'GROUP' })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="ONE_ON_ONE">{t.oneOnOne}</option>
                                        <option value="GROUP">{t.group}</option>
                                    </select>
                                </div>

                                {/* Duration & Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {t.duration} ({t.minutes})
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.duration_minutes}
                                            onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                                            min={15}
                                            max={10080}
                                            step={15}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {t.price} (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            min={0}
                                            step={5}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Capacity (only for group) */}
                                {formData.kind === 'GROUP' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {t.capacity}
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                            min={2}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                )}

                                {/* Intake Form */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t.intakeForm}
                                    </label>
                                    <select
                                        value={formData.intake_form_id}
                                        onChange={e => setFormData({ ...formData, intake_form_id: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">{t.none}</option>
                                        {forms.map(form => (
                                            <option key={form.id} value={form.id}>{form.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Availability Schedule */}
                                {schedules.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            {locale === 'es' ? 'Horario de Disponibilidad' : locale === 'ca' ? 'Horari de Disponibilitat' : 'Availability Schedule'}
                                        </label>
                                        <select
                                            value={formData.schedule_id}
                                            onChange={e => setFormData({ ...formData, schedule_id: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">{locale === 'es' ? 'Por defecto' : locale === 'ca' ? 'Per defecte' : 'Default'}</option>
                                            {schedules.map(schedule => (
                                                <option key={schedule.id} value={schedule.id}>
                                                    {schedule.name} {schedule.is_default ? '★' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {locale === 'es' ? 'Selecciona qué calendario de disponibilidad usar para este servicio' :
                                                locale === 'ca' ? 'Selecciona quin calendari de disponibilitat utilitzar per aquest servei' :
                                                    'Select which availability calendar to use for this service'}
                                        </p>
                                    </div>
                                )}

                                {/* Google Calendar Booking Destination */}
                                {googleConnected && googleCalendars.length > 0 && (
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            📅 Google Calendar
                                        </label>
                                        <select
                                            value={formData.booking_calendar_id}
                                            onChange={e => setFormData({ ...formData, booking_calendar_id: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">
                                                {locale === 'es' ? 'No enviar a Google Calendar' :
                                                    locale === 'ca' ? 'No enviar a Google Calendar' :
                                                        'Don\'t send to Google Calendar'}
                                            </option>
                                            {googleCalendars.map(cal => (
                                                <option key={cal.id} value={cal.id}>
                                                    {cal.name}{cal.primary ? ' (Principal)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {locale === 'es' ? 'Las reservas de este servicio se enviarán a este calendario de Google' :
                                                locale === 'ca' ? 'Les reserves d\'aquest servei s\'enviaran a aquest calendari de Google' :
                                                    'Bookings for this service will be sent to this Google calendar'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.title}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {saving ? '...' : t.save}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Bookings Modal */}
                {showBookingsModal && selectedServiceForBookings && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        Reservas: {selectedServiceForBookings.title}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {bookings.length} reserva(s) encontrada(s)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBookingsModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {loadingBookings ? (
                                    <div className="text-center py-8 text-slate-500">Cargando...</div>
                                ) : bookings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">📅</div>
                                        <p className="text-slate-500">No hay reservas para este servicio</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {bookings.map(booking => (
                                            <div
                                                key={booking.id}
                                                className="p-4 border rounded-lg hover:bg-slate-50"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {booking.patient_name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {new Date(booking.start_time).toLocaleDateString(locale, {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'CONFIRMED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : booking.status === 'PENDING'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-slate-500">
                                                    {booking.amount_paid} {booking.currency}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

