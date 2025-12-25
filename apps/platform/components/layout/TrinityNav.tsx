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
        <aside className="w-64 h-screen flex flex-col border-r border-sidebar-border bg-sidebar">
            {/* Header: Logo */}
            <div className="p-4 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center">
                    {/* Light logo version for light background */}
                    <img
                        src="/kura-logo-light.png"
                        alt="KURA OS"
                        className="h-12 w-auto dark:hidden"
                    />
                    {/* Dark logo version for dark background */}
                    <img
                        src="/kura-logo-dark.png"
                        alt="KURA OS"
                        className="h-12 w-auto hidden dark:block"
                    />
                </Link>
            </div>

            <div className="p-3">
                <button className="relative w-full flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-input border border-input-border rounded-md hover:bg-accent transition-all">
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Buscar...</span>
                    <kbd className="border border-input-border bg-background text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded-[3px]">⌘K</kbd>
                </button>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {sections.map((section) => (
                    <div key={section.title}>
                        <div className="flex items-center gap-2 px-2 mb-3">
                            {section.icon}
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {section.title}
                            </span>
                        </div>
                        {/* Nav Links - SMALLER */}
                        <ul className="space-y-0.5">
                            {section.items.filter(item => !item.comingSoon).map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${isActive(item.href)
                                            ? 'bg-brand/10 text-brand'
                                            : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
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
            <div className="p-3 border-t border-sidebar-border space-y-2">
                {/* Agents */}
                <Link
                    href="/settings/automations"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/automations')
                        ? 'bg-ai/10 text-ai'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Agentes
                </Link>
                {/* Settings */}
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isActive('/settings')
                        ? 'bg-brand/10 text-brand'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    {t('settings')}
                </Link>

                {/* User Profile + Actions */}
                {user && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/50 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user.full_name?.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {user.email?.split('@')[0] || 'User'}
                            </p>
                        </div>
                        <ThemeToggle />
                        <button
                            onClick={logout}
                            className="p-1.5 text-muted-foreground hover:text-risk transition-colors"
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
