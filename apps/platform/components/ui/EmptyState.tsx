'use client';

import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

/**
 * EmptyState - Illustrated empty state for when lists have no items.
 * Provides visual feedback and optional call-to-action.
 */
export default function EmptyState({
    icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`text-center py-12 px-6 bg-card rounded-xl border border-border ${className}`}>
            {/* Icon or default illustration */}
            {icon ? (
                <div className="mx-auto mb-4 text-slate-300">
                    {icon}
                </div>
            ) : (
                <div className="mx-auto mb-4 w-24 h-24">
                    {/* Default empty state SVG illustration */}
                    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-200">
                        <rect x="12" y="24" width="72" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                        <line x1="12" y1="40" x2="84" y2="40" stroke="currentColor" strokeWidth="2" />
                        <circle cx="24" cy="32" r="4" fill="currentColor" opacity="0.5" />
                        <circle cx="36" cy="32" r="4" fill="currentColor" opacity="0.5" />
                        <circle cx="48" cy="32" r="4" fill="currentColor" opacity="0.5" />
                        <rect x="24" y="52" width="48" height="4" rx="2" fill="currentColor" opacity="0.3" />
                        <rect x="24" y="62" width="32" height="4" rx="2" fill="currentColor" opacity="0.3" />
                    </svg>
                </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-foreground/60 mb-4 max-w-sm mx-auto">
                    {description}
                </p>
            )}

            {/* Action */}
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}

// Pre-built icons for common empty states
export function PatientsEmptyIcon({ className = 'mx-auto' }: { className?: string }) {
    return (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="32" cy="24" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 56c0-11.05 8.95-20 20-20s20 8.95 20 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="44" y1="44" x2="56" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function FormsEmptyIcon({ className = 'mx-auto' }: { className?: string }) {
    return (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
            <line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="20" y="44" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}
