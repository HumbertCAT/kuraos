'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useTerminology } from '@/hooks/use-terminology';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    Users,
    FileText,
    Calendar,
    Briefcase,
    Settings,
    LogOut,
    Sparkles,
    Search,
    Flame,
    Stethoscope,
    // Sprout, // For NURTURE section (future)
    ChevronDown,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    comingSoon?: boolean;
}

interface NavSection {
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
}

export function TrinityNav() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const terminology = useTerminology();
    const t = useTranslations('Navigation');
    const tAuth = useTranslations('Auth');

    const sections: NavSection[] = [
        {
            title: 'ENGAGE',
            icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
            items: [
                { href: '/leads', label: 'CRM', icon: <Users className="w-4 h-4" /> },
                { href: '/forms', label: t('forms'), icon: <FileText className="w-4 h-4" /> },
                // { href: '/inbox', label: 'Inbox', icon: <Inbox />, comingSoon: true },
                // { href: '/network', label: 'Network', icon: <Network />, comingSoon: true },
            ],
        },
        {
            title: 'PRACTICE',
            icon: <Stethoscope className="w-3.5 h-3.5 text-teal-500" />,
            items: [
                { href: '/calendar', label: t('calendar'), icon: <Calendar className="w-4 h-4" /> },
                { href: '/patients', label: terminology.plural, icon: <Users className="w-4 h-4" /> },
                { href: '/services', label: t('services'), icon: <Briefcase className="w-4 h-4" /> },
            ],
        },
        // NURTURE section - Coming Soon (Q2-Q3 2026)
        // {
        //   title: 'NURTURE',
        //   icon: <Sprout className="w-3.5 h-3.5 text-emerald-500" />,
        //   items: [
        //     { href: '/memberships', label: 'Membresías', icon: <CreditCard />, comingSoon: true },
        //     { href: '/pharmacy', label: 'Farmacia', icon: <Pill />, comingSoon: true },
        //     { href: '/capsules', label: 'Cápsulas', icon: <Clock />, comingSoon: true },
        //   ],
        // },
    ];

    const isActive = (href: string) => pathname.includes(href);

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-border-subtle bg-surface">
            {/* Header: Logo */}
            <div className="p-4 border-b border-border-subtle">
                <Link href="/dashboard" className="flex items-center">
                    <img
                        src="/kura-logo-light.png"
                        alt="KURA OS"
                        className="h-12 w-auto dark:hidden"
                    />
                    <img
                        src="/kura-logo-dark.png"
                        alt="KURA OS"
                        className="h-12 w-auto hidden dark:block dark:brightness-0 dark:invert"
                    />
                </Link>
            </div>

            {/* Search Placeholder */}
            <div className="p-3">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Buscar...</span>
                    <kbd className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {sections.map((section) => (
                    <div key={section.title}>
                        <div className="flex items-center gap-1.5 px-2 mb-2">
                            {section.icon}
                            <span className="font-display text-[10px] uppercase tracking-widest text-zinc-500">
                                {section.title}
                            </span>
                        </div>
                        <ul className="space-y-0.5">
                            {section.items.filter(item => !item.comingSoon).map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive(item.href)
                                            ? 'bg-brand/10 text-brand dark:bg-brand/20'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer: Agents + Settings + User */}
            <div className="p-3 border-t border-border-subtle space-y-2">
                {/* Agents */}
                <Link
                    href="/settings/automations"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/automations')
                        ? 'bg-ai/10 text-ai dark:bg-ai/20'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Agentes
                </Link>
                {/* Settings */}
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/settings')
                        ? 'bg-brand/10 text-brand dark:bg-brand/20'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    {t('settings')}
                </Link>

                {/* User Profile + Actions */}
                {user && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {user.full_name?.split(' ')[0]}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {user.email?.split('@')[0] || 'User'}
                            </p>
                        </div>
                        <ThemeToggle />
                        <button
                            onClick={logout}
                            className="p-1.5 text-zinc-400 hover:text-risk transition-colors"
                            title={tAuth('logout')}
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
