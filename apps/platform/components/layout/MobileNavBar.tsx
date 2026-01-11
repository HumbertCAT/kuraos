'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, User, Calendar, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '/es/dashboard', icon: LayoutDashboard, label: 'Inicio' },
    { href: '/es/leads', icon: Users, label: 'Leads' },
    { href: '/es/patients', icon: User, label: 'Pacientes' },
    { href: '/es/calendar', icon: Calendar, label: 'Agenda' },
    { href: '/es/more', icon: Menu, label: 'Más' },
];

/**
 * MobileNavBar - Bottom navigation for mobile devices.
 * 
 * Rule of 5: Home, Leads, Patients, Agenda, Menu
 * 
 * ⚠️ Architect Warning #1: Safe Area padding is MANDATORY for iPhone
 */
export function MobileNavBar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        // Remove locale prefix for comparison
        const cleanPath = pathname.replace(/^\/[a-z]{2}\//, '/');
        const cleanHref = href.replace(/^\/[a-z]{2}\//, '/');
        return cleanPath.startsWith(cleanHref);
    };

    return (
        <nav
            className={cn(
                // Base styles
                'fixed bottom-0 left-0 right-0 z-50',
                'bg-card/95 backdrop-blur-sm border-t border-border',
                'flex items-center justify-around',
                // Height + Safe Area (iPhone Home Indicator) ⚠️
                'h-16 pb-[env(safe-area-inset-bottom)]',
                // Only show on mobile
                'md:hidden'
            )}
        >
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center justify-center',
                            'w-full h-full',
                            // Touch target: minimum 44px ⚠️
                            'min-h-[44px] min-w-[44px]',
                            // UI Physics: tactile feedback
                            'transition-all duration-150 active:scale-95',
                            active
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5 mb-0.5',
                                active && 'stroke-[2.5px]'
                            )}
                        />
                        <span className="text-[10px] font-medium">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
