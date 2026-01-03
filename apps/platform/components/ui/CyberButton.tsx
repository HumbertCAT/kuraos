'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * CyberButton - Enterprise UI Button Component v2.3
 * 
 * THE BRAND UNIFICATION (v1.1.20) - Contrast Fix
 * Typography with authority: font-semibold, tracking-wide, text-white
 * Clear visual hierarchy between variants
 */

const buttonVariants = {
    // DEFAULT: Teal Profundo - Solid, reliable (Guardar, Crear)
    default: cn(
        "bg-[#004F53] text-white",
        "hover:bg-[#003A3D] active:bg-[#002A2D]",
        "font-semibold tracking-wide",
        "shadow-sm"
    ),

    // HIGHLIGHT: Teal Brillante + Crystal Ring - Premium 3D look (Start Session, Hero CTAs)
    highlight: cn(
        "bg-[#247C7D] text-white",
        "ring-1 ring-inset ring-white/20",
        "hover:bg-[#1E6A6B] hover:ring-white/30",
        "font-semibold tracking-wide",
        "shadow-md"
    ),

    // SURFACE: Visible dark block (Config, Settings)
    surface: cn(
        "bg-zinc-200 text-zinc-900 border border-zinc-300",
        "hover:bg-zinc-300 active:bg-zinc-400",
        "dark:bg-zinc-700 dark:text-white dark:border-zinc-600 dark:hover:bg-zinc-600",
        "font-semibold tracking-wide"
    ),

    // SECONDARY: Visible ghost with border
    secondary: cn(
        "bg-white/5 border border-zinc-300 text-zinc-700",
        "hover:bg-zinc-100 active:bg-zinc-200",
        "dark:bg-white/10 dark:border-zinc-600 dark:text-white dark:hover:bg-white/20",
        "font-medium tracking-wide"
    ),

    // GHOST: Minimal for Cancel
    ghost: cn(
        "bg-transparent text-zinc-600",
        "hover:bg-zinc-100 hover:text-zinc-900",
        "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
        "font-medium"
    ),

    // OUTLINE: Clean border only
    outline: cn(
        "bg-transparent border border-zinc-300 text-zinc-900",
        "hover:bg-zinc-50",
        "dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800/50",
        "font-medium tracking-wide"
    ),

    // DANGER: Destructive actions (Eliminar)
    danger: cn(
        "bg-rose-600 text-white",
        "hover:bg-rose-700 active:bg-rose-800",
        "font-semibold tracking-wide",
        "shadow-sm"
    ),

    // AI: Gradient premium look (AI actions, Sparkles)
    ai: cn(
        "bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
        "hover:from-violet-700 hover:to-indigo-700",
        "font-semibold tracking-wide",
        "shadow-md"
    ),
};

const buttonSizes = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-5 py-2.5 text-sm rounded-lg",
    icon: "h-9 w-9 rounded-md",
};

export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants;
    size?: keyof typeof buttonSizes;
    children: React.ReactNode;
}

/**
 * Utility: Get button classes for use with Links or other elements
 * Usage: <Link className={getButtonClasses({ variant: 'highlight' })}>...</Link>
 */
export function getButtonClasses({
    variant = 'default',
    size = 'md',
    className = ''
}: {
    variant?: keyof typeof buttonVariants;
    size?: keyof typeof buttonSizes;
    className?: string;
} = {}) {
    return cn(
        "inline-flex items-center justify-center gap-2 transition-all",
        buttonVariants[variant],
        buttonSizes[size],
        className
    );
}

// Export variants for advanced usage
export { buttonVariants, buttonSizes };

export function CyberButton({
    variant = 'default',
    size = 'md',
    children,
    className,
    disabled,
    ...props
}: CyberButtonProps) {
    return (
        <button
            className={cn(
                // Base - Clean transitions
                "inline-flex items-center justify-center gap-2 transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#247C7D]/50",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
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
