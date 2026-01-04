'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Plus, Edit, Trash2, Clock, Users, Euro, FileText, CalendarPlus, List, X, Package } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import PageHeader from '@/components/PageHeader';
import { api, API_URL, ListMetadata } from '@/lib/api';
import { CyberButton } from '@/components/ui/CyberButton';
import PaginationToolbar from '@/components/ui/pagination-toolbar';
import { Tooltip } from '@/components/ui/tooltip';

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
    const tt = useTranslations('Tooltips');

    const [services, setServices] = useState<ServiceType[]>([]);
    const [meta, setMeta] = useState<ListMetadata | null>(null);
    const [forms, setForms] = useState<FormTemplate[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleCalendars, setGoogleCalendars] = useState<{ id: string; name: string; primary: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
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
            const [resp, formsResp, schedulesRes] = await Promise.all([
                api.services.list(page, 100, false),
                api.forms.listTemplates(1, 100),
                fetch(`${API_URL}/schedules/`, { credentials: 'include' }),
            ]);

            setServices(resp.data);
            setMeta(resp.meta);
            setForms(formsResp.data || []);
            if (schedulesRes.ok) {
                const schedulesData = await schedulesRes.json();
                setSchedules(schedulesData);
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

    useEffect(() => {
        loadData();
    }, [page]);


    const metrics = {
        total: services.length,
        active: services.filter(s => s.is_active).length,
        oneOnOne: services.filter(s => s.kind === 'ONE_ON_ONE').length,
    };

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
            } else if (response.status === 400) {
                const error = await response.json();
                alert(error.detail || 'No se puede eliminar un servicio con reservas activas. Considera pausarlo en su lugar.');
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
                setBookings(data.data || data); // Handle both wrapped and unwrapped for safety
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
            status: 'Status',
            active: 'Active',
            paused: 'Paused',
            searchPlaceholder: 'Search services...',
            actions: 'Actions',
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
            status: 'Estado',
            active: 'Activo',
            paused: 'Pausado',
            searchPlaceholder: 'Buscar servicios...',
            actions: 'Acciones',
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
            status: 'Estat',
            active: 'Actiu',
            paused: 'Pausat',
            searchPlaceholder: 'Cercar serveis...',
            actions: 'Accions',
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-muted rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-6xl mx-auto">
                <PageHeader
                    icon={Package}
                    kicker="PRACTICE"
                    title={t.title}
                    subtitle={
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-muted-foreground">Define tus sesiones y programas. Sincroniza con tu calendario y habilita reservas automáticas.</span>
                            <div className="flex items-center gap-1.5 ml-1">
                                <span className="badge badge-muted py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider">
                                    Total: {meta?.total || 0}
                                </span>
                                <span className="badge badge-success py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider">
                                    Activos: {services.filter(s => s.is_active).length}
                                </span>
                                <span className="badge badge-brand py-0.5 h-auto text-[10px] font-bold uppercase tracking-wider">
                                    Ticket Medio: {Math.round(meta?.extra?.avg_ticket || 0)}€
                                </span>
                            </div>
                        </div>
                    }
                    action={{
                        label: t.addService,
                        onClick: openCreateModal,
                        icon: Plus
                    }}
                />

                {/* Services Table */}
                {services.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-foreground">{t.noServices}</h3>
                        <p className="text-foreground/60 mt-1">{t.noServicesDesc}</p>
                    </div>
                ) : (
                    <div className="card overflow-hidden mt-6 shadow-sm">
                        {/* Control Deck Toolbar */}
                        <div className="border-b border-border bg-muted/20 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:w-64">
                                <List className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={t.searchPlaceholder}
                                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-brand/50 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                                    Catálogo de {services.length} servicios
                                </p>
                            </div>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-brand/15 to-transparent text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider">{t.title.toUpperCase()}</th>
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider">{t.duration.toUpperCase()}</th>
                                    <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider">{t.price.toUpperCase()}</th>
                                    <th className="px-4 py-3 text-center type-ui text-muted-foreground tracking-wider">{t.status.toUpperCase()}</th>
                                    <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider">{t.actions.toUpperCase()}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr
                                        key={service.id}
                                        onClick={() => openEditModal(service)}
                                        className={`border-b border-border hover:bg-muted/40 cursor-pointer transition-colors group ${!service.is_active ? 'opacity-70 bg-muted/5' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 ${service.kind === 'ONE_ON_ONE' ? 'bg-blue-500/10 text-blue-500' : 'bg-ai/10 text-ai'}`}>
                                                    <Package size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="type-ui font-medium text-foreground truncate">{service.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {service.kind === 'ONE_ON_ONE' ? t.oneOnOne : t.group}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-foreground/70">
                                                <Clock size={14} className="text-muted-foreground" />
                                                <span className="type-ui font-mono text-xs text-foreground/80">{service.duration_minutes} {t.minutes}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-foreground/70">
                                                <Euro size={14} className="text-muted-foreground" />
                                                <span className="type-ui font-mono text-xs font-medium text-foreground/80">{service.price} {service.currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge ${service.is_active ? 'badge-success' : 'badge-muted'}`}>
                                                {service.is_active ? t.active : t.paused}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip content={tt('previewBooking')}>
                                                    <a
                                                        href={`/${locale}/book/${currentUser?.id}`}
                                                        target="_blank"
                                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                                    >
                                                        <CalendarPlus size={16} />
                                                    </a>
                                                </Tooltip>
                                                <Tooltip content={tt('viewServiceBookings')}>
                                                    <button
                                                        onClick={() => openBookingsModal(service)}
                                                        className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
                                                    >
                                                        <List size={16} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip content={tt('editService')}>
                                                    <button
                                                        onClick={() => openEditModal(service)}
                                                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip content={tt('deleteService')}>
                                                    <button
                                                        onClick={() => handleDelete(service.id)}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold text-foreground">
                                    {editingService ? t.edit : t.create}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Status Toggle (Top of form) */}
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${formData.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                                        <span className="font-medium text-foreground">
                                            {formData.is_active ? t.active : t.paused}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-brand' : 'bg-muted-foreground/30'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
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
                                    <label className="block text-sm font-medium text-foreground mb-1">
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
                                    <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <label className="block text-sm font-medium text-foreground mb-1">
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
                                    <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <p className="text-xs text-foreground/60 mt-1">
                                            {locale === 'es' ? 'Selecciona qué calendario de disponibilidad usar para este servicio' :
                                                locale === 'ca' ? 'Selecciona quin calendari de disponibilitat utilitzar per aquest servei' :
                                                    'Select which availability calendar to use for this service'}
                                        </p>
                                    </div>
                                )}

                                {/* Google Calendar Booking Destination */}
                                {googleConnected && googleCalendars.length > 0 && (
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-foreground mb-1">
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
                                        <p className="text-xs text-foreground/60 mt-1">
                                            {locale === 'es' ? 'Las reservas de este servicio se enviarán a este calendario de Google' :
                                                locale === 'ca' ? 'Les reserves d\'aquest servei s\'enviaran a aquest calendari de Google' :
                                                    'Bookings for this service will be sent to this Google calendar'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t flex justify-end gap-3">
                                <CyberButton
                                    variant="ghost"
                                    onClick={() => setShowModal(false)}
                                >
                                    {t.cancel}
                                </CyberButton>
                                <CyberButton
                                    variant="default"
                                    onClick={handleSave}
                                    disabled={saving || !formData.title}
                                >
                                    {saving ? '...' : t.save}
                                </CyberButton>
                            </div>
                        </div>
                    </div>
                )
                }
                {/* Bookings Modal */}
                {
                    showBookingsModal && selectedServiceForBookings && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground">
                                            Reservas: {selectedServiceForBookings.title}
                                        </h2>
                                        <p className="text-sm text-foreground/60">
                                            {bookings.length} reserva(s) encontrada(s)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowBookingsModal(false)}
                                        className="p-2 hover:bg-accent rounded-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto max-h-[60vh]">
                                    {loadingBookings ? (
                                        <div className="text-center py-8 text-foreground/60">Cargando...</div>
                                    ) : bookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">📅</div>
                                            <p className="text-foreground/60">No hay reservas para este servicio</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {bookings.map(booking => (
                                                <div
                                                    key={booking.id}
                                                    className="p-4 border rounded-lg hover:bg-card"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {booking.patient_name}
                                                            </p>
                                                            <p className="text-sm text-foreground/60">
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
                                                                : 'bg-muted text-foreground/70'
                                                            }`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 text-sm text-foreground/60">
                                                        {booking.amount_paid} {booking.currency}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
            {/* Pagination */}
            {meta && meta.filtered > 0 && (
                <div className="mt-4 border-t bg-card rounded-b-xl overflow-hidden">
                    <PaginationToolbar
                        meta={meta}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </div >
    );
}

