"use client";

import { useEffect } from "react";

interface ThemeHydrationProps {
    themeConfig: Record<string, string> | null | undefined;
}

/**
 * ThemeHydration Component
 * 
 * Injects saved CSS theme variables into the DOM on page load.
 * Uses useEffect to apply styles after hydration to avoid SSR mismatch.
 */
export function ThemeHydration({ themeConfig }: ThemeHydrationProps) {
    useEffect(() => {
        if (!themeConfig || typeof themeConfig !== 'object') return;

        // Apply each CSS variable to :root
        Object.entries(themeConfig).forEach(([key, value]) => {
            if (key.startsWith('--') && typeof value === 'string') {
                document.documentElement.style.setProperty(key, value);
            }
        });

        // Cleanup: remove custom styles when component unmounts
        return () => {
            if (!themeConfig) return;
            Object.keys(themeConfig).forEach((key) => {
                if (key.startsWith('--')) {
                    document.documentElement.style.removeProperty(key);
                }
            });
        };
    }, [themeConfig]);

    // This component renders nothing - it only applies styles via useEffect
    return null;
}
