import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'ca', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({ locales });
