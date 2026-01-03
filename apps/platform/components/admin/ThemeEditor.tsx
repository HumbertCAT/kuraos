"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CyberCard } from "@/components/ui/CyberCard";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { RotateCcw, Save, Palette, Loader2, Sun, Moon } from "lucide-react";

// The "Periodic Table" of Editable Tokens
const THEME_SECTIONS = [
    {
        id: "base",
        title: "Base Architecture",
        tokens: [
            { name: "--background", label: "App Background" },
            { name: "--foreground", label: "Main Text" },
            { name: "--card", label: "Card Surface" },
            { name: "--border", label: "Structural Borders" },
        ]
    },
    {
        id: "navigation",
        title: "Navigation (Sidebar)",
        tokens: [
            { name: "--sidebar", label: "Sidebar Background" },
            { name: "--sidebar-foreground", label: "Sidebar Text" },
            { name: "--sidebar-border", label: "Sidebar Border" },
        ]
    },
    {
        id: "brand",
        title: "Brand Identity",
        tokens: [
            { name: "--brand", label: "Primary Brand (Teal)" },
            { name: "--risk", label: "Risk/Error (Red)" },
            { name: "--ai", label: "Intelligence (Violet)" },
            { name: "--primary", label: "Main Action Buttons" },
        ]
    },
    {
        id: "feedback",
        title: "Feedback Colors",
        tokens: [
            { name: "--success", label: "Success (Green)" },
            { name: "--warning", label: "Warning (Amber)" },
            { name: "--destructive", label: "Destructive (Red)" },
        ]
    },
    {
        id: "gradients",
        title: "Texture & Gradients",
        tokens: [
            { name: "--gradient-start", label: "Gradient Start (Left)" },
            { name: "--gradient-end", label: "Gradient End (Right)" },
        ]
    }
];

// DEFAULT VALUES (Architect's Constitución Visual)
const DEFAULT_LIGHT: Record<string, string> = {
    "--background": "#FAF9F6",
    "--foreground": "#1A1A14",
    "--card": "#FFFEFB",
    "--border": "#E5E4DB",
    "--sidebar": "#F2F1EC",
    "--sidebar-foreground": "#57534E",
    "--sidebar-border": "#E5E4DB",
    "--brand": "#247C7D",
    "--primary": "#292524",
    "--risk": "#E11D48",
    "--ai": "#7C3AED",
    "--success": "#059669",
    "--warning": "#D97706",
    "--destructive": "#EF4444",
    "--gradient-start": "#247C7D",
    "--gradient-end": "#004F53",
};

const DEFAULT_DARK: Record<string, string> = {
    "--background": "#040F10",
    "--foreground": "#F2F2EB",
    "--card": "#0C1414",
    "--border": "#142020",
    "--sidebar": "#020606",
    "--sidebar-foreground": "#94A3B8",
    "--sidebar-border": "#142020",
    "--brand": "#247C7D",
    "--primary": "#F2F2EB",
    "--risk": "#FB7185",
    "--ai": "#A78BFA",
    "--success": "#34D399",
    "--warning": "#FBBF24",
    "--destructive": "#7F1D1D",
    "--gradient-start": "#247C7D",
    "--gradient-end": "#004F53",
};

type ThemeMode = 'dark' | 'light';

export function ThemeEditor() {
    const router = useRouter();
    const { organization } = useAuth();
    const { setTheme, resolvedTheme } = useTheme();

    // Dual-mode state
    const [activeMode, setActiveMode] = useState<ThemeMode>('dark');
    const [darkColors, setDarkColors] = useState<Record<string, string>>(DEFAULT_DARK);
    const [lightColors, setLightColors] = useState<Record<string, string>>(DEFAULT_LIGHT);

    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Active colors based on mode
    const colors = activeMode === 'dark' ? darkColors : lightColors;
    const setColors = activeMode === 'dark' ? setDarkColors : setLightColors;

    // 1. Hydrate: Load from saved theme or defaults
    useEffect(() => {
        setMounted(true);

        // Try to load saved theme from organization
        if (organization?.theme_config) {
            const config = organization.theme_config as any;

            // New dual-mode format
            if (config.dark && config.light) {
                setDarkColors({ ...DEFAULT_DARK, ...config.dark });
                setLightColors({ ...DEFAULT_LIGHT, ...config.light });
            }
            // Legacy single-mode format (assume it's dark mode)
            else if (config['--background']) {
                setDarkColors({ ...DEFAULT_DARK, ...config });
                setLightColors(DEFAULT_LIGHT);
            }
        }

        // Detect current system preference
        const isDark = document.documentElement.classList.contains('dark');
        setActiveMode(isDark ? 'dark' : 'light');
    }, [organization]);

    // 2. Real-time Injection (applies to currently active mode only)
    const handleColorChange = (token: string, value: string) => {
        setColors((prev: Record<string, string>) => ({ ...prev, [token]: value }));

        // Only inject if we're in matching mode
        const isDark = document.documentElement.classList.contains('dark');
        if ((activeMode === 'dark' && isDark) || (activeMode === 'light' && !isDark)) {
            document.documentElement.style.setProperty(token, value);
        }
    };

    // 3. Reset to Architect defaults
    const handleReset = () => {
        if (activeMode === 'dark') {
            setDarkColors(DEFAULT_DARK);
        } else {
            setLightColors(DEFAULT_LIGHT);
        }
        document.documentElement.removeAttribute("style");
        setMessage({ type: 'success', text: `${activeMode === 'dark' ? 'Dark' : 'Light'} mode reset to defaults` });
    };

    // 4. Save BOTH modes to Backend
    const handleSave = async () => {
        if (!organization?.id) {
            setMessage({ type: 'error', text: 'No organization found' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            // Save dual-mode structure
            const themeConfig = {
                dark: darkColors,
                light: lightColors,
            };

            const result = await api.admin.updateTheme(String(organization.id), themeConfig);
            if (result.success) {
                setMessage({ type: 'success', text: '✅ Both themes saved successfully!' });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: 'Failed to save theme' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error saving theme' });
        } finally {
            setSaving(false);
        }
    };

    // Switch mode and apply that mode's colors (uses next-themes)
    const switchMode = (mode: ThemeMode) => {
        setActiveMode(mode);

        // Use next-themes to switch theme class properly
        setTheme(mode);

        // Apply the colors for preview
        const colorsToApply = mode === 'dark' ? darkColors : lightColors;
        Object.entries(colorsToApply).forEach(([token, value]) => {
            document.documentElement.style.setProperty(token, value);
        });
    };

    if (!mounted) {
        return (
            <div className="p-10 text-center text-muted-foreground">
                Loading Theme Engine...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Palette className="text-brand" size={20} />
                        Theme Engine
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Customize Dark and Light modes independently.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent active:scale-95 transition-all"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Both'}
                    </button>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                <button
                    onClick={() => switchMode('dark')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeMode === 'dark'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Moon size={14} />
                    Dark Mode
                </button>
                <button
                    onClick={() => switchMode('light')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeMode === 'light'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Sun size={14} />
                    Light Mode
                </button>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                    ? 'bg-success/10 border border-success/30 text-success'
                    : 'bg-destructive/10 border border-destructive/30 text-destructive'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Color Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {THEME_SECTIONS.map((section) => (
                    <CyberCard key={section.id} className="p-5 flex flex-col gap-4">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                            {section.title}
                        </h3>

                        <div className="space-y-4">
                            {section.tokens.map((token) => (
                                <div key={token.name} className="flex items-center justify-between group">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor={token.name} className="text-sm font-medium text-foreground">
                                            {token.label}
                                        </label>
                                        <code className="text-[10px] text-muted-foreground bg-secondary/50 px-1 rounded w-fit">
                                            {token.name}
                                        </code>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                                            {colors[token.name]}
                                        </span>
                                        <div className="relative h-9 w-9 rounded-md border border-input overflow-hidden shadow-sm hover:ring-2 hover:ring-brand/50 transition-all">
                                            <input
                                                id={token.name}
                                                type="color"
                                                value={colors[token.name] || "#000000"}
                                                onChange={(e) => handleColorChange(token.name, e.target.value)}
                                                className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer bg-transparent border-none p-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CyberCard>
                ))}
            </div>

            {/* Gradient Preview */}
            <CyberCard className="p-5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-4">
                    Gradient Preview
                </h3>
                <div className="space-y-3">
                    <div
                        className="h-12 rounded-xl border border-border overflow-hidden"
                        style={{
                            background: `linear-gradient(to right, ${colors["--gradient-start"] || "#247C7D"}, ${colors["--gradient-end"] || "#004F53"})`
                        }}
                    />
                    <div
                        className="h-8 rounded-xl border border-border overflow-hidden"
                        style={{
                            background: `linear-gradient(to right, ${colors["--gradient-start"] || "#247C7D"}1A, transparent)`
                        }}
                    />
                    <p className="text-xs text-muted-foreground">
                        Arriba: Degradado completo • Abajo: Sutil (10%) usado en headers de tabla y sidebar
                    </p>
                </div>
            </CyberCard>

            {/* Info Banner */}
            <div className="bg-ai/10 border border-ai/30 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                    <p className="text-sm font-medium text-foreground">Dual Mode Theme</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Edit each mode separately. Changes preview instantly.
                        Click "Save Both" to persist both Dark and Light themes to database.
                    </p>
                </div>
            </div>
        </div>
    );
}
