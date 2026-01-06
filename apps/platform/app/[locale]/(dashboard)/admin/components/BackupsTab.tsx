'use client';

import { useState, useEffect } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

// Separate component for Backups Tab to manage its own state
function BackupsTab() {
    const [backups, setBackups] = useState<Array<{
        filename: string;
        size_human: string;
        created_at: string;
        age_hours: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Nuclear confirmation modal state
    const [restoreModal, setRestoreModal] = useState<{ open: boolean; filename: string | null }>({ open: false, filename: null });
    const [confirmInput, setConfirmInput] = useState('');

    useEffect(() => {
        loadBackups();
    }, []);

    async function loadBackups() {
        try {
            const response = await fetch(`${API_URL}/admin/backups`, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load backups');
            const data = await response.json();
            setBackups(data.backups || []);
        } catch (err) {
            console.error('Error loading backups:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateBackup() {
        setCreating(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_URL}/admin/backups/create`, {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Backup created!' });
                loadBackups();
            } else {
                setMessage({ type: 'error', text: data.detail || 'Failed to create backup' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setCreating(false);
        }
    }

    function openRestoreModal(filename: string) {
        setRestoreModal({ open: true, filename });
        setConfirmInput('');
    }

    function closeRestoreModal() {
        setRestoreModal({ open: false, filename: null });
        setConfirmInput('');
    }

    async function executeRestore() {
        if (!restoreModal.filename || confirmInput !== 'RESTAURAR') return;

        const filename = restoreModal.filename;
        closeRestoreModal();
        setRestoring(filename);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/admin/backups/restore`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, confirm: true }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Database restored! Refresh the page.' });
            } else {
                setMessage({ type: 'error', text: data.detail || 'Restore failed' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setRestoring(null);
        }
    }

    async function handleDelete(filename: string) {
        if (!confirm(`Delete backup: ${filename}?`)) return;
        try {
            await fetch(`${API_URL}/admin/backups/${filename}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            loadBackups();
        } catch (err) {
            console.error('Delete failed');
        }
    }

    function handleDownload(filename: string) {
        // Open download in new tab - browser will handle the file download
        window.open(`${API_URL}/admin/backups/${filename}/download`, '_blank');
    }

    if (loading) {
        return <div className="p-8 text-center">Loading backups...</div>;
    }

    return (
        <>
            <section className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">🛡️ Database Backups</h2>
                        <p className="text-sm text-foreground/60">Create and restore database backups (Super Admin only)</p>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        {creating ? '⏳ Creating...' : '📸 Create Backup'}
                    </button>
                </div>

                {message && (
                    <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Filename</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-foreground/60 uppercase">Age</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-foreground/60 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {backups.map((backup) => (
                            <tr key={backup.filename} className="hover:bg-accent">
                                <td className="px-6 py-4 font-mono text-sm text-foreground">{backup.filename}</td>
                                <td className="px-6 py-4 text-sm text-foreground/70">{backup.size_human}</td>
                                <td className="px-6 py-4 text-sm text-foreground/70">
                                    {new Date(backup.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground/70">
                                    {backup.age_hours < 1 ? 'Just now' : `${Math.round(backup.age_hours)}h ago`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => handleDownload(backup.filename)}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openRestoreModal(backup.filename)}
                                            disabled={restoring === backup.filename}
                                            className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="Restore"
                                        >
                                            <RotateCcw className={`h-4 w-4 ${restoring === backup.filename ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(backup.filename)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {backups.length === 0 && (
                    <div className="text-center py-12 text-foreground/60">
                        No backups yet. Create your first backup.
                    </div>
                )}
            </section>

            {/* Nuclear Confirmation Modal */}
            {restoreModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">
                                PELIGRO CRÍTICO: RESTAURACIÓN DE SISTEMA
                            </h3>
                            <p className="text-foreground/70 mb-4">
                                Estás a punto de <span className="font-bold text-red-600">sobrescribir la base de datos actual</span> con
                                la copia <code className="bg-muted px-1 rounded">{restoreModal.filename}</code>.
                            </p>
                            <p className="text-red-700 font-semibold mb-6">
                                ⚠️ TODOS LOS DATOS POSTERIORES A ESA FECHA SE PERDERÁN PERMANENTEMENTE.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Escribe <span className="font-mono font-bold text-red-600">RESTAURAR</span> para confirmar:
                                </label>
                                <input
                                    type="text"
                                    value={confirmInput}
                                    onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                                    className="w-full border-2 border-red-300 rounded-lg px-4 py-2 text-center font-mono text-lg focus:border-red-500 focus:outline-none"
                                    placeholder="RESTAURAR"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={closeRestoreModal}
                                    className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-accent"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={executeRestore}
                                    disabled={confirmInput !== 'RESTAURAR'}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🔄 RESTAURAR AHORA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
export { BackupsTab };
