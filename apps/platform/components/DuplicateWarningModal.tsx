'use client';

import { AlertTriangle, User, TrendingUp, ExternalLink, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * DuplicateWarningModal v1.0
 * 
 * Modal de warning cuando se detecta un contacto duplicado
 * al intentar crear un Lead o Paciente.
 * 
 * Uses Design System classes: .badge, .badge-success, .badge-brand, .badge-warning
 */

interface DuplicateInfo {
    identity_id: string;
    primary_email: string | null;
    primary_phone: string | null;
    linked_entity: {
        type: 'lead' | 'patient';
        name: string;
        id: string;
    } | null;
}

interface DuplicateWarningModalProps {
    duplicate: DuplicateInfo;
    onViewExisting: () => void;
    onCreateAnyway: () => void;
    onCancel: () => void;
}

export default function DuplicateWarningModal({
    duplicate,
    onViewExisting,
    onCreateAnyway,
    onCancel,
}: DuplicateWarningModalProps) {
    const entityLabel = duplicate.linked_entity?.type === 'patient' ? 'Paciente' : 'Lead';
    const entityPath = duplicate.linked_entity?.type === 'patient'
        ? `/patients/${duplicate.linked_entity.id}`
        : `/leads`;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="card p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                        <h2 className="type-h3 mb-1">
                            Contacto duplicado detectado
                        </h2>
                        <p className="type-body">
                            Ya existe un registro con estos datos de contacto.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-muted rounded-lg transition-colors active:scale-95"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Duplicate Info */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-3 border border-border/50">
                    {duplicate.linked_entity && (
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${duplicate.linked_entity.type === 'patient'
                                    ? 'bg-success/10'
                                    : 'bg-brand/10'
                                }`}>
                                {duplicate.linked_entity.type === 'patient'
                                    ? <User className="w-4 h-4 text-success" />
                                    : <TrendingUp className="w-4 h-4 text-brand" />
                                }
                            </div>
                            <div>
                                <span className={`badge ${duplicate.linked_entity.type === 'patient'
                                        ? 'badge-success'
                                        : 'badge-brand'
                                    }`}>
                                    {entityLabel}
                                </span>
                                <p className="type-ui font-semibold mt-1">
                                    {duplicate.linked_entity.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {duplicate.primary_email && (
                        <div className="type-body">
                            <span className="text-muted-foreground">Email: </span>
                            <span className="text-foreground font-mono">{duplicate.primary_email}</span>
                        </div>
                    )}

                    {duplicate.primary_phone && (
                        <div className="type-body">
                            <span className="text-muted-foreground">Teléfono: </span>
                            <span className="text-foreground font-mono">{duplicate.primary_phone}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {duplicate.linked_entity && (
                        <Link
                            href={entityPath}
                            onClick={onViewExisting}
                            className="btn btn-brand btn-md justify-center"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Ver {entityLabel} existente
                        </Link>
                    )}

                    <button
                        onClick={onCreateAnyway}
                        className="btn btn-outline btn-md justify-center"
                    >
                        Crear de todos modos
                    </button>

                    <button
                        onClick={onCancel}
                        className="btn btn-ghost btn-sm justify-center text-muted-foreground"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
