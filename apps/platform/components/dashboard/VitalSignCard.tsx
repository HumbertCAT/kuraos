'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalSignCardProps {
    label: string;
    value: string | number;
    badge?: string;
    badgeType?: 'default' | 'warning' | 'success';
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        label: string;
        isPositive?: boolean; // Up is good? (for revenue yes, for churn no)
    };
    action?: {
        label: string;
        href: string;
    };
    icon: React.ReactNode;
    iconColor?: string;
    compact?: boolean; // Mobile compact mode
}

export function VitalSignCard({
    label,
    value,
    badge,
    badgeType = 'default',
    trend,
    action,
    icon,
    iconColor = 'text-brand',
    compact = false,
}: VitalSignCardProps) {
    const badgeClasses = {
        default: 'bg-muted text-muted-foreground',
        warning: 'bg-warning/10 text-warning',
        success: 'bg-success/10 text-success',
    };

    // Determine trend color based on direction and whether up is positive
    const getTrendColor = () => {
        if (!trend) return '';
        if (trend.direction === 'neutral') return 'text-muted-foreground';

        const isGood = trend.isPositive !== undefined
            ? (trend.direction === 'up' ? trend.isPositive : !trend.isPositive)
            : (trend.direction === 'up');

        return isGood ? 'text-success' : 'text-destructive';
    };

    const TrendIcon = trend?.direction === 'up'
        ? TrendingUp
        : trend?.direction === 'down'
            ? TrendingDown
            : Minus;

    // Compact mode: smaller, denser card
    if (compact) {
        return (
            <div className="card p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`${iconColor} shrink-0`}>{icon}</span>
                    <span className="text-lg font-bold font-mono text-foreground truncate">
                        {value}
                    </span>
                </div>
                {trend && (
                    <div className={`shrink-0 ${getTrendColor()}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
        );
    }

    // Full mode: standard card with all details
    return (
        <div className="card p-5 flex flex-col justify-between h-32">
            {/* Header: Icon + Label */}
            <div className="flex items-center gap-2">
                <span className={iconColor}>{icon}</span>
                <span className="type-ui text-muted-foreground tracking-wider">{label.toUpperCase()}</span>
            </div>

            {/* Main: Value + Badge */}
            <div className="flex items-baseline justify-between">
                <span className="type-h1 font-mono text-foreground">
                    {value}
                </span>
                {badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${badgeClasses[badgeType]}`}>
                        {badge}
                    </span>
                )}
            </div>

            {/* Footer: Trend */}
            {trend && (
                <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{trend.label}</span>
                </div>
            )}
            {action && (
                <a href={action.href} className="text-xs text-brand hover:underline">
                    {action.label}
                </a>
            )}
        </div>
    );
}

