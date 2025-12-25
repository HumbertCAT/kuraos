"use client";

import { useEffect, useState } from "react";

// Architect's Constitución Visual - Default values
const DEFAULT_LIGHT: Record<string, string> = {
    "--background": "#FAFAFA",
    "--foreground": "#09090B",
    "--card": "#FFFFFF",
    "--border": "#E4E4E7",
    "--sidebar": "#FFFFFF",
    "--sidebar-foreground": "#52525B",
    "--sidebar-border": "#E4E4E7",
    "--brand": "#0D9488",
    "--primary": "#18181B",
    "--risk": "#E11D48",
    "--ai": "#7C3AED",
    "--success": "#059669",
    "--warning": "#D97706",
};

const DEFAULT_DARK: Record<string, string> = {
    "--background": "#09090B",
    "--foreground": "#FAFAFA",
    "--card": "#121212",
    "--border": "#27272A",
    "--sidebar": "#09090B",
    "--sidebar-foreground": "#A1A1AA",
    "--sidebar-border": "#27272A",
    "--brand": "#2DD4BF",
    "--primary": "#FAFAFA",
    "--risk": "#FB7185",
    "--ai": "#A78BFA",
    "--success": "#34D399",
    "--warning": "#FBBF24",
};

// Support both old flat format and new dual-mode format
interface DualModeThemeConfig {
    dark?: Record<string, string>;
    light?: Record<string, string>;
}

type ThemeConfig = DualModeThemeConfig | Record<string, string> | null | undefined;

interface ThemeHydrationProps {
    themeConfig: ThemeConfig;
}

/**
 * ThemeHydration Component (Dual-Mode)
 * 
 * Injects BOTH Light and Dark CSS theme variables into the DOM via <style> tag.
 * This ensures both modes work correctly regardless of which is currently active.
 * 
 * Supports:
 * - New format: { dark: {...}, light: {...} }
 * - Legacy format: { "--background": "#...", ... } (assumed to be dark mode)
 */
export function ThemeHydration({ themeConfig }: ThemeHydrationProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Parse theme config - support both formats
    let lightTheme = DEFAULT_LIGHT;
    let darkTheme = DEFAULT_DARK;

    if (themeConfig && typeof themeConfig === 'object') {
        // Check if it's the new dual-mode format
        if ('dark' in themeConfig || 'light' in themeConfig) {
            const dualConfig = themeConfig as DualModeThemeConfig;
            darkTheme = { ...DEFAULT_DARK, ...dualConfig.dark };
            lightTheme = { ...DEFAULT_LIGHT, ...dualConfig.light };
        }
        // Legacy flat format - assume it was for dark mode
        else if ('--background' in themeConfig) {
            darkTheme = { ...DEFAULT_DARK, ...(themeConfig as Record<string, string>) };
            lightTheme = DEFAULT_LIGHT;
        }
    }

    // Generate CSS for both modes
    const generateCSSBlock = (vars: Record<string, string>) => {
        return Object.entries(vars)
            .filter(([key]) => key.startsWith('--'))
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n    ');
    };

    const css = `
  :root {
    ${generateCSSBlock(lightTheme)}
  }
  .dark {
    ${generateCSSBlock(darkTheme)}
  }
`;

    // Inject via <style> tag
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
