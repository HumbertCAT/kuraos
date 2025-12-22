'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { User, Globe, Link2, ExternalLink, Unlink, MapPin, Phone, MessageCircle, Zap, Shield } from 'lucide-react';
import CountrySelect from '@/components/CountrySelect';
import CityAutocomplete from '@/components/CityAutocomplete';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

const AI_OUTPUT_OPTIONS = [
  { value: 'AUTO', label: 'Auto (Patient\'s Language)', icon: '🌐' },
  { value: 'SPANISH', label: 'Español', icon: '🇪🇸' },
  { value: 'ENGLISH', label: 'English', icon: '🇬🇧' },
];

const LOCALE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'ca', label: 'Català' },
];

interface GoogleIntegration {
  connected: boolean;
  calendar_id?: string;
  sync_bookings?: boolean;
  check_busy?: boolean;
}

interface GoogleCalendarInfo {
  id: string;
  name: string;
  primary: boolean;
}

interface ScheduleSyncInfo {
  schedule_id: string;
  schedule_name: string;
  blocking_calendar_ids: string[];
  booking_calendar_id: string;
  sync_enabled: boolean;
}

interface FullIntegrationStatus {
  connected: boolean;
  provider: string;
  google_calendars: GoogleCalendarInfo[];
  schedule_syncs: ScheduleSyncInfo[];
}

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();


  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [googleIntegration, setGoogleIntegration] = useState<GoogleIntegration | null>(null);
  const [fullStatus, setFullStatus] = useState<FullIntegrationStatus | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [youtube, setYoutube] = useState('');

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const [locale, setLocale] = useState('es');
  const [aiOutputPreference, setAiOutputPreference] = useState<string>('AUTO');

  // Track if we have initialized from user data to prevent overwriting edits
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    // Only initialize ONCE when user becomes available. 
    // Never re-run this logic even if user object updates, to prevent overwriting unsaved work.
    if (user && !dataLoadedRef.current) {

      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setWebsite(user.website || '');
      setCountry(user.country || '');
      setCity(user.city || ''); // If city comes as dict, UserResponse schema should have handled it, assuming string now

      if (user.social_media) {
        setInstagram(user.social_media.instagram || '');
        setLinkedin(user.social_media.linkedin || '');
        setYoutube(user.social_media.youtube || '');
      }
      setLocale(user.locale || 'es');
      if (user.ai_output_preference) {
        setAiOutputPreference(user.ai_output_preference as string);
      }

      dataLoadedRef.current = true;
    }
  }, [user]);

  // Effect for Google status and integration success callback
  useEffect(() => {
    loadGoogleStatus();

    // Check for integration success callback
    if (searchParams.get('integration') === 'success') {
      setSuccess('Google Calendar connected successfully! 🎉');
      loadGoogleStatus();
    }
  }, [user, searchParams]);

  async function loadGoogleStatus() {
    try {
      // First check basic status
      const statusRes = await fetch(`${API_URL}/integrations/google/status`, {
        credentials: 'include',
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setGoogleIntegration(statusData);

        // If connected, load full status with schedules
        if (statusData.connected) {
          const fullRes = await fetch(`${API_URL}/integrations/google/full-status`, {
            credentials: 'include',
          });
          if (fullRes.ok) {
            const fullData = await fullRes.json();
            setFullStatus(fullData);
          }
        } else {
          setFullStatus(null);
        }
      }
    } catch (err) {
      console.error('Failed to load Google status:', err);
    }
  }

  async function handleConnectGoogle() {
    setLoadingGoogle(true);
    try {
      const res = await fetch(`${API_URL}/integrations/google/authorize`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect to Google OAuth
        window.location.href = data.authorization_url;
      } else {
        setError('Failed to start Google authorization');
      }
    } catch (err) {
      setError('Failed to connect to Google');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleDisconnectGoogle() {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

    setLoadingGoogle(true);
    try {
      const res = await fetch(`${API_URL}/integrations/google`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setGoogleIntegration({ connected: false });
        setSuccess('Google Calendar disconnected');
      } else {
        setError('Failed to disconnect Google Calendar');
      }
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setSaving(true);
    setSuccess('');


    try {
      const updatedUser = await api.user.updatePreferences({
        full_name: fullName,
        phone,
        website,
        country,
        city,
        locale,
        ai_output_preference: aiOutputPreference,
      });
      await updateUser(updatedUser);
      setSuccess(t('saveSuccess') || 'Ajustes guardados correctamente');
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Alerts */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">✅</span>
          <span className="text-emerald-700 font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <span className="text-red-700 font-medium">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('profile') || 'Perfil'}</h2>
                <p className="text-slate-300 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  {t('fullName') || 'Nombre completo'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">👤</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-800 transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              {/* Email (Read only) */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  {t('email') || 'Email'}
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-lg">📧</span>
                  <span className="text-slate-600">{user?.email || '—'}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-800 transition-all"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Página web
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-800 transition-all"
                    placeholder="https://tupaigina.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  País
                </label>
                <CountrySelect
                  value={country}
                  onChange={(code) => {
                    setCountry(code || '');
                    setCity(''); // Reset city when country changes
                  }}
                  placeholder="Seleccionar país..."
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Ciudad
                </label>
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  countryCode={country}
                  placeholder="Buscar ciudad..."
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 mt-2">
              <p className="text-xs text-slate-400 italic mb-2">
                Estos datos se mostrarán en tu página de reservas pública.
              </p>
              <p className="text-xs text-slate-300 text-center">
                Geographic data © <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500">GeoNames</a>
              </p>
            </div>

          </div>
        </div>

        {/* Interface Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Preferencias de Interfaz</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  {t('interfaceLanguage') || 'Idioma del Panel'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🌐</span>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-800 transition-all appearance-none bg-white cursor-pointer"
                  >
                    {LOCALE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terminology Preference - TODO: Wire up to organization settings */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Terminología de clientes
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">👥</span>
                  <select
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-800 transition-all appearance-none bg-slate-50 cursor-not-allowed"
                  >
                    <option value="CLIENT">Cliente (Coaching)</option>
                    <option value="PATIENT">Paciente (Clínico)</option>
                    <option value="CONSULTANT">Consultante (Holístico)</option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Determina cómo se llama a tus clientes en la UI. Próximamente editable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Preferences Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('aiPreferences') || 'Preferencias IA'}</h2>
                <p className="text-emerald-200 text-sm">Personaliza como genera contenido la IA</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">
                  {t('aiOutputLanguage') || 'Idioma de salida IA'}
                </label>
                <div className="space-y-2">
                  {AI_OUTPUT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${aiOutputPreference === opt.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="aiOutput"
                        value={opt.value}
                        checked={aiOutputPreference === opt.value}
                        onChange={(e) => setAiOutputPreference(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-medium text-slate-800">{opt.label}</span>
                      {aiOutputPreference === opt.value && (
                        <span className="ml-auto text-emerald-600">✓</span>
                      )}
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {t('aiOutputLanguageHelp') || 'Elige el idioma en el que la IA generará resúmenes y análisis.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Link2 className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-lg font-semibold text-white">Integraciones</h2>
                <p className="text-blue-200 text-sm">Conecta servicios externos</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Google Calendar */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-9 h-9">
                      <path fill="#4285F4" d="M22.46 10.68h-10.5v3.32h6c-.26 1.38-1.04 2.54-2.2 3.32l3.56 2.76c2.08-1.92 3.28-4.74 3.28-8.1 0-.56-.04-1.1-.14-1.6z" />
                      <path fill="#34A853" d="M11.96 23c2.98 0 5.48-.98 7.3-2.66l-3.56-2.76c-.98.66-2.24 1.04-3.74 1.04-2.88 0-5.32-1.94-6.2-4.56H2.08v2.86C3.88 20.92 7.64 23 11.96 23z" />
                      <path fill="#FBBC05" d="M5.76 14.06c-.22-.66-.34-1.36-.34-2.08s.12-1.42.34-2.08V7.04H2.08C1.38 8.42 1 9.96 1 11.98s.38 3.56 1.08 4.94l3.68-2.86z" />
                      <path fill="#EA4335" d="M11.96 4.78c1.62 0 3.08.56 4.22 1.66l3.16-3.16C17.42 1.38 14.92.38 11.96.38 7.64.38 3.88 2.46 2.08 6.46l3.68 2.86c.88-2.62 3.32-4.54 6.2-4.54z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Google Calendar</h3>
                    <p className="text-sm text-slate-500">
                      {fullStatus?.connected
                        ? '✓ Estás conectado con Google Calendar'
                        : 'Conecta tu cuenta de Google Calendar para sincronizar reservas y bloquear disponibilidad'
                      }
                    </p>
                  </div>
                </div>

                {fullStatus?.connected ? (
                  <button
                    onClick={handleDisconnectGoogle}
                    disabled={loadingGoogle}
                    className="px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Unlink className="w-4 h-4" />
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={loadingGoogle}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 shadow-sm"
                  >
                    {loadingGoogle ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Conectar
                  </button>
                )}
              </div>

              {fullStatus?.connected && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Una vez conectado, puedes configurar la sincronización en:
                  </p>
                  <ul className="mt-2 text-sm text-slate-500 space-y-1">
                    <li>📅 <strong>Calendario</strong> → Pestaña "Google Calendar" para bloquear disponibilidad</li>
                    <li>🎯 <strong>Servicios</strong> → En cada servicio, elige dónde enviar las reservas</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Tools (superuser only) */}
        {user?.is_superuser && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Admin Tools</h2>
                  <p className="text-amber-100 text-sm">Herramientas de administración del sistema</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Force Conversation Analysis */}
              <div className="p-5 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Forzar Análisis AletheIA</h3>
                      <p className="text-sm text-slate-500">
                        Ejecuta el análisis de conversaciones WhatsApp inmediatamente para todas las fichas con mensajes nuevos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await fetch(`${API_URL}/admin/trigger-conversation-analysis`, {
                          method: 'POST',
                          credentials: 'include',
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSuccess(`✅ Análisis completado: ${data.result?.analyzed || 0} fichas analizadas`);
                        } else {
                          setError('Error al ejecutar análisis');
                        }
                      } catch (err) {
                        setError('Error de conexión');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 shadow-sm"
                  >
                    {loading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Ejecutar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-300 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                {t('saving') || 'Guardando...'}
              </>
            ) : (
              <>
                <span>💾</span>
                {t('savePreferences') || 'Guardar Ajustes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
