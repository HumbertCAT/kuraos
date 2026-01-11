'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    Calendar,
    Briefcase,
    Users,
    User,
    FileText,
    Sparkles,
    Settings,
    HelpCircle,
    LogOut,
    Flame,
    Stethoscope,
    Sprout,
    Megaphone,
    CreditCard,
    Bell,
    Shield,
    CalendarCheck,
} from 'lucide-react';

interface MenuItem {
    href: string;
    icon: React.ReactNode;
    label: string;
    description?: string;
    comingSoon?: boolean;
}

interface MenuSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    items: MenuItem[];
}

export default function MorePage() {
    const t = useTranslations('Navigation');
    const { user, logout } = useAuth();

    const trinitySections: MenuSection[] = [
        {
            id: 'connect',
            title: 'CONNECT',
            icon: <Flame className="w-4 h-4" />,
            color: 'text-orange-500',
            items: [
                { href: '/calendar', icon: <Calendar className="w-5 h-5" />, label: 'Agenda' },
                { href: '/bookings', icon: <CalendarCheck className="w-5 h-5" />, label: 'Reservas' },
                { href: '/services', icon: <Briefcase className="w-5 h-5" />, label: 'Servicios' },
                { href: '/leads', icon: <Users className="w-5 h-5" />, label: 'CRM' },
            ],
        },
        {
            id: 'practice',
            title: 'PRACTICE',
            icon: <Stethoscope className="w-4 h-4" />,
            color: 'text-emerald-500',
            items: [
                { href: '/patients', icon: <User className="w-5 h-5" />, label: 'Pacientes' },
                { href: '/forms', icon: <FileText className="w-5 h-5" />, label: 'Formularios' },
            ],
        },
        {
            id: 'grow',
            title: 'GROW',
            icon: <Sprout className="w-4 h-4" />,
            color: 'text-lime-500',
            items: [
                { href: '/campaigns', icon: <Megaphone className="w-5 h-5" />, label: 'Campañas', comingSoon: true },
            ],
        },
    ];

    const globalItems: MenuItem[] = [
        { href: '/automations', icon: <Sparkles className="w-5 h-5" />, label: 'Agentes' },
        { href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Ajustes' },
        { href: '/settings/billing', icon: <CreditCard className="w-5 h-5" />, label: 'Facturación' },
        { href: '/settings/referrals', icon: <Sprout className="w-5 h-5" />, label: 'Referidos' },
        { href: '/help', icon: <HelpCircle className="w-5 h-5" />, label: 'Ayuda' },
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Menú</p>
                    <h1 className="type-h1 text-foreground">Todas las secciones</h1>
                </div>
                <ThemeToggle />
            </header>

            {/* Trinity Sections */}
            {trinitySections.map((section) => (
                <section key={section.id} className="space-y-3">
                    {/* Section Header */}
                    <div className="flex items-center gap-2">
                        <span className={section.color}>{section.icon}</span>
                        <h2 className="text-xs font-medium text-muted-foreground tracking-widest">
                            {section.title}
                        </h2>
                    </div>

                    {/* Grid of items */}
                    <div className="grid grid-cols-4 gap-3">
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/50 transition-all active:scale-95 ${item.comingSoon ? 'opacity-50 pointer-events-none' : ''
                                    }`}
                            >
                                <div className="text-muted-foreground mb-2">{item.icon}</div>
                                <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                                    {item.label}
                                </span>
                                {item.comingSoon && (
                                    <span className="text-[8px] text-muted-foreground mt-1">Pronto</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            ))}

            {/* Global Section */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xs font-medium text-muted-foreground tracking-widest">
                        GLOBAL
                    </h2>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {globalItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-muted/50 transition-all active:scale-95"
                        >
                            <div className="text-muted-foreground mb-2">{item.icon}</div>
                            <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* User Section */}
            {user && (
                <section className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center text-white font-bold">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{user.full_name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all active:scale-95"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
