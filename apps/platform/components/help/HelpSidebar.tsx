'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
    BookOpen,
    Rocket,
    LayoutGrid,
    Brain,
    Settings,
    ChevronDown,
    ChevronRight,
    Users,
    FileText,
    Calendar,
    ClipboardList,
    Zap,
    Eye,
    Activity,
    Bot,
    MessageCircle,
    Plug,
    CreditCard,
    HelpCircle,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Help Center Navigation Structure - 4 Pillars
 */
const HELP_NAV = [
    {
        id: 'getting-started',
        title: 'Primeros Pasos',
        icon: Rocket,
        items: [
            { slug: 'first-5-minutes', title: 'Tu Primera Sesión', icon: '🚀' },
            { slug: 'understanding-journeys', title: 'El Sistema de Journeys', icon: '🗺️' },
            { slug: 'demo-mode', title: 'Modo Demo', icon: '🎪' },
        ],
    },
    {
        id: 'core',
        title: 'Módulos Core',
        icon: LayoutGrid,
        items: [
            { slug: 'patients', title: 'Soul Record', icon: '👥' },
            { slug: 'clinical-journal', title: 'Diario Clínico', icon: '📝' },
            { slug: 'bookings', title: 'Reservas', icon: '📅' },
            { slug: 'forms', title: 'Formularios', icon: '📋' },
            { slug: 'leads', title: 'CRM y Leads', icon: '🎯' },
        ],
    },
    {
        id: 'intelligence',
        title: 'Inteligencia',
        icon: Brain,
        items: [
            { slug: 'aletheia', title: 'AletheIA Observatory', icon: '🔭' },
            { slug: 'sentinel-pulse', title: 'Pulso Emocional', icon: '💓' },
            { slug: 'agents', title: 'Agentes y Playbooks', icon: '⚡' },
            { slug: 'chatbot', title: 'Asistente IA', icon: '🤖' },
        ],
    },
    {
        id: 'account',
        title: 'Cuenta',
        icon: Settings,
        items: [
            { slug: 'settings', title: 'Configuración', icon: '⚙️' },
            { slug: 'integrations', title: 'Integraciones', icon: '🔌' },
            { slug: 'plans', title: 'Planes', icon: '💎' },
            { slug: 'credits', title: 'Créditos IA', icon: '🎫' },
        ],
    },
];

export function HelpSidebar() {
    const pathname = usePathname();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'getting-started': true,
        'core': true,
        'intelligence': true,
        'account': true,
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const isActive = (slug: string) => pathname.includes(`/help/${slug}`);

    return (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <Link href="/help" className="flex items-center gap-2 text-foreground hover:text-brand transition-colors">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">Centro de Ayuda</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
                {HELP_NAV.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSections[section.id];

                    return (
                        <div key={section.id} className="space-y-0.5">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span>{section.title}</span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>

                            {/* Section Items */}
                            {isExpanded && (
                                <ul className="ml-4 space-y-0.5">
                                    {section.items.map((item) => (
                                        <li key={item.slug}>
                                            <Link
                                                href={`/help/${item.slug}`}
                                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${isActive(item.slug)
                                                        ? 'bg-brand/10 text-brand font-medium'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                    }`}
                                            >
                                                <span className="text-base">{item.icon}</span>
                                                <span>{item.title}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 mt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-2">
                    ¿Necesitas más ayuda?
                </p>
                <p className="text-sm text-muted-foreground">
                    Usa el <span className="text-brand font-medium">Chat IA</span> en la esquina inferior.
                </p>
            </div>
        </aside>
    );
}

export default HelpSidebar;
