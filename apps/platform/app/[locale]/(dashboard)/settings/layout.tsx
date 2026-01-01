'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Settings, CreditCard, HelpCircle, Palette } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const TABS = [
    { href: '/settings/general', label: 'Configuración', icon: Settings },
    { href: '/settings/appearance', label: 'Apariencia', icon: Palette },
    { href: '/settings/plan', label: 'Mi Plan', icon: CreditCard },
    { href: '/settings/help', label: 'Ayuda', icon: HelpCircle },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Determine active tab from pathname
    const getActiveTab = () => {
        if (pathname.includes('/settings/appearance')) return '/settings/appearance';
        if (pathname.includes('/settings/plan') || pathname.includes('/settings/billing')) return '/settings/plan';
        if (pathname.includes('/settings/help')) return '/settings/help';
        return '/settings/general';
    };

    const activeTab = getActiveTab();

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Settings}
                title="Configuración"
                subtitle="Gestiona tu cuenta, plan y obtén ayuda"
            />

            {/* Tab Navigation */}
            <div className="mb-8">
                <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {children}
            </div>
        </div>
    );
}
