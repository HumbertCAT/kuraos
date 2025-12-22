'use client';

import { useState, useEffect } from 'react';
import { Bot, X, Edit, Send, Clock, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface PendingAction {
    id: string;
    rule_id: string;
    rule_name: string;
    action_type: string;
    recipient_id: string;
    recipient_type: string;
    recipient_name: string;
    recipient_email: string | null;
    draft_content: {
        subject?: string;
        body?: string;
    };
    ai_generated_content: {
        subject?: string;
        body?: string;
    } | null;
    status: string;
    created_at: string;
}

export default function PendingActionsWidget() {
    const [actions, setActions] = useState<PendingAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);

    useEffect(() => {
        loadPendingActions();
    }, []);

    async function loadPendingActions() {
        try {
            const data = await api.pendingActions.list();
            setActions(data.actions || []);
        } catch (err) {
            console.error('Failed to load pending actions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(actionId: string) {
        setProcessing(actionId);
        try {
            await api.pendingActions.approve(actionId);
            setActions(actions.filter(a => a.id !== actionId));
            setSelectedAction(null);
        } catch (err) {
            console.error('Failed to approve action:', err);
        } finally {
            setProcessing(null);
        }
    }

    async function handleReject(actionId: string) {
        setProcessing(actionId);
        try {
            await api.pendingActions.reject(actionId);
            setActions(actions.filter(a => a.id !== actionId));
            setSelectedAction(null);
        } catch (err) {
            console.error('Failed to reject action:', err);
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-100 rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-slate-50 rounded"></div>
                </div>
            </div>
        );
    }

    if (actions.length === 0) {
        return null; // Don't show widget if no pending actions
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Tareas Pendientes</h3>
                            <p className="text-xs text-slate-500">
                                {actions.length} {actions.length === 1 ? 'borrador' : 'borradores'} esperando aprobación
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                        {actions.length}
                    </span>
                </div>
            </div>

            {/* Actions List */}
            <div className="divide-y divide-slate-100">
                {actions.map(action => (
                    <div
                        key={action.id}
                        className="p-4 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-slate-800">
                                        🤖 {action.rule_name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        preparó respuesta para
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">
                                    {action.recipient_name}
                                </p>
                                {action.draft_content.subject && (
                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                        Asunto: {action.draft_content.subject}
                                    </p>
                                )}
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    {new Date(action.created_at).toLocaleString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedAction(action)}
                                    className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                    title="Ver/Editar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleApprove(action.id)}
                                    disabled={processing === action.id}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Enviar"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleReject(action.id)}
                                    disabled={processing === action.id}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Descartar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl">
                        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800">
                                    Borrador de {selectedAction.rule_name}
                                </h3>
                                <button
                                    onClick={() => setSelectedAction(null)}
                                    className="p-1 hover:bg-white/50 rounded"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">
                                    Destinatario
                                </label>
                                <p className="text-slate-800 font-medium">
                                    {selectedAction.recipient_name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {selectedAction.recipient_email || 'Sin email'}
                                </p>
                            </div>

                            {selectedAction.draft_content.subject && (
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase">
                                        Asunto
                                    </label>
                                    <p className="text-slate-800">
                                        {selectedAction.draft_content.subject}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">
                                    Mensaje (Borrador)
                                </label>
                                <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                                    {selectedAction.draft_content.body || 'Sin contenido'}
                                </div>
                            </div>

                            {selectedAction.ai_generated_content && (
                                <div>
                                    <label className="text-xs font-medium text-violet-600 uppercase flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Versión IA
                                    </label>
                                    <div className="mt-1 p-3 bg-violet-50 border border-violet-100 rounded-lg text-sm text-slate-700">
                                        {selectedAction.ai_generated_content.body || 'Sin contenido'}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => handleReject(selectedAction.id)}
                                disabled={processing === selectedAction.id}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={() => handleApprove(selectedAction.id)}
                                disabled={processing === selectedAction.id}
                                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-fuchsia-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
