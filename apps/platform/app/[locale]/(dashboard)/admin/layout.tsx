'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
    Brain,
    Layers,
    Building2,
    FileText,
    Bot,
    Shield,
    Palette
} from 'lucide-react';

const ADMIN_SECTIONS = [
    { key: 'aigov', label: 'AIGov', icon: Brain, href: '/admin/aigov' },
    { key: 'tiers', label: 'Tiers', icon: Layers, href: '/admin/tiers' },
    { key: 'orgs', label: 'Orgs', icon: Building2, href: '/admin/orgs' },
    { key: 'templates', label: 'Forms', icon: FileText, href: '/admin/templates' },
    { key: 'automations', label: 'Agents', icon: Bot, href: '/admin/automations' },
    { key: 'backups', label: 'Backups', icon: Shield, href: '/admin/backups' },
    { key: 'theme', label: 'Themes', icon: Palette, href: '/admin/theme' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Extract section from pathname (e.g., /en/admin/aigov/models → aigov)
    const currentSection = pathname.split('/admin/')[1]?.split('/')[0] || 'aigov';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="tabs-nav flex gap-1 w-fit">
                {ADMIN_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = currentSection === section.key;

                    return (
                        <Link
                            key={section.key}
                            href={section.href}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-foreground/70 hover:text-foreground'
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
