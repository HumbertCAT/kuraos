'use client';

import { ReactNode } from 'react';

interface ElevatedCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    href?: string;
}

/**
 * ElevatedCard - Premium card component with subtle shadow and hover effects.
 * Use this for all list items across the app (patients, forms, templates, etc.)
 * 
 * Specs: bg-card, rounded-xl, border-border, shadow-sm, hover:shadow-md
 */
export default function ElevatedCard({
    children,
    className = '',
    onClick,
    href
}: ElevatedCardProps) {
    const baseClasses = `
    bg-card 
    rounded-xl 
    border border-border 
    shadow-sm 
    hover:shadow-md 
    hover:border-slate-300
    transition-all 
    duration-200
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    if (href) {
        return (
            <a href={href} className={baseClasses}>
                {children}
            </a>
        );
    }

    if (onClick) {
        return (
            <div onClick={onClick} className={baseClasses}>
                {children}
            </div>
        );
    }

    return (
        <div className={baseClasses}>
            {children}
        </div>
    );
}
