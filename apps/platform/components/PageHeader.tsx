'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
    // Identification
    icon: LucideIcon;
    kicker?: string; // "PRACTICE", "CONNECT", "GROW" (Trinity Context)
    title: string;
    subtitle?: string;

    // Interaction
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
        icon?: LucideIcon;
        variant?: 'brand' | 'outline' | 'ghost' | 'primary';
        disabled?: boolean;
        loading?: boolean;
    };

    // Content Injection (Search, Filters)
    children?: React.ReactNode;

    // Layout
    className?: string;
}

/**
 * ARCHITECT-CERTIFIED PAGE HEADER (v1.1.14)
 * The definitive header for Kura OS dashboard modules.
 */
export default function PageHeader({
    icon: Icon,
    kicker,
    title,
    subtitle,
    action,
    children,
    className = '',
}: PageHeaderProps) {
    const renderAction = () => {
        if (!action) return null;

        const ActionIcon = action.icon;
        const variantClass = action.variant === 'outline'
            ? 'btn-outline'
            : action.variant === 'ghost'
                ? 'btn-ghost'
                : 'btn-brand';

        const content = (
            <>
                {action.loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : ActionIcon && (
                    <ActionIcon size={18} className="mr-2" />
                )}
                {action.label}
            </>
        );

        if (action.href) {
            return (
                <Link
                    href={action.href}
                    className={`btn btn-md ${variantClass} ${action.disabled ? 'pointer-events-none opacity-50' : ''}`}
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={`btn btn-md ${variantClass}`}
            >
                {content}
            </button>
        );
    };

    return (
        <div className={`space-y-6 mb-8 ${className}`}>
            {/* Top Row: Meta, Title & Action */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    {/* Glass Icon Box */}
                    <div className="w-12 h-12 rounded-xl bg-brand/5 border border-brand/10 text-brand flex items-center justify-center shrink-0 shadow-sm">
                        <Icon size={24} />
                    </div>

                    <div className="min-w-0">
                        {kicker && (
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 leading-none">
                                {kicker}
                            </p>
                        )}
                        <h1 className="type-h1 leading-tight tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Primary Action (Desktop hidden/Mobile visible pattern) */}
                <div className="hidden md:block">
                    {renderAction()}
                </div>

                {/* Mobile Action (Visible only on mobile header row) */}
                <div className="md:hidden flex justify-end">
                    {renderAction()}
                </div>
            </div>

            {/* Bottom Row: Search, Filters, Tabs (Children) */}
            {children && (
                <div className="w-full">
                    {children}
                </div>
            )}
        </div>
    );
}
