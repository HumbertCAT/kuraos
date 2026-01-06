import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ locale: string }>;
}

/**
 * AIGov section root - redirects to financials (default sub-section)
 */
export default async function AiGovPage({ params }: PageProps) {
    const { locale } = await params;
    redirect(`/${locale}/admin/aigov/financials`);
}
