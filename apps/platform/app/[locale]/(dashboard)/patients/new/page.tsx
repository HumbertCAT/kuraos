'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import DuplicateWarningModal from '@/components/DuplicateWarningModal';

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
  { code: 'JA', label: '日本語' },
  { code: 'KO', label: '한국어' },
  { code: 'AR', label: 'العربية' },
  { code: 'HE', label: 'עברית' },
  { code: 'PL', label: 'Polski' },
  { code: 'TR', label: 'Türkçe' },
  { code: 'SV', label: 'Svenska' },
  { code: 'DA', label: 'Dansk' },
  { code: 'NO', label: 'Norsk' },
  { code: 'FI', label: 'Suomi' },
];

// Duplicate detection response type
interface DuplicateInfo {
  found: boolean;
  identity_id?: string;
  primary_email?: string | null;
  primary_phone?: string | null;
  linked_entity?: {
    type: 'lead' | 'patient';
    name: string;
    id: string;
  } | null;
}

export default function NewPatientPage() {
  const t = useTranslations('PatientForm');
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingPayloadRef = useRef<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      language: formData.get('language') as string || null,
    };

    // Store payload for potential use after duplicate check
    pendingPayloadRef.current = payload;

    try {
      // v1.6.4: Check for duplicates before creating
      if (payload.email || payload.phone) {
        const check = await api.contacts.check(payload.email || undefined, payload.phone || undefined);
        if (check.found) {
          // Show duplicate warning modal instead of creating
          setDuplicateInfo(check as DuplicateInfo);
          setLoading(false);
          return;
        }
      }

      // No duplicate found - proceed with creation
      await createPatient(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
      setLoading(false);
    }
  }

  async function createPatient(payload: any) {
    try {
      const patient = await api.patients.create(payload);

      // Trigger Onboarding Completion
      if (typeof window !== 'undefined') {
        localStorage.setItem('kura_onboarding_stage', '1');
        window.dispatchEvent(new Event('kura_mission_complete'));
      }

      router.push(`/patients/${patient.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
      setLoading(false);
    }
  }

  // Handle "Create Anyway" from duplicate warning modal
  function handleCreateAnyway() {
    setDuplicateInfo(null);
    if (pendingPayloadRef.current) {
      setLoading(true);
      createPatient(pendingPayloadRef.current);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('newPatient')}</h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t('firstName')} {t('required')}
            </label>
            <input
              name="first_name"
              type="text"
              required
              data-tour="input-name"
              className="w-full p-3 border border-input-border bg-input rounded-lg focus:ring-2 focus:ring-ring outline-none text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t('lastName')} {t('required')}
            </label>
            <input
              name="last_name"
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t('email')}</label>
          <input
            name="email"
            type="email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t('phone')}</label>
          <input
            name="phone"
            type="tel"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t('language')}</label>
          <select
            name="language"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-foreground bg-card"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-95"
          >
            {loading ? t('creating') : t('create')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/patients')}
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground active:scale-95"
          >
            {t('cancel')}
          </button>
        </div>
      </form>

      {/* v1.6.4: Duplicate Warning Modal */}
      {duplicateInfo && (
        <DuplicateWarningModal
          duplicate={duplicateInfo as Required<DuplicateInfo>}
          onViewExisting={() => setDuplicateInfo(null)}
          onCreateAnyway={handleCreateAnyway}
          onCancel={() => setDuplicateInfo(null)}
        />
      )}
    </div>
  );
}
