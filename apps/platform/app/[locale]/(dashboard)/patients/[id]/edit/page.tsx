'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Patient } from '@/types/auth';
import { ChevronDown, ChevronUp, User, Phone, HeartPulse, Sparkles } from 'lucide-react';
import CountrySelect from '@/components/CountrySelect';
import CityAutocomplete from '@/components/CityAutocomplete';

// Top languages for therapy context
const LANGUAGES = [
  { code: '', label: 'Not specified' },
  { code: 'ES', label: 'Español' },
  { code: 'CA', label: 'Català' },
  { code: 'EN', label: 'English' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'FR', label: 'Français' },
  { code: 'IT', label: 'Italiano' },
  { code: 'PT', label: 'Português' },
  { code: 'NL', label: 'Nederlands' },
  { code: 'RU', label: 'Русский' },
  { code: 'ZH', label: '中文' },
];

const GENDERS = [
  { value: '', label: 'No especificado' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'non_binary', label: 'No binario' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
];

const CONTACT_METHODS = [
  { value: '', label: 'No especificado' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  color = 'slate'
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorClasses: Record<string, { bg: string, border: string, icon: string }> = {
    slate: { bg: 'bg-slate-50', border: 'border-border', icon: 'text-foreground/60' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500' },
    fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', icon: 'text-fuchsia-500' },
  };

  const colors = colorClasses[color] || colorClasses.slate;

  return (
    <div className={`rounded-lg border ${colors.border}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-colors ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colors.icon}`} />
          <span className="font-medium text-slate-700">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-card border-t border-border rounded-b-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EditPatientPage() {
  const t = useTranslations('PatientForm');
  const tCommon = useTranslations('Common');
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Controlled state for country/city autocomplete
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [cityValue, setCityValue] = useState('');
  const [nationalityCountry, setNationalityCountry] = useState<string | null>(null);
  const [languageValue, setLanguageValue] = useState('');

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  async function loadPatient() {
    try {
      const data = await api.patients.get(patientId);
      setPatient(data);
      // Initialize country/city state from profile_data
      const profile = data.profile_data || {};
      setSelectedCountry(profile.country_code || null);
      setCityValue(profile.city || '');
      setSelectedCountry(profile.country_code || null);
      setCityValue(profile.city || '');
      setNationalityCountry(profile.nationality_code || null);
      setLanguageValue(data.language || '');
    } catch (error) {
      console.error('Failed to load patient', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    // Build profile_data object from form fields
    const profileData: Record<string, any> = {};

    // Personal data
    if (formData.get('gender')) profileData.gender = formData.get('gender');
    if (formData.get('pronouns')) profileData.pronouns = formData.get('pronouns');
    profileData.nationality_code = nationalityCountry || null;
    profileData.city = cityValue || null;
    profileData.country_code = selectedCountry || null;
    if (formData.get('occupation')) profileData.occupation = formData.get('occupation');

    // Contact
    if (formData.get('preferred_contact')) profileData.preferred_contact = formData.get('preferred_contact');
    if (formData.get('instagram')) profileData.instagram = formData.get('instagram');
    if (formData.get('linkedin')) profileData.linkedin = formData.get('linkedin');
    if (formData.get('emergency_contact_name')) profileData.emergency_contact_name = formData.get('emergency_contact_name');
    if (formData.get('emergency_contact_phone')) profileData.emergency_contact_phone = formData.get('emergency_contact_phone');

    // Clinical
    if (formData.get('referral_source')) profileData.referral_source = formData.get('referral_source');
    profileData.previous_therapy = formData.get('previous_therapy') === 'true';
    if (formData.get('current_medications')) profileData.current_medications = formData.get('current_medications');
    if (formData.get('medical_conditions')) profileData.medical_conditions = formData.get('medical_conditions');
    if (formData.get('goals')) profileData.goals = formData.get('goals');
    if (formData.get('notes')) profileData.notes = formData.get('notes');

    const payload = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      language: languageValue || null,
      birth_date: formData.get('birth_date') ? new Date(formData.get('birth_date') as string).toISOString() : null,
      birth_time: formData.get('birth_time') as string || null,
      birth_place: formData.get('birth_place') as string || null,
      profile_data: profileData,
      profile_image_url: formData.get('profile_image_url') as string || null,
    };

    try {
      const updatedPatient = await api.patients.update(patientId, payload);
      setPatient(updatedPatient);
      // Optional: Add a success message or toast here if you had a toast system
      // For now, scroll to top to show 'saved' state if implemented or just stay
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground/60">{tCommon('loading')}</div>;
  }

  if (!patient) {
    return <div className="text-center py-12 text-foreground/60">{t('notFound')}</div>;
  }

  // Get profile data with defaults
  const profile = patient.profile_data || {};

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6 font-headline">{t('editPatient')}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info - Always visible */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-foreground/60" />
            Datos Básicos
          </h2>

          {/* Profile Photo */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="relative">
              {patient.profile_image_url ? (
                <img
                  src={patient.profile_image_url}
                  alt={`${patient.first_name} ${patient.last_name}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold">
                  {patient.first_name?.[0]}{patient.last_name?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil (URL)</label>
              <input
                name="profile_image_url"
                type="url"
                placeholder="https://ejemplo.com/foto.jpg"
                defaultValue={patient.profile_image_url || ''}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Pega la URL de una imagen de perfil</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')} *</label>
                <input
                  name="first_name"
                  type="text"
                  required
                  defaultValue={patient.first_name}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')} *</label>
                <input
                  name="last_name"
                  type="text"
                  required
                  defaultValue={patient.last_name}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={patient.email || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={patient.phone || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
              <select
                name="language"
                value={languageValue}
                onChange={(e) => setLanguageValue(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground bg-card"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Personal Data Section - Collapsible */}
        <CollapsibleSection title="Datos Personales" icon={User} color="violet">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select
                  name="gender"
                  defaultValue={profile.gender || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground bg-card"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pronombres</label>
                <input
                  name="pronouns"
                  type="text"
                  placeholder="él/ella/elle"
                  defaultValue={profile.pronouns || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                <input
                  name="birth_date"
                  type="date"
                  defaultValue={patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Nacimiento</label>
                <input
                  name="birth_time"
                  type="time"
                  defaultValue={patient.birth_time || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lugar Nacimiento</label>
                <input
                  name="birth_place"
                  type="text"
                  placeholder="Ciudad, País"
                  defaultValue={patient.birth_place || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                <CountrySelect
                  value={nationalityCountry || undefined}
                  onChange={setNationalityCountry}
                  placeholder="Seleccionar nacionalidad..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
                <input
                  name="occupation"
                  type="text"
                  placeholder="Ej: Diseñadora"
                  defaultValue={profile.occupation || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País de Residencia</label>
                <CountrySelect
                  value={selectedCountry || undefined}
                  onChange={(code) => {
                    setSelectedCountry(code);
                    setCityValue(''); // Reset city when country changes
                  }}
                  placeholder="Seleccionar país..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <CityAutocomplete
                  value={cityValue}
                  onChange={setCityValue}
                  countryCode={selectedCountry}
                  placeholder="Buscar ciudad..."
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Contact & Social Section - Collapsible */}
        <CollapsibleSection title="Contacto y Redes" icon={Phone} color="emerald">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de contacto preferido</label>
              <select
                name="preferred_contact"
                defaultValue={profile.preferred_contact || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground bg-card"
              >
                {CONTACT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  name="instagram"
                  type="text"
                  placeholder="@usuario"
                  defaultValue={profile.instagram || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  name="linkedin"
                  type="text"
                  placeholder="URL o username"
                  defaultValue={profile.linkedin || ''}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground/70 mb-3">Contacto de Emergencia</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    name="emergency_contact_name"
                    type="text"
                    placeholder="Nombre completo"
                    defaultValue={profile.emergency_contact_name || ''}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    name="emergency_contact_phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    defaultValue={profile.emergency_contact_phone || ''}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Clinical Info Section - Collapsible */}
        <CollapsibleSection title="Información Clínica" icon={HeartPulse} color="fuchsia">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo me encontraste?</label>
              <input
                name="referral_source"
                type="text"
                placeholder="Ej: Instagram, recomendación de amigo, Google..."
                defaultValue={profile.referral_source || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Ha hecho terapia anteriormente?</label>
              <select
                name="previous_therapy"
                defaultValue={profile.previous_therapy === true ? 'true' : profile.previous_therapy === false ? 'false' : ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground bg-card"
              >
                <option value="">No especificado</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos actuales</label>
              <textarea
                name="current_medications"
                rows={2}
                placeholder="Lista de medicamentos que toma actualmente..."
                defaultValue={profile.current_medications || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones médicas relevantes</label>
              <textarea
                name="medical_conditions"
                rows={2}
                placeholder="Alergias, condiciones crónicas, etc..."
                defaultValue={profile.medical_conditions || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos / ¿Qué espera lograr?</label>
              <textarea
                name="goals"
                rows={3}
                placeholder="Los objetivos del paciente para el proceso terapéutico..."
                defaultValue={profile.goals || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas (solo terapeuta)</label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Notas privadas del terapeuta..."
                defaultValue={profile.notes || ''}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none text-foreground resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Action buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-3 rounded-lg hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 transition-colors font-medium shadow-lg shadow-fuchsia-200"
          >
            {saving ? t('saving') : t('save')}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/patients/${patientId}`)}
            className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
          >
            {t('cancel')}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Zona de Peligro</h3>
        <p className="text-sm text-red-600 mb-4">
          Eliminar este paciente borrará permanentemente todos sus datos incluyendo entradas clínicas y formularios.
        </p>
        <button
          type="button"
          onClick={async () => {
            if (!confirm(t('confirmDelete'))) return;
            try {
              await api.patients.delete(patientId);
              router.push('/patients');
            } catch (err) {
              console.error('Failed to delete patient', err);
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {t('delete')}
        </button>
      </div>

      {/* GeoNames Attribution - CC BY 4.0 */}
      <p className="mt-6 text-xs text-slate-400 text-center">
        Geographic data © <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground/70">GeoNames</a>
      </p>
    </div >
  );
}
