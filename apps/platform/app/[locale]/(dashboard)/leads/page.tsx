'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { useTerminology } from '@/hooks/use-terminology';
import { api } from '@/lib/api';
import {
    UserPlus, Phone, MessageCircle, FileText, Users,
    ArrowRightCircle, XCircle, Clock, Plus, Search,
    Filter, ChevronDown, Ghost, Link, Copy
} from 'lucide-react';

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
    converted_patient_id: string | null;
    created_at: string;
    updated_at: string;
}

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

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
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    {
        id: 'CONTACTED',
        title: 'Contactados',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
    },
    {
        id: 'QUALIFIED',
        title: 'Cualificados',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
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
            borderClass: 'border-l-4 border-l-emerald-400',
            opacityClass: '',
            grayscale: false,
            isGhost: false,
            badge: 'Nuevo',
        };
    }
    // Warning (24-72h)
    if (diffHours < 72) {
        return {
            borderClass: 'border-l-4 border-l-amber-400',
            opacityClass: '',
            grayscale: false,
            isGhost: false,
            badge: null,
        };
    }
    // Cold (72h - 7d)
    if (diffDays < 7) {
        return {
            borderClass: 'border-l-4 border-l-slate-300',
            opacityClass: 'opacity-90',
            grayscale: false,
            isGhost: false,
            badge: null,
        };
    }
    // Ghost (> 7 days)
    return {
        borderClass: 'border-l-4 border-l-slate-200',
        opacityClass: 'opacity-75',
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

export default function LeadsPage() {
    const terminology = useTerminology();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Load leads
    const loadLeads = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/leads`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(data.leads || []);
            } else {
                setError('Error al cargar leads');
            }
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
            const response = await fetch(`${API_URL}/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                // Revert on error
                loadLeads();
            }
        } catch (err) {
            console.error('Error updating lead status:', err);
            loadLeads();
        }
    };

    // Convert lead to patient
    const handleConvert = async (leadId: string) => {
        try {
            const response = await fetch(`${API_URL}/leads/${leadId}/convert`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                // Remove from kanban (it's now CONVERTED)
                setLeads(prev => prev.filter(lead => lead.id !== leadId));
                setSelectedLead(null);
                // Could navigate to patient page here
                alert(`✅ ${data.message}`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            }
        } catch (err) {
            console.error('Error converting lead:', err);
            alert('Error de conexión');
        }
    };

    // Create new lead
    const handleCreateLead = async (data: { first_name: string; last_name: string; email?: string; phone?: string; notes?: string }) => {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...data, source: 'Manual' }),
            });

            if (response.ok) {
                const newLead = await response.json();
                setLeads(prev => [newLead, ...prev]);
                setShowCreateModal(false);
            }
        } catch (err) {
            console.error('Error creating lead:', err);
        }
    };

    // Filter leads by search
    const filteredLeads = leads.filter(lead => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            lead.first_name.toLowerCase().includes(q) ||
            lead.last_name.toLowerCase().includes(q) ||
            lead.email?.toLowerCase().includes(q) ||
            lead.phone?.includes(q)
        );
    });

    // Group leads by column
    const getColumnLeads = (status: LeadStatus) =>
        filteredLeads.filter(lead => lead.status === status);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-200">
                        <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                            CRM - Interesados
                        </h1>
                        <p className="text-slate-500">Gestiona tu pipeline de ventas antes de convertir a {terminology.plural.toLowerCase()}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Lead
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-3 gap-6">
                    {COLUMNS.map(column => (
                        <div
                            key={column.id}
                            className={`${column.bgColor} ${column.borderColor} border rounded-2xl p-4`}
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
                                        className={`min-h-[400px] space-y-3 transition-colors rounded-xl p-2 ${snapshot.isDraggingOver ? 'bg-white/50' : ''
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
                                                            className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all ${urgency.borderClass} ${urgency.opacityClass} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-purple-300' : ''} ${urgency.grayscale ? 'grayscale-[30%]' : ''}`}
                                                        >
                                                            {/* Lead Card */}
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium text-slate-900">
                                                                            {lead.first_name} {lead.last_name}
                                                                        </p>
                                                                        {urgency.badge && (
                                                                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                                                                                {urgency.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {lead.email && (
                                                                        <p className="text-sm text-slate-500 truncate max-w-[180px]">
                                                                            {lead.email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {/* WhatsApp Button */}
                                                                    {lead.phone && (
                                                                        <a
                                                                            href={getWhatsAppUrl(lead)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                                                            title="Enviar WhatsApp"
                                                                        >
                                                                            <MessageCircle className="w-4 h-4" />
                                                                        </a>
                                                                    )}
                                                                    <div className={`p-1.5 rounded-lg ${column.bgColor}`}>
                                                                        {SOURCE_ICONS[lead.source] || <UserPlus className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                                                                {urgency.isGhost && <Ghost className="w-3 h-3" />}
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatTimeAgo(lead.created_at)}</span>
                                                                {lead.source !== 'Manual' && (
                                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                                                                        {lead.source}
                                                                    </span>
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
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Nuevo Lead</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Apellido *</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="Pérez"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 placeholder:text-slate-400"
                            placeholder="juan@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 placeholder:text-slate-400"
                            placeholder="+34 600 000 000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Notas</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-900 placeholder:text-slate-400"
                            placeholder="Interesado en retiro de Ibiza..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
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
            await fetch(`${API_URL}/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'LOST' }),
            });
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
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={onClose}>
            <div
                className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-in-right overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 text-white sticky top-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">
                                {lead.first_name} {lead.last_name}
                            </h2>
                            <p className="text-purple-200 text-sm mt-0.5">{lead.email || 'Sin email'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                {lead.status}
                            </span>
                            <span className="text-sm text-purple-200">
                                vía {lead.source}
                            </span>
                        </div>
                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                            {lead.phone && (
                                <a
                                    href={getWhatsAppUrl(lead)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Enviar WhatsApp"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    const bookingUrl = `${window.location.origin}/book?email=${encodeURIComponent(lead.email || '')}&name=${encodeURIComponent(`${lead.first_name} ${lead.last_name}`)}`;
                                    navigator.clipboard.writeText(bookingUrl);
                                    alert('Link de reserva copiado al portapapeles');
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Copiar link de reserva"
                            >
                                <Link className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Editable Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-700">Información de Contacto</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="email@ejemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-500 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="+34 600 000 000"
                            />
                        </div>
                    </div>

                    {/* Source Details */}
                    {lead.source_details && Object.keys(lead.source_details).length > 0 && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <h3 className="font-medium text-blue-700 mb-2">Origen del Lead</h3>
                            <div className="space-y-1 text-sm">
                                {Object.entries(lead.source_details).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="text-blue-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                        <span className="text-blue-800">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Created date */}
                    <div className="text-sm text-slate-400">
                        Creado: {new Date(lead.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>

                    {/* Notes */}
                    <div>
                        <h3 className="font-medium text-slate-700 mb-2">Notas</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            placeholder="Añade notas sobre este lead..."
                        />
                    </div>

                    {/* Save Changes Button */}
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !firstName || !lastName}
                            className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}

                    {/* Danger Zone */}
                    <div className="border-t border-slate-200 pt-4">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                            {deleting ? 'Eliminando...' : 'Eliminar lead permanentemente'}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex items-center gap-3">
                    <button
                        onClick={handleMarkLost}
                        className="flex-1 px-4 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                    >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Perdido
                    </button>
                    <button
                        onClick={onConvert}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-colors font-medium shadow-lg shadow-purple-200"
                    >
                        <ArrowRightCircle className="w-4 h-4 inline mr-2" />
                        Convertir a {terminology.singular}
                    </button>
                </div>
            </div>
        </div>
    );
}

