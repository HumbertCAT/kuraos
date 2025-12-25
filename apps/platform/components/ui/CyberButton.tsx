'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * CyberButton - Tactical UI Button Component
 * 
 * Matches Google AI Studio render exactly:
 * - Primary: WHITE background, BLACK text, UPPERCASE, mono font, rectangular
 * - Compact height (h-8), tracking-wider for tactical look
 */

const buttonVariants = {
    // PRIMARY: The Tactical Click - WHITE/BLACK/UPPERCASE
    primary: cn(
        "bg-white text-black hover:bg-zinc-200",
        "dark:bg-white dark:text-black dark:hover:bg-zinc-200",
        "uppercase font-bold tracking-wider font-mono"
    ),

    // SECONDARY: Ghost with subtle border
    secondary: cn(
        "bg-transparent border border-zinc-300 text-zinc-700 hover:bg-zinc-100",
        "dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900",
        "uppercase font-medium tracking-wider"
    ),

    // BRAND: Teal accent (for brand-specific actions)
    brand: cn(
        "bg-brand text-black hover:opacity-90",
        "uppercase font-bold tracking-wider"
    ),

    // DANGER: Red accent
    danger: cn(
        "bg-transparent border border-rose-500/50 text-rose-500 hover:bg-rose-500/10",
        "dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/20",
        "uppercase font-bold tracking-wider"
    ),

    // GHOST: Minimal
    ghost: cn(
        "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    ),

    // AI: Violet accent
    ai: cn(
        "bg-ai/10 border border-ai/30 text-ai hover:bg-ai/20",
        "dark:bg-ai/10 dark:border-ai/40 dark:text-ai dark:hover:bg-ai/20",
        "uppercase font-bold tracking-wider"
    ),
};

const buttonSizes = {
    sm: "px-3 h-7 text-[10px]",
    md: "px-4 h-8 text-[11px]",
    lg: "px-6 h-10 text-xs",
    icon: "h-8 w-8",
};

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants;
    size?: keyof typeof buttonSizes;
    children: React.ReactNode;
}

export function CyberButton({
    variant = 'primary',
    size = 'md',
    children,
    className,
    disabled,
    ...props
}: CyberButtonProps) {
    return (
        <button
            className={cn(
                // Base styles - TACTICAL
                "inline-flex items-center justify-center gap-2 rounded-sm transition-all",
                "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-background",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Variant
                buttonVariants[variant],
                // Size
                buttonSizes[size],
                // Custom
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

export default CyberButton;
