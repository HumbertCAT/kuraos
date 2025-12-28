'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { CyberCard } from '@/components/ui/CyberCard';
import { Sun, Moon, Waves, Sunset } from 'lucide-react';

type ColorTheme = 'DEFAULT' | 'OCEAN' | 'SUNSET';

const THEMES: { id: ColorTheme; label: string; icon: React.ElementType; colors: { brand: string; bg: string } }[] = [
    {
        id: 'DEFAULT',
        label: 'Kura Original',
        icon: Sun,
        colors: { brand: '#0D9488', bg: '#F8FAFC' },
    },
    {
        id: 'OCEAN',
        label: 'Océano',
        icon: Waves,
        colors: { brand: '#0EA5E9', bg: '#F0F9FF' },
    },
    {
        id: 'SUNSET',
        label: 'Sunset',
        icon: Sunset,
        colors: { brand: '#F59E0B', bg: '#FFFBEB' },
    },
];

export default function AppearancePage() {
    const { theme, setTheme } = useTheme();
    const [colorTheme, setColorTheme] = useState<ColorTheme>('DEFAULT');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load color theme from localStorage or API
        const saved = localStorage.getItem('kura-color-theme') as ColorTheme;
        if (saved) setColorTheme(saved);
    }, []);

    const handleColorThemeChange = (newTheme: ColorTheme) => {
        setColorTheme(newTheme);
        localStorage.setItem('kura-color-theme', newTheme);
        // Apply data-theme attribute to document
        document.documentElement.setAttribute('data-theme', newTheme);
        // TODO: Save to backend /users/me
    };

    const handleModeChange = (mode: 'light' | 'dark') => {
        setTheme(mode);
    };

    if (!mounted) return null;

    const isDark = theme === 'dark';

    return (
        <div className="space-y-8">
            {/* Color Theme Section */}
            <CyberCard className="p-6">
                <h2 className="type-h2 text-foreground mb-2">Tema de Color</h2>
                <p className="type-body text-muted-foreground mb-6">
                    Elige la paleta de colores que prefieras para tu experiencia.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {THEMES.map((t) => {
                        const Icon = t.icon;
                        const isActive = colorTheme === t.id;

                        return (
                            <button
                                key={t.id}
                                onClick={() => handleColorThemeChange(t.id)}
                                className={`relative p-4 rounded-xl border-2 transition-all active:scale-95 ${isActive
                                    ? 'border-brand bg-brand/5'
                                    : 'border-border hover:border-brand/50 bg-card'
                                    }`}
                            >
                                {/* Color Preview */}
                                <div
                                    className="w-full h-20 rounded-lg mb-3 flex items-center justify-center"
                                    style={{ backgroundColor: t.colors.bg }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: t.colors.brand }}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Label */}
                                <span className="type-ui font-medium text-foreground">
                                    {t.label}
                                </span>

                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-brand" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </CyberCard>

            {/* Light/Dark Mode Section */}
            <CyberCard className="p-6">
                <h2 className="type-h2 text-foreground mb-2">Modo de Visualización</h2>
                <p className="type-body text-muted-foreground mb-6">
                    Elige entre modo claro y oscuro.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => handleModeChange('light')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all active:scale-95 ${!isDark
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:border-brand/50 bg-card'
                            }`}
                    >
                        <Sun className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                        <span className="type-ui font-medium text-foreground">Claro</span>
                    </button>

                    <button
                        onClick={() => handleModeChange('dark')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all active:scale-95 ${isDark
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:border-brand/50 bg-card'
                            }`}
                    >
                        <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                        <span className="type-ui font-medium text-foreground">Oscuro</span>
                    </button>
                </div>
            </CyberCard>
        </div>
    );
}
