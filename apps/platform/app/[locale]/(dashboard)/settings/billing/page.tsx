'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    CreditCard,
    Check,
    Sparkles,
    Building2,
    Zap,
    ExternalLink,
    Loader2,
    Crown
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

import { API_URL } from '@/lib/api';

interface BillingStatus {
    tier: string;
    has_subscription: boolean;
    stripe_publishable_key: string | null;
}

export default function BillingPage() {
    const t = useTranslations('Settings');

    const [status, setStatus] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchBillingStatus();

        // Check URL params for success/cancel
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            setMessage({ type: 'success', text: '¡Suscripción actualizada correctamente!' });
        } else if (params.get('canceled')) {
            setMessage({ type: 'error', text: 'Pago cancelado.' });
        }
    }, []);

    const fetchBillingStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/billing/status`, {
                credentials: 'include',
            });
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch billing status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (tier: string) => {
        setActionLoading(tier);
        try {
            const res = await fetch(`${API_URL}/billing/checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ target_tier: tier }),
            });

            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Error al crear sesión de pago' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        setActionLoading('portal');
        try {
            const res = await fetch(`${API_URL}/billing/portal`, {
                method: 'POST',
                credentials: 'include',
            });

            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Error al abrir portal' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setActionLoading(null);
        }
    };

    const plans = [
        {
            id: 'BUILDER',
            name: 'Builder',
            price: 'Gratis',
            description: 'Tu consulta digital, organizada.',
            features: ['3 pacientes activos', 'Formularios ilimitados', 'Calendario y reservas', 'Soul Record básico'],
            current: status?.tier === 'BUILDER',
            icon: Zap,
        },
        {
            id: 'PRO',
            name: 'Pro',
            price: '49€',
            period: '/mes',
            description: 'Tu copiloto clínico.',
            features: ['50 pacientes activos', 'AletheIA Insights', 'Automatizaciones básicas', 'Timeline clínico completo', 'Soporte prioritario'],
            current: status?.tier === 'PRO',
            popular: true,
            icon: Sparkles,
        },
        {
            id: 'CENTER',
            name: 'Center',
            price: '149€',
            period: '/mes',
            description: 'La máquina de operaciones.',
            features: ['150 pacientes activos', 'Automatizaciones ilimitadas', 'Risk Shield™', 'WhatsApp Sync', 'Multi-usuario + roles'],
            current: status?.tier === 'CENTER',
            icon: Building2,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <SectionHeader
                icon={CreditCard}
                title="Facturación"
                subtitle="Gestiona tu suscripción y método de pago"
                gradientFrom="emerald-500"
                gradientTo="teal-600"
                shadowColor="emerald-500/25"
            />

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Current Plan Badge */}
            <div className="card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Crown className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Plan Actual</h3>
                            <p className="text-foreground/60">
                                {status?.tier === 'BUILDER' && 'Builder (Gratis)'}
                                {status?.tier === 'PRO' && 'Pro (49€/mes)'}
                                {status?.tier === 'CENTER' && 'Center (149€/mes)'}
                            </p>
                        </div>
                    </div>

                    {status?.has_subscription && (
                        <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading === 'portal'}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'portal' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ExternalLink className="w-4 h-4" />
                            )}
                            Gestionar Suscripción
                        </button>
                    )}
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative card rounded-2xl p-6 border-2 transition-all ${plan.current
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : plan.popular
                                ? 'border-emerald-200'
                                : 'border-border'
                            }`}
                    >
                        {plan.popular && !plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                                Popular
                            </div>
                        )}

                        {plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                                Plan Actual
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <div className={`inline-flex p-3 rounded-xl mb-4 ${plan.current ? 'bg-emerald-100' : 'bg-muted'}`}>
                                <plan.icon className={`w-6 h-6 ${plan.current ? 'text-emerald-600' : 'text-foreground/70'}`} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                            <p className="text-foreground/60 text-sm mt-1">{plan.description}</p>
                        </div>

                        <div className="text-center mb-6">
                            <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                            {plan.period && <span className="text-foreground/60">{plan.period}</span>}
                        </div>

                        <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-foreground/70">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {plan.current ? (
                            <button
                                disabled
                                className="w-full py-3 bg-muted text-muted-foreground font-medium rounded-xl cursor-not-allowed"
                            >
                                Plan Actual
                            </button>
                        ) : plan.id === 'BUILDER' ? (
                            <button
                                disabled
                                className="w-full py-3 border border-border text-muted-foreground font-medium rounded-xl cursor-not-allowed"
                            >
                                Plan Gratuito
                            </button>
                        ) : (
                            <button
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={actionLoading === plan.id}
                                className={`w-full py-3 font-semibold rounded-xl transition-colors disabled:opacity-50 ${plan.popular
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'border border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                {actionLoading === plan.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    `Upgrade a ${plan.name}`
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
