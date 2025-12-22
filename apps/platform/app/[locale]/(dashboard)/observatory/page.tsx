import {useTranslations} from 'next-intl';

export default function ObservatoryPage() {
  const t = useTranslations('Navigation');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('observatory')}</h1>
      <p className="text-slate-600">AI-powered patient insights coming soon.</p>
    </div>
  );
}
