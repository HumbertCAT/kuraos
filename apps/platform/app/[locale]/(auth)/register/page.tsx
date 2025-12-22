'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, Link } from '@/i18n/navigation';
import { Mail, Lock, User, Building2, ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      org_name: formData.get('org_name') as string,
    };

    try {
      await register(payload);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden py-12">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img
              src="/kura-logo-dark.png"
              alt="KURA OS"
              className="h-24 w-auto"
            />
          </Link>
          <p className="text-slate-400 text-sm">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Free Tier Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Plan Builder - Gratis
            </span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6 text-white">{t('register')}</h1>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('organizationName')}</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  name="org_name"
                  type="text"
                  required
                  placeholder="Mi Consulta / Centro"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all caret-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all caret-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all caret-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all caret-emerald-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  {t('registering')}
                </>
              ) : (
                <>
                  {t('register')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-400 text-sm">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="text-slate-500 text-xs">
            <div className="text-emerald-400 font-bold text-lg mb-1">3</div>
            Pacientes gratis
          </div>
          <div className="text-slate-500 text-xs">
            <div className="text-emerald-400 font-bold text-lg mb-1">∞</div>
            Formularios
          </div>
          <div className="text-slate-500 text-xs">
            <div className="text-emerald-400 font-bold text-lg mb-1">0€</div>
            Para siempre
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 KURA OS. Sistema Operativo para Terapeutas.
        </p>
      </div>
    </div>
  );
}
