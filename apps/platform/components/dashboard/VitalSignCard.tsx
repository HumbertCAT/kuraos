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

    return (
        <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-5 flex flex-col justify-between h-32 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
                <span className="type-ui text-muted-foreground tracking-wider">{label.toUpperCase()}</span>
                <span className={iconColor}>{icon}</span>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="type-h1 font-mono text-foreground">
                        {value}
                    </span>

                    {/* Trend Indicator */}
                    {trend && (
                        <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                            <TrendIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{trend.label}</span>
                        </div>
                    )}
                </div>

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
