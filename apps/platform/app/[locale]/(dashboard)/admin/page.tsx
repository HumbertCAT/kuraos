import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ locale: string }>;
}

/**
 * Admin root page - redirects to default section (AIGov)
 */
export default async function AdminPage({ params }: PageProps) {
    const { locale } = await params;
    redirect(`/${locale}/admin/aigov`);
}
