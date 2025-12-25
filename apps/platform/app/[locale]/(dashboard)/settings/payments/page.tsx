'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Wallet,
    Check,
    AlertCircle,
    ExternalLink,
    Loader2,
    Ban,
    CheckCircle2,
    Info
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

import { API_URL } from '@/lib/api';

interface ConnectStatus {
    has_account: boolean;
    is_enabled: boolean;
    connect_id: string | null;
}

export default function PaymentsPage() {
    const t = useTranslations('Settings');

    const [status, setStatus] = useState<ConnectStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        fetchConnectStatus();

        // Check URL params for success/error
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            setMessage({ type: 'success', text: '¡Cuenta bancaria conectada correctamente! Ya puedes recibir pagos.' });
        } else if (params.get('incomplete')) {
            setMessage({ type: 'info', text: 'El proceso de onboarding no se ha completado. Haz clic en "Conectar Cuenta" para continuar.' });
        } else if (params.get('refresh')) {
            setMessage({ type: 'info', text: 'El enlace ha expirado. Haz clic en "Conectar Cuenta" para obtener uno nuevo.' });
        } else if (params.get('error')) {
            setMessage({ type: 'error', text: 'Error al configurar la cuenta. Inténtalo de nuevo.' });
        }
    }, []);

    const fetchConnectStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/connect/status`, {
                credentials: 'include',
            });
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch connect status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectOnboarding = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/connect/onboarding`, {
                method: 'POST',
                credentials: 'include',
            });

            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Error al iniciar onboarding' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted py-8 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted py-8 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <SectionHeader
                    icon={Wallet}
                    title="Cobros"
                    subtitle="Configura tu cuenta para recibir pagos de pacientes"
                    gradientFrom="violet-500"
                    gradientTo="purple-600"
                    shadowColor="violet-500/25"
                />

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : message.type === 'info'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {message.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {message.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                        {message.text}
                    </div>
                )}

                {/* Connect Status Card */}
                <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
                    <div className="flex items-start gap-6">
                        {/* Status Icon */}
                        <div className={`p-4 rounded-2xl ${status?.is_enabled ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {status?.is_enabled ? (
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            ) : (
                                <Ban className="w-8 h-8 text-red-500" />
                            )}
                        </div>

                        {/* Status Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-foreground">
                                    Estado de Cobros
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status?.is_enabled
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {status?.is_enabled ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <p className="text-foreground/70 mb-6">
                                {status?.is_enabled
                                    ? 'Tu cuenta bancaria está conectada. Los pagos de pacientes se depositarán automáticamente.'
                                    : 'Conecta tu cuenta bancaria para empezar a recibir pagos de tus pacientes.'
                                }
                            </p>

                            {!status?.is_enabled && (
                                <button
                                    onClick={handleConnectOnboarding}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ExternalLink className="w-5 h-5" />
                                    )}
                                    Conectar Cuenta Bancaria
                                </button>
                            )}

                            {status?.is_enabled && status?.connect_id && (
                                <div className="flex items-center gap-2 text-sm text-foreground/60">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>ID de Cuenta: {status.connect_id}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
                    <h4 className="font-semibold text-foreground mb-3">¿Cómo funciona?</h4>
                    <ul className="space-y-3 text-foreground/70">
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                            <span>Conectas tu cuenta bancaria a través de Stripe (proceso seguro)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                            <span>Los pacientes pagan al reservar servicios en tu página pública</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                            <span>El dinero se deposita automáticamente en tu cuenta (menos una pequeña comisión de plataforma)</span>
                        </li>
                    </ul>
                </div>

                {/* Commission Info */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <h4 className="font-semibold text-foreground mb-4">Comisiones por Plan</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-xl text-center">
                            <p className="text-2xl font-bold text-foreground">5%</p>
                            <p className="text-sm text-foreground/60">Builder (Gratis)</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                            <p className="text-2xl font-bold text-emerald-600">3%</p>
                            <p className="text-sm text-foreground/60">Pro (49€/mes)</p>
                        </div>
                        <div className="p-4 bg-violet-50 rounded-xl text-center border border-violet-200">
                            <p className="text-2xl font-bold text-violet-600">2%</p>
                            <p className="text-sm text-foreground/60">Center (149€/mes)</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        * Además de las tarifas estándar de Stripe (~1.5% + 0.25€)
                    </p>
                </div>
            </div>
        </div>
    );
}
