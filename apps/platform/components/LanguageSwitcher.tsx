'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'ca', label: 'Català' },
  { code: 'it', label: 'Italiano' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    const newPath = pathname.replace(`/${locale}/`, `/${newLocale}/`);
    router.push(newPath);
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        className="appearance-none bg-muted border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-foreground cursor-pointer hover:bg-accent transition-colors"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <Globe size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
