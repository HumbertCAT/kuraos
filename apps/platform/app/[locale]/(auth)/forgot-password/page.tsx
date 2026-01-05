'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
                method: 'POST',
            });

            if (res.ok) {
                setSent(true);
            } else {
                const data = await res.json();
                setError(data.detail || 'Error al enviar email');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-brand/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center">
                        <img src="/kura-logo-dark.png" alt="KURA OS" className="h-24 w-auto" />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-white mb-2">¡Email enviado!</h1>
                            <p className="text-slate-400 mb-6">
                                Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-center text-white mb-2">Recuperar contraseña</h1>
                            <p className="text-slate-400 text-center text-sm mb-6">
                                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="tu@email.com"
                                        className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                                    ) : (
                                        'Enviar enlace'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-800">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver al login
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2025 KURA OS. Sistema Operativo para Terapeutas.
                </p>
            </div>
        </div>
    );
}
