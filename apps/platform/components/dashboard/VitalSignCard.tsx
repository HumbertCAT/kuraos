'use client';

interface VitalSignCardProps {
    label: string;
    value: string | number;
    badge?: string;
    badgeType?: 'default' | 'warning' | 'success';
    action?: {
        label: string;
        href: string;
    };
    icon: React.ReactNode;
    iconColor?: string;
}

export function VitalSignCard({
    label,
    value,
    badge,
    badgeType = 'default',
    action,
    icon,
    iconColor = 'text-brand',
}: VitalSignCardProps) {
    const badgeClasses = {
        default: 'bg-muted text-muted-foreground',
        warning: 'bg-amber-500/10 text-amber-500',
        success: 'bg-emerald-500/10 text-emerald-500',
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
                <span className="type-h2 text-xs">{label}</span>
                <span className={iconColor}>{icon}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-display font-semibold text-foreground">
                    {value}
                </span>
                {badge && (
                    <span className={`text-xs font-mono px-2 py-1 rounded ${badgeClasses[badgeType]}`}>
                        {badge}
                    </span>
                )}
                {action && (
                    <a href={action.href} className="text-xs text-brand hover:underline">
                        {action.label}
                    </a>
                )}
            </div>
        </div>
    );
}
