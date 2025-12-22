'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';

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

export default function NewPatientPage() {
  const t = useTranslations('PatientForm');
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    try {
      const patient = await api.patients.create(payload);
      router.push(`/patients/${patient.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('newPatient')}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('firstName')} {t('required')}
            </label>
            <input
              name="first_name"
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('lastName')} {t('required')}
            </label>
            <input
              name="last_name"
              type="text"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input
            name="email"
            type="email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
          <input
            name="phone"
            type="tel"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
          <select
            name="language"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900 bg-white"
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
            className="flex-1 bg-slate-800 text-white p-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('creating') : t('create')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/patients')}
            className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
