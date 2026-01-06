import { redirect } from 'next/navigation';

interface PageProps {
    params: { locale: string };
}

/**
 * AIGov section root - redirects to models sub-section
 */
export default function AiGovPage({ params }: PageProps) {
    redirect(`/${params.locale}/admin/aigov/models`);
}
