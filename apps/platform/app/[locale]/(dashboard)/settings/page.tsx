import { permanentRedirect } from 'next/navigation';

// Redirect /settings to /settings/general
// Since we're inside [locale]/(dashboard), relative navigation preserves locale
export default function SettingsIndexPage({ params }: { params: { locale: string } }) {
    permanentRedirect(`/${params.locale}/settings/general`);
}
