'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, Link } from '@/i18n/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Script from 'next/script';
import { API_URL } from '@/lib/api';

// Google Client ID from environment
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1045114177864-o4une38vcmmalc4l8rpdrkm8m0qv9i01.apps.googleusercontent.com';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google OAuth callback
  const handleGoogleCallback = async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Google login failed');
      }

      // Redirect to dashboard
      const locale = window.location.pathname.split('/')[1] || 'es';
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Initialize Google Identity Services when script loads
  const initializeGoogle = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Render the Google button
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        (window as any).google.accounts.id.renderButton(buttonDiv, {
          theme: 'filled_black',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'pill',
        });
      }
    }
  };


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    try {
      await login({ email, password });
      const locale = window.location.pathname.split('/')[1] || 'es';
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Google Identity Services SDK */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-4">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center">
              <img
                src="/kura-logo-dark.png"
                alt="KURA OS"
                className="h-24 w-auto"
              />
            </Link>
          </div>

          {/* Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-center text-white mb-6">Accede a tu cuenta</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">
                    Recordar sesión
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    {t('thinking')}
                  </>
                ) : (
                  <>
                    {t('login')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">O continúa con</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Google OAuth Button */}
            <div id="google-signin-button" className="hidden" />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).google) {
                  (window as any).google.accounts.id.prompt();
                }
              }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 border border-slate-700 text-white py-3 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 transition-all"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continuar con Google
            </button>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-center text-slate-400 text-sm">
                {t('dontHaveAccount')}{' '}
                <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  {t('register')}
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs mt-6">
            © 2025 KURA OS. Sistema Operativo para Terapeutas.
          </p>
        </div>
      </div>
    </>
  );
}
