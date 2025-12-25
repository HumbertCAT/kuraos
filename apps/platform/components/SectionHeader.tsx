'use client';

import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    gradientFrom: string;
    gradientTo: string;
    shadowColor?: string;
}

/**
 * Premium section header with gradient icon + title + subtitle.
 * Used across all main dashboard sections for consistent branding.
 * 
 * Color variants:
 * - Patients: from-blue-500 to-indigo-500, shadow-blue-200
 * - Bookings: from-emerald-500 to-teal-500, shadow-emerald-200
 * - Calendar: from-orange-500 to-amber-500, shadow-orange-200
 * - Services: from-teal-500 to-cyan-500, shadow-teal-200
 * - Automations: from-violet-500 to-fuchsia-500, shadow-violet-200
 * - Forms: from-indigo-500 to-purple-500, shadow-indigo-200
 */
export default function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    gradientFrom,
    gradientTo,
    shadowColor = 'shadow-slate-200',
}: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg ${shadowColor}`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
                <h1 className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
                    {title}
                </h1>
                <p className="text-foreground/60">{subtitle}</p>
            </div>
        </div>
    );
}
