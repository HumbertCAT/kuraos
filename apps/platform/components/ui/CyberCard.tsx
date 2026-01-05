import React from "react";
import { cn } from "@/lib/utils";

// Definimos los estilos para cada variante.
// Uses CSS variables from globals.css for consistent theming.
const cardVariants = {
    // La tarjeta estándar (sólida) - Uses --card and --border
    default: "bg-card text-card-foreground border-border shadow-sm dark:shadow-none",

    // Variante 'ghost' (transparente, solo borde sutil)
    ghost: "bg-transparent border-border/50 text-foreground shadow-none",

    // Variante 'glass' (translúcida con desenfoque)
    glass: "backdrop-blur-xl bg-white/80 border-border/80 text-card-foreground shadow-sm dark:bg-card/80 dark:border-border dark:shadow-none",

    // Variante 'ai' (acentuada con tono violeta sutil)
    ai: "bg-card text-card-foreground border-ai/30 shadow-sm dark:border-ai/40 dark:shadow-none",

    // Variante 'alert' (acentuada con tono riesgo sutil)
    alert: "bg-card text-card-foreground border-risk/30 shadow-sm dark:border-risk/40 dark:shadow-none",
};

// Extendemos las props estándar de un DIV HTML
export interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: keyof typeof cardVariants;
}

export function CyberCard({
    children,
    className,
    variant = "default",
    ...props
}: CyberCardProps) {
    return (
        <div
            className={cn(
                // BASE: Use .card class for consistent shadow system
                "card transition-all duration-200",
                // VARIANT-SPECIFIC OVERRIDES (colors only, not structure)
                variant === "ghost" && "bg-transparent border-border/50 shadow-none",
                variant === "glass" && "backdrop-blur-xl bg-white/80 dark:bg-card/80",
                variant === "ai" && "border-ai/30 dark:border-ai/40",
                variant === "alert" && "border-risk/30 dark:border-risk/40",
                // CUSTOM CLASSES
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CyberCardHeader - Optional header section
 */
export function CyberCardHeader({
    title,
    subtitle,
    action,
    className,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-start justify-between mb-4', className)}>
            <div>
                <h3 className="text-lg font-display text-card-foreground">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-foreground/60 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
