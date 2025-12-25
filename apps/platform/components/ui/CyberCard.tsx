import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CyberCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'alert' | 'ai';
}

/**
 * CyberCard - Universal container component for the Cyber-Clinical Design System.
 * 
 * Usage:
 * ```tsx
 * <CyberCard>Content here</CyberCard>
 * <CyberCard variant="glass">Glass header</CyberCard>
 * <CyberCard variant="alert">Risk alert</CyberCard>
 * <CyberCard variant="ai">AI-powered section</CyberCard>
 * ```
 */
export function CyberCard({ children, className, variant = 'default' }: CyberCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-xl border transition-all duration-200",
                // Light Mode Styles
                "bg-white border-slate-200 shadow-sm",
                // Dark Mode Styles (The Key Fix)
                "dark:bg-[#0A0A0A] dark:border-white/10 dark:shadow-none",
                // Glass Variant (for headers)
                variant === 'glass' && "backdrop-blur-xl bg-white/80 dark:bg-[#0A0A0A]/80",
                // Alert Variant
                variant === 'alert' && "border-red-500/20 bg-red-50 dark:bg-red-500/5 dark:border-red-500/20",
                // AI Variant
                variant === 'ai' && "border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 dark:border-violet-500/20",
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * CyberCardHeader - Optional header section with title and optional subtitle
 */
export function CyberCardHeader({
    title,
    subtitle,
    action,
    className,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-start justify-between mb-4', className)}>
            <div>
                <h3 className="text-lg font-display text-foreground">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
