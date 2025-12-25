import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CyberCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'alert' | 'ai';
}

const variantStyles = {
    default: '',
    alert: 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20',
    ai: 'border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20',
};

/**
 * CyberCard - Universal container component for the Cyber-Clinical Design System.
 * 
 * Usage:
 * ```tsx
 * <CyberCard>Content here</CyberCard>
 * <CyberCard variant="alert">Risk alert</CyberCard>
 * <CyberCard variant="ai">AI-powered section</CyberCard>
 * ```
 */
export function CyberCard({ children, className, variant = 'default' }: CyberCardProps) {
    return (
        <div
            className={cn(
                // Base styles
                'bg-white dark:bg-zinc-900',
                'border border-zinc-200 dark:border-zinc-800',
                'rounded-lg shadow-sm dark:shadow-none',
                'transition-all duration-200',
                // Padding
                'p-6 md:p-6 sm:p-4',
                // Variant overrides
                variantStyles[variant],
                // Custom classes
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
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
