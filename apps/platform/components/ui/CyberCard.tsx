import React from "react";
import { cn } from "@/lib/utils";

// Definimos los estilos para cada variante usando las nuevas variables semánticas.
const cardVariants = {
    // La tarjeta estándar (sólida)
    default: "bg-card text-card-foreground border-border shadow-sm dark:shadow-none",

    // Variante 'ghost' (transparente, solo borde sutil) - Útil para contenedores secundarios
    ghost: "bg-transparent border-border/40 text-foreground shadow-none",

    // Variante 'glass' (translúcida con desenfoque) - Útil para elementos flotantes o headers sticky
    // Usa bg-card pero con opacidad para el efecto cristal.
    glass: "bg-card/80 backdrop-blur-md border-border/80 text-card-foreground shadow-sm dark:shadow-none supports-[backdrop-filter]:bg-card/60",

    // Variante 'ai' (acentuada con tono violeta sutil)
    ai: "bg-card text-card-foreground border-ai/30 shadow-sm dark:shadow-none",

    // Variante 'alert' (acentuada con tono riesgo sutil)
    alert: "bg-card text-card-foreground border-risk/30 shadow-sm dark:shadow-none",
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
                // ESTILOS BASE (Comunes a todas)
                "rounded-xl border transition-all duration-200",
                // ESTILOS DE LA VARIANTE SELECCIONADA
                cardVariants[variant],
                // CLASES PERSONALIZADAS (para overrides puntuales)
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
