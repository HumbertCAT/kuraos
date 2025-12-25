'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Settings, CreditCard, HelpCircle } from 'lucide-react';

const TABS = [
    { href: '/settings/general', label: 'Configuración', icon: Settings },
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
        if (pathname.includes('/settings/plan') || pathname.includes('/settings/billing')) return '/settings/plan';
        if (pathname.includes('/settings/help')) return '/settings/help';
        return '/settings/general';
    };

    const activeTab = getActiveTab();

    return (
        <div className="min-h-screen bg-muted py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Configuración
                    </h1>
                    <p className="mt-2 text-foreground/60">Gestiona tu cuenta, plan y obtén ayuda</p>
                </div>

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
        </div>
    );
}
