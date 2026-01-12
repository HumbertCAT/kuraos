'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getButtonClasses } from '@/components/ui/CyberButton';

interface PageHeaderProps {
    // Identification
    icon: LucideIcon;
    kicker?: string; // "PRACTICE", "CONNECT", "GROW" (Trinity Context)
    title: string;
    subtitle?: React.ReactNode;

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
 * ARCHITECT-CERTIFIED PAGE HEADER (v1.1.20)
 * The definitive header for Kura OS dashboard modules.
 * Now using Crystal & Steel button system.
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

        // Map legacy variants to CyberButton variants
        const variantMap: Record<string, 'default' | 'outline' | 'ghost' | 'highlight'> = {
            brand: 'default',
            primary: 'default',
            outline: 'outline',
            ghost: 'ghost',
        };
        const cyberVariant = variantMap[action.variant || 'brand'] || 'default';

        const buttonClasses = getButtonClasses({
            variant: cyberVariant,
            className: `whitespace-nowrap ${action.disabled ? 'pointer-events-none opacity-50' : ''}`
        });

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
                    className={buttonClasses}
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={buttonClasses}
            >
                {content}
            </button>
        );
    };

    return (
        <div className={`space-y-4 lg:space-y-6 mb-4 lg:mb-6 ${className}`}>
            {/* Top Row: Meta, Title & Action */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3 lg:gap-4">
                    {/* Glass Icon Box - Smaller on mobile */}
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-brand/5 border border-brand/10 text-brand flex items-center justify-center shrink-0 shadow-sm">
                        <Icon size={20} className="lg:hidden" />
                        <Icon size={24} className="hidden lg:block" />
                    </div>

                    <div className="min-w-0">
                        {kicker && (
                            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 leading-none">
                                {kicker}
                            </p>
                        )}
                        <h1 className="text-xl lg:text-2xl font-serif font-medium tracking-tight leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <div className="text-sm text-muted-foreground mt-1 hidden sm:block">
                                {subtitle}
                            </div>
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

