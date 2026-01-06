import { redirect } from 'next/navigation';

interface PageProps {
    params: { locale: string };
}

/**
 * Admin root page - redirects to default section (AIGov)
 */
export default function AdminPage({ params }: PageProps) {
    redirect(`/${params.locale}/admin/aigov`);
}
