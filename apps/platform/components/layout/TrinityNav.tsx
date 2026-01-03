'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useTerminology } from '@/hooks/use-terminology';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { openCommandPalette } from '@/components/command/GlobalCommandPalette';
import {
    Users,
    User,
    FileText,
    Briefcase,
    Calendar,
    LogOut,
    Sparkles,
    Search,
    Flame,
    Stethoscope,
    Sprout,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Megaphone,
    HelpCircle,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    comingSoon?: boolean;
    dataTour?: string;
}

interface NavSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
}

const STORAGE_KEY = 'trinity-nav-collapsed';
const SECTIONS_KEY = 'trinity-nav-sections';

export function TrinityNav() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const terminology = useTerminology();
    const t = useTranslations('Navigation');
    const tAuth = useTranslations('Auth');

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') setIsCollapsed(true);

        // Load section collapse states
        const sectionsStored = localStorage.getItem(SECTIONS_KEY);
        if (sectionsStored) {
            try {
                setCollapsedSections(JSON.parse(sectionsStored));
            } catch (e) { }
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem(STORAGE_KEY, String(newState));
    };

    const toggleSection = (sectionId: string) => {
        const newState = { ...collapsedSections, [sectionId]: !collapsedSections[sectionId] };
        setCollapsedSections(newState);
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(newState));
    };

    const sections: NavSection[] = [
        {
            id: 'connect',
            title: t('sections.connect'),
            icon: <Flame className="w-3.5 h-3.5" />,
            items: [
                { href: '/calendar', label: t('links.calendar'), icon: <Calendar className="w-4 h-4" /> },
                { href: '/services', label: t('links.services'), icon: <Briefcase className="w-4 h-4" /> },
                { href: '/leads', label: t('links.crm'), icon: <Users className="w-4 h-4" /> },
            ],
        },
        {
            id: 'practice',
            title: t('sections.practice'),
            icon: <Stethoscope className="w-3.5 h-3.5" />,
            items: [
                { href: '/patients', label: t('links.clients'), icon: <User className="w-4 h-4" />, dataTour: 'sidebar-patients' },
                { href: '/bookings', label: t('links.bookings'), icon: <Calendar className="w-4 h-4" /> },
                { href: '/forms', label: t('links.forms'), icon: <FileText className="w-4 h-4" /> },
            ],
        },
        {
            id: 'grow',
            title: t('sections.grow'),
            icon: <Sprout className="w-3.5 h-3.5" />,
            items: [
                { href: '/campaigns', label: t('links.campaigns'), icon: <Megaphone className="w-4 h-4" />, comingSoon: true },
            ],
        },
    ];

    const isActive = (href: string) => pathname.includes(href);

    if (!mounted) return null;

    return (
        <aside
            className={`h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Header: Logo */}
            <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <Link href="/dashboard" className="flex items-center justify-center">
                    {isCollapsed ? (
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

            {/* Search - Triggers Command Palette */}
            {!isCollapsed && (
                <div className="px-3 pb-3">
                    <button
                        onClick={openCommandPalette}
                        className="relative w-full flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-all active:scale-[0.98]"
                    >
                        <Search className="w-4 h-4" />
                        <span className="flex-1 text-left">{t('search')}</span>
                        <span className="text-[10px] text-muted-foreground/70 font-mono">⌘K</span>
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto py-2 space-y-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                {/* Dashboard - Standalone */}
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all ${isCollapsed ? 'justify-center' : ''
                        } ${pathname.includes('/dashboard')
                            ? 'bg-gradient-to-r from-brand/10 to-transparent text-brand border-l-2 border-brand'
                            : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                        }`}
                    title={isCollapsed ? 'Dashboard' : undefined}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    {!isCollapsed && 'Dashboard'}
                </Link>

                {/* Section Groups */}
                {sections.map((section) => {
                    const isSectionCollapsed = collapsedSections[section.id];

                    return (
                        <div
                            key={section.id}
                            className={`${isCollapsed ? '' : 'mt-4'} transition-all duration-200`}
                        >
                            {/* Section Header - Clickable */}
                            {!isCollapsed && (
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between px-2 py-1.5 mb-1 rounded hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            {section.icon}
                                        </span>
                                        <span className="type-ui text-muted-foreground tracking-widest">
                                            {section.title}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isSectionCollapsed ? '-rotate-90' : ''
                                            }`}
                                    />
                                </button>
                            )}

                            {/* Nav Links - Collapsible */}
                            <ul className={`space-y-0.5 overflow-hidden transition-all duration-200 ${!isCollapsed && isSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                                }`}>
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        {item.comingSoon ? (
                                            <div
                                                className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg text-muted-foreground/50 cursor-not-allowed ${isCollapsed ? 'justify-center' : ''
                                                    }`}
                                                title={isCollapsed ? `${item.label} (Coming Soon)` : undefined}
                                            >
                                                {item.icon}
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="flex-1">{item.label}</span>
                                                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Pronto</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${isCollapsed ? 'justify-center' : ''
                                                    } ${isActive(item.href)
                                                        ? 'bg-gradient-to-r from-brand/10 to-transparent text-foreground border-l-2 border-brand shadow-sm'
                                                        : 'text-sidebar-foreground hover:bg-card/50 hover:text-foreground'
                                                    }`}
                                                title={isCollapsed ? item.label : undefined}
                                                data-tour={item.dataTour}
                                            >
                                                {item.icon}
                                                {!isCollapsed && item.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}

                {/* Agentes - Below Nurture */}
                <Link
                    href="/automations"
                    className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all ${isCollapsed ? 'justify-center' : ''
                        } ${isActive('/automations')
                            ? 'bg-gradient-to-r from-ai/10 to-transparent text-ai border-l-2 border-ai'
                            : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                        }`}
                    title={isCollapsed ? 'Agentes' : undefined}
                >
                    <Sparkles className="w-4 h-4" />
                    {!isCollapsed && 'Agentes'}
                </Link>
            </nav>

            {/* Footer: User + Controls */}
            <div className={`border-t border-sidebar-border ${isCollapsed ? 'p-2' : 'p-3'}`}>
                {/* Help Link */}
                <Link
                    href="/help"
                    className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all mb-2 ${isCollapsed ? 'justify-center' : ''
                        } ${isActive('/help')
                            ? 'bg-gradient-to-r from-brand/10 to-transparent text-brand border-l-2 border-brand'
                            : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                        }`}
                    title={isCollapsed ? 'Ayuda' : undefined}
                >
                    <HelpCircle className="w-4 h-4" />
                    {!isCollapsed && 'Ayuda'}
                </Link>

                {/* User Profile - Links to Settings */}
                {user && (
                    <Link
                        href="/settings/general"
                        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors ${isCollapsed ? 'justify-center' : ''
                            }`}
                        title={isCollapsed ? user.full_name : undefined}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {user.full_name?.split(' ')[0]}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {user.email?.split('@')[0] || 'User'}
                                </p>
                            </div>
                        )}
                    </Link>
                )}

                {/* Controls Row: Theme + Logout + Collapse */}
                <div className={`flex items-center gap-1 mt-2 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-1">
                            <ThemeToggle />
                            <LanguageSwitcher />
                            <button
                                onClick={logout}
                                className="p-1.5 text-muted-foreground hover:text-risk transition-colors rounded-md hover:bg-muted"
                                title={tAuth('logout')}
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
