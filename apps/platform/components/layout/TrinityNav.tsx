'use client';

import { useState, useEffect } from 'react';
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
    Sprout,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Megaphone,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    comingSoon?: boolean;
}

interface NavSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
}

const STORAGE_KEY = 'trinity-nav-collapsed';

export function TrinityNav() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const terminology = useTerminology();
    const t = useTranslations('Navigation');
    const tAuth = useTranslations('Auth');

    // Collapse state with localStorage persistence
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') setIsCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem(STORAGE_KEY, String(newState));
    };

    const sections: NavSection[] = [
        {
            id: 'ops',
            title: 'OPS',
            icon: <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />,
            items: [
                { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                { href: '/calendar', label: t('calendar'), icon: <Calendar className="w-4 h-4" /> },
                { href: '/leads', label: 'CRM', icon: <Users className="w-4 h-4" /> },
            ],
        },
        {
            id: 'practice',
            title: 'PRACTICE',
            icon: <Stethoscope className="w-3.5 h-3.5 text-teal-500" />,
            items: [
                { href: '/patients', label: terminology.plural, icon: <Users className="w-4 h-4" /> },
                { href: '/forms', label: t('forms'), icon: <FileText className="w-4 h-4" /> },
                { href: '/services', label: t('services'), icon: <Briefcase className="w-4 h-4" /> },
            ],
        },
        {
            id: 'growth',
            title: 'GROWTH',
            icon: <Sprout className="w-3.5 h-3.5 text-emerald-500" />,
            items: [
                { href: '/nurture', label: 'Nurture', icon: <Sprout className="w-4 h-4" />, comingSoon: true },
                { href: '/campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4" />, comingSoon: true },
            ],
        },
    ];

    const systemItems: NavItem[] = [
        { href: '/settings/automations', label: 'Agentes', icon: <Sparkles className="w-4 h-4" /> },
        { href: '/settings', label: t('settings'), icon: <Settings className="w-4 h-4" /> },
    ];

    const isActive = (href: string) => pathname.includes(href);

    if (!mounted) return null;

    return (
        <aside
            className={`h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Header: Logo */}
            <div className={`p-4 border-b border-sidebar-border ${isCollapsed ? 'flex justify-center' : ''}`}>
                <Link href="/dashboard" className="flex items-center justify-center">
                    {isCollapsed ? (
                        // Icon only when collapsed
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                            <span className="text-brand font-bold text-sm">K</span>
                        </div>
                    ) : (
                        <>
                            <img src="/kura-logo-light.png" alt="KURA OS" className="h-10 w-auto dark:hidden" />
                            <img src="/kura-logo-dark.png" alt="KURA OS" className="h-10 w-auto hidden dark:block" />
                        </>
                    )}
                </Link>
            </div>

            {/* Search - hidden when collapsed */}
            {!isCollapsed && (
                <div className="p-3">
                    <button className="relative w-full flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-input border border-input-border rounded-md hover:bg-accent transition-all">
                        <Search className="w-4 h-4" />
                        <span className="flex-1 text-left">Buscar...</span>
                        <kbd className="border border-input-border bg-background text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded-[3px]">⌘K</kbd>
                    </button>
                </div>
            )}

            {/* Navigation Sections */}
            <nav className={`flex-1 overflow-y-auto py-2 space-y-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                {sections.map((section) => (
                    <div key={section.id}>
                        {/* Section Header */}
                        {!isCollapsed && (
                            <div className="flex items-center gap-2 px-2 mb-2">
                                {section.icon}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {section.title}
                                </span>
                            </div>
                        )}

                        {/* Nav Links */}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => (
                                <li key={item.href}>
                                    {item.comingSoon ? (
                                        // Coming Soon - Disabled
                                        <div
                                            className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-muted-foreground/50 cursor-not-allowed ${isCollapsed ? 'justify-center' : ''
                                                }`}
                                            title={isCollapsed ? `${item.label} (Coming Soon)` : undefined}
                                        >
                                            {item.icon}
                                            {!isCollapsed && (
                                                <span className="flex-1">{item.label}</span>
                                            )}
                                            {!isCollapsed && (
                                                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Soon</span>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${isCollapsed ? 'justify-center' : ''
                                                } ${isActive(item.href)
                                                    ? 'bg-brand/10 text-brand'
                                                    : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                                                }`}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            {item.icon}
                                            {!isCollapsed && item.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Section Divider */}
                        {!isCollapsed && <div className="mt-4 border-b border-sidebar-border" />}
                    </div>
                ))}
            </nav>

            {/* Footer: System + User */}
            <div className={`border-t border-sidebar-border space-y-1 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                {/* System Links */}
                {systemItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isCollapsed ? 'justify-center' : ''
                            } ${isActive(item.href)
                                ? item.href.includes('automations') ? 'bg-ai/10 text-ai' : 'bg-brand/10 text-brand'
                                : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                            }`}
                        title={isCollapsed ? item.label : undefined}
                    >
                        {item.icon}
                        {!isCollapsed && item.label}
                    </Link>
                ))}

                {/* User Profile */}
                {user && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-border hover:bg-accent/50 transition-colors ${isCollapsed ? 'justify-center' : ''
                        }`}>
                        <div
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0"
                            title={isCollapsed ? user.full_name : undefined}
                        >
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <>
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
                            </>
                        )}
                    </div>
                )}

                {/* Collapse Toggle */}
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <>
                            <ChevronLeft className="w-4 h-4" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
