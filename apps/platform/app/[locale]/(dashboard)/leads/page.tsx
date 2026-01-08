'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { useTerminology } from '@/hooks/use-terminology';
import { api } from '@/lib/api';
import {
    UserPlus, Phone, MessageCircle, FileText, Users,
    ArrowRightCircle, XCircle, Clock, Plus, Search,
    Filter, ChevronDown, Ghost, Link as LinkIcon, Copy, Sparkles,
    User, X, Edit
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Tooltip } from '@/components/ui/tooltip';

// Types
interface Lead {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    status: LeadStatus;
    source: string;
    source_details: Record<string, any> | null;
    notes: string | null;
    shadow_profile: {
        intent?: string;
        communication_style?: string;
        contact_suggestion?: string;
    } | null;
    sherlock_metrics: {
        r?: number;
        n?: number;
        a?: number;
        v?: number;
        total_score?: number;
    } | null;
    converted_patient_id: string | null;
    created_at: string;
    updated_at: string;
}

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'APPOINTMENT_SCHEDULED' | 'CONVERTED' | 'LOST' | 'ARCHIVED';

interface Column {
    id: LeadStatus;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

const COLUMNS: Column[] = [
    {
        id: 'NEW',
        title: 'Nuevos',
        color: 'text-brand',
        bgColor: 'bg-brand/5 dark:bg-muted/30',
        borderColor: 'border-brand/20 dark:border-brand/10',
    },
    {
        id: 'CONTACTED',
        title: 'Contactados',
        color: 'text-warning',
        bgColor: 'bg-warning/5 dark:bg-muted/30',
        borderColor: 'border-warning/20 dark:border-warning/10',
    },
    {
        id: 'QUALIFIED',
        title: 'Cualificados',
        color: 'text-success',
        bgColor: 'bg-success/5 dark:bg-muted/30',
        borderColor: 'border-success/20 dark:border-success/10',
    },
    {
        id: 'APPOINTMENT_SCHEDULED',
        title: 'Cita Agendada',
        color: 'text-ai',
        bgColor: 'bg-ai/5 dark:bg-muted/30',
        borderColor: 'border-ai/20 dark:border-ai/10',
    },
];

const SOURCE_ICONS: Record<string, React.ReactNode> = {
    'Manual': <UserPlus className="w-3.5 h-3.5" />,
    'Public Form': <FileText className="w-3.5 h-3.5" />,
    'WhatsApp': <MessageCircle className="w-3.5 h-3.5" />,
    'Referral': <Users className="w-3.5 h-3.5" />,
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;
    return `${Math.floor(diffDays / 30)}mo`;
}

// Ghost Detector - Visual urgency based on lead age
function getLeadUrgency(lead: Lead): {
    borderClass: string;
    opacityClass: string;
    grayscale: boolean;
    isGhost: boolean;
    badge: string | null;
} {
    const referenceDate = new Date(lead.updated_at || lead.created_at);
    const now = new Date();
    const diffMs = now.getTime() - referenceDate.getTime();
    const diffHours = diffMs / 3600000;
    const diffDays = diffMs / 86400000;

    // Fresh (< 24h)
    if (diffHours < 24) {
        return {
            borderClass: 'border-l-4 border-l-success',
            opacityClass: '',
            grayscale: false,
            isGhost: false,
            badge: 'Nuevo',
        };
    }
    // Warning (24-72h)
    if (diffHours < 72) {
        return {
            borderClass: 'border-l-4 border-l-warning',
            opacityClass: '',
            grayscale: false,
            isGhost: false,
            badge: null,
        };
    }
    // Cold (72h - 7d)
    if (diffDays < 7) {
        return {
            borderClass: 'border-l-4 border-l-muted-foreground/30',
            opacityClass: 'opacity-90',
            grayscale: false,
            isGhost: false,
            badge: null,
        };
    }
    // Ghost (> 7 days)
    return {
        borderClass: 'border-l-4 border-l-muted',
        opacityClass: 'opacity-70',
        grayscale: true,
        isGhost: true,
        badge: null,
    };
}

// WhatsApp message template
function getWhatsAppUrl(lead: Lead, userName: string = 'Tu terapeuta'): string {
    const message = `Hola ${lead.first_name}, soy ${userName}. Recibí tu interés en la terapia. ¿Cómo puedo ayudarte?`;
    const phone = lead.phone?.replace(/\s+/g, '').replace(/^\+/, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

import { API_URL } from '@/lib/api';
import { MousePointerClick, TrendingUp, Zap } from 'lucide-react';

export default function LeadsPage() {
    const terminology = useTerminology();
    const tt = useTranslations('Tooltips');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Load leads
    const loadLeads = useCallback(async () => {
        try {
            setLoading(true);
            const [data, statsData] = await Promise.all([
                api.leads.list({ limit: 100 }),
                api.leads.getStats()
            ]);
            setLeads(data.data || data.leads || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading leads:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLeads();
    }, [loadLeads]);

    // Handle drag end
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const newStatus = destination.droppableId as LeadStatus;
        const leadId = draggableId;

        // Optimistic update
        setLeads(prev => prev.map(lead =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));

        // API call
        try {
            await api.leads.update(leadId, { status: newStatus });
        } catch (err) {
            console.error('Error updating lead status:', err);
            loadLeads();
        }
    };

    // Convert lead to patient
    const handleConvert = async (leadId: string) => {
        try {
            const data = await api.leads.convert(leadId);
            // Remove from kanban (it's now CONVERTED)
            setLeads(prev => prev.filter(lead => lead.id !== leadId));
            setSelectedLead(null);
            // Could navigate to patient page here
            alert(`✅ ${data.message}`);
        } catch (err: any) {
            console.error('Error converting lead:', err);
            alert(`Error: ${err.message || 'Error de conexión'}`);
        }
    };

    // Create new lead
    const handleCreateLead = async (data: { first_name: string; last_name: string; email?: string; phone?: string; notes?: string }) => {
        try {
            const newLead = await api.leads.create({ ...data, source: 'Manual' });
            setLeads(prev => [newLead, ...prev]);
            setShowCreateModal(false);
        } catch (err) {
            console.error('Error creating lead:', err);
        }
    };

    // Group leads by column
    const getColumnLeads = (status: LeadStatus) =>
        filteredLeads.filter(lead => lead.status === status);

    const filteredLeads = (Array.isArray(leads) ? leads : []).filter(lead => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            lead.first_name.toLowerCase().includes(q) ||
            lead.last_name.toLowerCase().includes(q) ||
            lead.email?.toLowerCase().includes(q) ||
            lead.phone?.includes(q)
        );
    });

    if (loading && !leads.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                icon={UserPlus}
                kicker="CONNECT"
                title="CRM - Interesados"
                subtitle={`Gestiona tu pipeline antes de convertir a ${terminology.plural.toLowerCase()}`}
                action={{
                    label: "Nuevo Lead",
                    onClick: () => setShowCreateModal(true),
                    icon: Plus
                }}
            >
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none text-foreground placeholder:text-muted-foreground transition-all"
                    />
                </div>
            </PageHeader>

            {/* Funnel Metrics Widget - v1.6.1 */}
            {stats && (
                <div className="flex items-center gap-8 p-6 bg-card border border-border/50 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 overflow-x-auto">
                    <div className="flex items-center gap-4 border-r border-border/50 pr-8">
                        <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <MousePointerClick className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="type-ui text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold mb-0.5">Visitas Link</span>
                            <span className="font-mono font-bold text-2xl tracking-tighter">{stats.total_views}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-r border-border/50 pr-8">
                        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-brand" />
                        </div>
                        <div className="flex flex-col">
                            <span className="type-ui text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold mb-0.5">Nuevos Leads</span>
                            <span className="font-mono font-bold text-2xl tracking-tighter">{stats.total_leads}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex flex-col">
                            <span className="type-ui text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold mb-0.5">Conversión</span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono font-bold text-2xl tracking-tighter text-success">{stats.conversion_rate}</span>
                                <span className="text-xs font-bold text-success/70">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-4 gap-6">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className={`${column.bgColor} ${column.borderColor} border rounded-2xl p-4 shadow-[0_0_60px_-15px_rgba(0,0,0,0.15),0_0_25px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_-20px_rgba(0,0,0,0.6)]`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${column.color}`}>
                                    {column.title}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${column.bgColor} ${column.color} border ${column.borderColor}`}>
                                    {getColumnLeads(column.id).length}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={column.id}>
                                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`min-h-[400px] space-y-3 transition-colors rounded-xl p-2 ${snapshot.isDraggingOver ? 'bg-card/50' : ''
                                            }`}
                                    >
                                        {getColumnLeads(column.id).map((lead, index) => (
                                            <Draggable
                                                key={lead.id}
                                                draggableId={lead.id}
                                                index={index}
                                            >
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                                                    const urgency = getLeadUrgency(lead);
                                                    return (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedLead(lead)}
                                                            className={`bg-surface rounded-xl p-4 shadow-sm border border-border-subtle cursor-pointer hover:shadow-md transition-all ${urgency.borderClass} ${urgency.opacityClass} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-brand/50' : ''} ${urgency.grayscale ? 'grayscale-[30%]' : ''}`}
                                                        >
                                                            {/* Lead Card */}
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium text-foreground ">
                                                                            {lead.first_name} {lead.last_name}
                                                                        </p>
                                                                        {urgency.badge && (
                                                                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                                                                                {urgency.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {lead.email && (
                                                                        <p className="text-sm text-foreground/60 dark:text-muted-foreground truncate max-w-[180px]">
                                                                            {lead.email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {/* WhatsApp Button */}
                                                                    {lead.phone && (
                                                                        <Tooltip content={tt('sendWhatsApp')}>
                                                                            <a
                                                                                href={getWhatsAppUrl(lead)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                                                            >
                                                                                <MessageCircle className="w-4 h-4" />
                                                                            </a>
                                                                        </Tooltip>
                                                                    )}
                                                                    <div className={`p-1.5 rounded-lg ${column.bgColor}`}>
                                                                        {SOURCE_ICONS[lead.source] || <UserPlus className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                                {urgency.isGhost && <Ghost className="w-3 h-3" />}
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatTimeAgo(lead.created_at)}</span>
                                                                {lead.sherlock_metrics?.total_score !== undefined && (
                                                                    <div className="flex items-center gap-1.5 ml-auto">
                                                                        {/* Quick Actions v1.6.2 */}
                                                                        <Tooltip content="Editar detalles">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedLead(lead);
                                                                                }}
                                                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-brand transition-all active:scale-95"
                                                                            >
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </Tooltip>
                                                                        <Tooltip content={`Convertir a ${terminology.singular}`}>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleConvert(lead.id);
                                                                                }}
                                                                                className="p-1.5 rounded-lg hover:bg-brand/10 text-muted-foreground hover:text-brand transition-all active:scale-95"
                                                                            >
                                                                                <ArrowRightCircle className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </Tooltip>

                                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand ml-1" />
                                                                        <span className="font-mono font-bold text-foreground">
                                                                            {lead.sherlock_metrics.total_score}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Create Lead Modal */}
            {showCreateModal && (
                <CreateLeadModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateLead}
                />
            )}

            {/* Lead Detail Sheet */}
            {selectedLead && (
                <LeadDetailSheet
                    lead={selectedLead}
                    terminology={terminology}
                    onClose={() => setSelectedLead(null)}
                    onConvert={() => handleConvert(selectedLead.id)}
                    onUpdate={loadLeads}
                />
            )}
        </div>
    );
}

// Create Lead Modal Component
function CreateLeadModal({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (data: { first_name: string; last_name: string; email?: string; phone?: string; notes?: string }) => void;
}) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-foreground mb-4">Nuevo Lead</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground/70 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-foreground placeholder:text-muted-foreground"
                                placeholder="Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/70 mb-1">Apellido *</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-foreground placeholder:text-muted-foreground"
                                placeholder="Pérez"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-foreground placeholder:text-muted-foreground"
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-foreground placeholder:text-muted-foreground"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-foreground placeholder:text-muted-foreground"
                            placeholder="Interesado en retiro de Ibiza..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-foreground/70 hover:bg-accent rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (firstName && lastName) {
                                onCreate({
                                    first_name: firstName,
                                    last_name: lastName,
                                    email: email || undefined,
                                    phone: phone || undefined,
                                    notes: notes || undefined,
                                });
                            }
                        }}
                        disabled={!firstName || !lastName}
                        className="px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                        Crear Lead
                    </button>
                </div>
            </div>
        </div>
    );
}

// Lead Detail Sheet Component
function LeadDetailSheet({
    lead,
    terminology,
    onClose,
    onConvert,
    onUpdate,
}: {
    lead: Lead;
    terminology: { singular: string; plural: string };
    onClose: () => void;
    onConvert: () => void;
    onUpdate: () => void;
}) {
    const tt = useTranslations('Tooltips');
    const [firstName, setFirstName] = useState(lead.first_name);
    const [lastName, setLastName] = useState(lead.last_name);
    const [email, setEmail] = useState(lead.email || '');
    const [phone, setPhone] = useState(lead.phone || '');
    const [notes, setNotes] = useState(lead.notes || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const hasChanges =
        firstName !== lead.first_name ||
        lastName !== lead.last_name ||
        email !== (lead.email || '') ||
        phone !== (lead.phone || '') ||
        notes !== (lead.notes || '');

    const handleSave = async () => {
        if (!firstName || !lastName) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email || null,
                    phone: phone || null,
                    notes: notes || null,
                }),
            });
            if (response.ok) {
                onUpdate();
            }
        } catch (err) {
            console.error('Error saving lead:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkLost = async () => {
        if (!confirm('¿Marcar este lead como perdido?')) return;
        try {
            await api.leads.update(lead.id, { status: 'LOST' });
            onClose();
            onUpdate();
        } catch (err) {
            console.error('Error marking lost:', err);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar este lead permanentemente? Esta acción no se puede deshacer.')) return;
        setDeleting(true);
        try {
            const response = await fetch(`${API_URL}/leads/${lead.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                onClose();
                onUpdate();
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (err) {
            console.error('Error deleting lead:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed top-0 bottom-0 right-0 xl:right-[320px] w-full max-w-lg bg-card shadow-2xl animate-slide-in-right flex flex-col z-[45] border-l border-border">
            {/* Header */}
            <div className="bg-gradient-to-br from-brand via-brand/90 to-brand/80 px-6 py-5 text-white sticky top-0 z-10 shadow-lg border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                            <User className="w-5 h-5 opacity-80" />
                            {firstName} {lastName}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {lead.status}
                            </span>
                            <span className="text-xs text-white/60 font-mono">
                                vía {lead.source}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {lead.phone && (
                            <Tooltip content={tt('sendWhatsApp')}>
                                <a
                                    href={getWhatsAppUrl(lead)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                            </Tooltip>
                        )}
                        <Tooltip content={tt('copyBookingLink')}>
                            <button
                                onClick={() => {
                                    const bookingUrl = `${window.location.origin}/book?email=${encodeURIComponent(lead.email || '')}&name=${encodeURIComponent(`${lead.first_name} ${lead.last_name}`)}`;
                                    navigator.clipboard.writeText(bookingUrl);
                                    alert('Link de reserva copiado al portapapeles');
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition-all"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 active:scale-90 rounded-lg transition-all ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Editable Contact Info */}
                <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Información de Contacto</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-foreground/60 mb-1">Nombre</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-brand/50 outline-none text-foreground bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-foreground/60 mb-1">Apellido</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-brand/50 outline-none text-foreground bg-background"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-foreground/60 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-brand/50 outline-none text-foreground bg-background"
                            placeholder="email@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-foreground/60 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-brand/50 outline-none text-foreground bg-background"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                </div>

                {/* Source Details */}
                {lead.source_details && (
                    <div className="bg-muted/50 border border-border/50 rounded-xl p-4">
                        <h3 className="type-ui font-bold text-brand uppercase tracking-widest text-[10px] mb-3">Origen del Lead</h3>
                        <div className="space-y-2 text-sm">
                            {Object.entries(lead.source_details).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between border-b border-border/30 pb-1 last:border-0">
                                    <span className="text-muted-foreground/70 capitalize text-xs">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-foreground font-medium">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Registration Info */}
                <div className="type-ui text-[10px] text-muted-foreground/60 uppercase tracking-tight">
                    Registrado el {new Date(lead.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </div>

                {/* Notes */}
                <div>
                    <h3 className="font-medium text-foreground mb-2">Notas</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand outline-none transition-all text-foreground bg-background resize-none"
                        placeholder="Añade notas sobre este lead..."
                    />
                </div>

                {/* v1.6 CRM: Cortex Shadow Profile Widget */}
                {(lead.sherlock_metrics || lead.shadow_profile) && (
                    <div className="bg-muted/30 border border-brand/10 rounded-xl p-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                            <h3 className="text-xs font-mono font-bold text-brand uppercase tracking-widest">
                                Cortex Shadow Profile
                            </h3>
                        </div>

                        {lead.sherlock_metrics && (
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'R', full: 'Risk', val: lead.sherlock_metrics.r },
                                    { label: 'N', full: 'Need', val: lead.sherlock_metrics.n },
                                    { label: 'A', full: 'Authority', val: lead.sherlock_metrics.a },
                                    { label: 'V', full: 'Velocity', val: lead.sherlock_metrics.v },
                                ].map(metric => {
                                    const val = metric.val ?? 50;
                                    const colorClass = val > 75 ? 'text-emerald-500' : val > 40 ? 'text-amber-500' : 'text-red-500';
                                    return (
                                        <div key={metric.label} className="bg-background rounded-lg p-2 text-center border border-border/50 shadow-sm">
                                            <p className="text-[9px] text-muted-foreground uppercase font-medium">{metric.label}</p>
                                            <p className={`font-mono font-bold text-lg ${colorClass}`}>
                                                {metric.val ?? '--'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {lead.shadow_profile && (
                            <div className="space-y-4 pt-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Intención</span>
                                    <p className="text-sm text-foreground/90 italic">"{lead.shadow_profile.intent}"</p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Estilo</span>
                                    <p className="text-sm font-medium">{lead.shadow_profile.communication_style}</p>
                                </div>

                                {lead.shadow_profile.contact_suggestion && (
                                    <div className="bg-brand/5 border border-brand/10 rounded-lg p-3 mt-2">
                                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider block mb-1">Sugerencia de Contacto</span>
                                        <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                                            {lead.shadow_profile.contact_suggestion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Danger Zone */}
                <div className="pt-8 mt-8 border-t border-border/50">
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-xs text-muted-foreground hover:text-risk transition-colors flex items-center gap-2 px-2"
                    >
                        <Ghost className="w-3 h-3" />
                        {deleting ? 'Eliminando...' : 'Eliminar lead permanentemente'}
                    </button>
                </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-6 bg-card border-t border-border flex flex-col gap-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !firstName || !lastName}
                        className="w-full px-4 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 active:scale-[0.98] transition-all font-bold disabled:opacity-50 shadow-md shadow-brand/10"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMarkLost}
                        className="flex-1 px-4 py-3 border border-risk/20 text-risk rounded-xl hover:bg-risk/5 active:scale-95 transition-all font-bold type-ui"
                    >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Perdido
                    </button>
                    <button
                        onClick={onConvert}
                        className="flex-1 px-4 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 active:scale-95 transition-all font-bold type-ui shadow-lg shadow-brand/20"
                    >
                        <ArrowRightCircle className="w-4 h-4 inline mr-2" />
                        Convertir a {terminology.singular}
                    </button>
                </div>
            </div>
        </div>
    );
}
