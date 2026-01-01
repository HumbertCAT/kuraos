import { permanentRedirect } from 'next/navigation';

// Redirect /settings to /settings/general
// Since we're inside [locale]/(dashboard), relative navigation preserves locale
export default async function SettingsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    permanentRedirect(`/${locale}/settings/general`);
}
