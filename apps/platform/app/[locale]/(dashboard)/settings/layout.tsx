'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Settings, CreditCard, Palette, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const TABS = [
    { href: '/settings/general', labelKey: 'tabGeneral', icon: Settings },
    { href: '/settings/referrals', labelKey: 'tabReferrals', icon: Sparkles },
    { href: '/settings/appearance', labelKey: 'tabAppearance', icon: Palette },
    { href: '/settings/plan', labelKey: 'tabPlan', icon: CreditCard },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const t = useTranslations('Settings');

    // Determine active tab from pathname
    const getActiveTab = () => {
        if (pathname.includes('/settings/referrals')) return '/settings/referrals';
        if (pathname.includes('/settings/appearance')) return '/settings/appearance';
        if (pathname.includes('/settings/plan') || pathname.includes('/settings/billing')) return '/settings/plan';
        return '/settings/general';
    };

    const activeTab = getActiveTab();

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Settings}
                title={t('title')}
                subtitle={t('subtitle')}
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
                                <span>{t(tab.labelKey)}</span>
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
