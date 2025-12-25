"use client";

import { useState, useEffect } from "react";
import { CyberCard } from "@/components/ui/CyberCard";
import { RotateCcw, Save, Palette } from "lucide-react";

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
    }
];

export function ThemeEditor() {
    const [colors, setColors] = useState<Record<string, string>>({});
    const [mounted, setMounted] = useState(false);

    // 1. Hydrate: Read initial values from :root
    useEffect(() => {
        setMounted(true);
        const root = document.documentElement;
        const computed = getComputedStyle(root);

        const initial: Record<string, string> = {};
        THEME_SECTIONS.flatMap(s => s.tokens).forEach(t => {
            // Get the value, trim whitespace
            const value = computed.getPropertyValue(t.name).trim();
            // Convert to hex if it's a valid color
            initial[t.name] = value || "#000000";
        });
        setColors(initial);
    }, []);

    // 2. Real-time Injection
    const handleColorChange = (token: string, value: string) => {
        setColors(prev => ({ ...prev, [token]: value }));
        document.documentElement.style.setProperty(token, value);
    };

    // 3. Reset (Reload to clear inline styles)
    const handleReset = () => {
        document.documentElement.removeAttribute("style");
        window.location.reload();
    };

    // 4. Save Stub (Where the Backend API call would go)
    const handleSave = () => {
        console.log("Saving Theme Config:", colors);
        alert("Theme config logged to console (Backend integration pending)");
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
                        Customize Kura OS visual identity in real-time.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors"
                    >
                        <RotateCcw size={14} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </div>

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

            {/* Info Banner */}
            <div className="bg-ai/10 border border-ai/30 rounded-lg p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                    <p className="text-sm font-medium text-foreground">Live Preview Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Changes are applied instantly but will be lost on page refresh.
                        Click "Save Changes" to persist to the database (coming soon).
                    </p>
                </div>
            </div>
        </div>
    );
}
