'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Database, Route, DollarSign, Activity } from 'lucide-react';

const AIGOV_SECTIONS = [
    { key: 'models', label: 'Models', icon: Database, href: '/admin/aigov/models' },
    { key: 'routing', label: 'Routing', icon: Route, href: '/admin/aigov/routing' },
    { key: 'financials', label: 'Financials', icon: DollarSign, href: '/admin/aigov/financials' },
    { key: 'activity', label: 'Activity', icon: Activity, href: '/admin/aigov/activity' },
];

export default function AiGovLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Extract sub-section from pathname (e.g., /en/admin/aigov/models → models)
    const currentSubSection = pathname.split('/aigov/')[1]?.split('/')[0] || 'models';

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <nav className="flex gap-2 border-b border-border pb-4">
                {AIGOV_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = currentSubSection === section.key;

                    return (
                        <Link
                            key={section.key}
                            href={section.href}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive
                                    ? 'bg-brand/10 text-brand border border-brand/30'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {section.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Page Content */}
            <div>{children}</div>
        </div>
    );
}
