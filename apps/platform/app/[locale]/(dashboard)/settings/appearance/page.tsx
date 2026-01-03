'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { CyberCard } from '@/components/ui/CyberCard';
import { Sun, Moon, Waves, Sunset, Palette } from 'lucide-react';

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

    // Gradient texture state
    const [gradientStart, setGradientStart] = useState('#247C7D');
    const [gradientEnd, setGradientEnd] = useState('#004F53');

    useEffect(() => {
        setMounted(true);
        // Load color theme from localStorage or API
        const saved = localStorage.getItem('kura-color-theme') as ColorTheme;
        if (saved) setColorTheme(saved);

        // Load gradient settings
        const savedGradientStart = localStorage.getItem('kura-gradient-start');
        const savedGradientEnd = localStorage.getItem('kura-gradient-end');
        if (savedGradientStart) setGradientStart(savedGradientStart);
        if (savedGradientEnd) setGradientEnd(savedGradientEnd);
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

    const handleGradientChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setGradientStart(value);
            localStorage.setItem('kura-gradient-start', value);
            document.documentElement.style.setProperty('--gradient-start', value);
        } else {
            setGradientEnd(value);
            localStorage.setItem('kura-gradient-end', value);
            document.documentElement.style.setProperty('--gradient-end', value);
        }
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

            {/* Texture & Gradients Section */}
            <CyberCard className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Palette className="w-5 h-5 text-brand" />
                    <h2 className="type-h2 text-foreground">Texturas & Degradados</h2>
                </div>
                <p className="type-body text-muted-foreground mb-6">
                    Personaliza los degradados sutiles que dan profundidad a la interfaz.
                </p>

                <div className="space-y-6">
                    {/* Color Inputs Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Gradient Start */}
                        <div className="space-y-2">
                            <label className="type-ui font-medium text-foreground">
                                Gradient Start
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={gradientStart}
                                    onChange={(e) => handleGradientChange('start', e.target.value)}
                                    className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                                />
                                <input
                                    type="text"
                                    value={gradientStart}
                                    onChange={(e) => handleGradientChange('start', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:ring-2 focus:ring-brand/50 outline-none"
                                    placeholder="#247C7D"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Color inicial del degradado (izquierda)</p>
                        </div>

                        {/* Gradient End */}
                        <div className="space-y-2">
                            <label className="type-ui font-medium text-foreground">
                                Gradient End
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={gradientEnd}
                                    onChange={(e) => handleGradientChange('end', e.target.value)}
                                    className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                                />
                                <input
                                    type="text"
                                    value={gradientEnd}
                                    onChange={(e) => handleGradientChange('end', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:ring-2 focus:ring-brand/50 outline-none"
                                    placeholder="#004F53"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Color final del degradado (derecha)</p>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="space-y-2">
                        <label className="type-ui font-medium text-foreground">
                            Vista Previa
                        </label>
                        <div
                            className="h-16 rounded-xl border border-border overflow-hidden"
                            style={{
                                background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`
                            }}
                        />
                        <div
                            className="h-12 rounded-xl border border-border overflow-hidden"
                            style={{
                                background: `linear-gradient(to right, ${gradientStart}1A, transparent)`
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Arriba: Degradado completo • Abajo: Degradado sutil (10% opacidad) usado en headers
                        </p>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={() => {
                            handleGradientChange('start', '#247C7D');
                            handleGradientChange('end', '#004F53');
                        }}
                        className="text-sm text-muted-foreground hover:text-brand transition-colors"
                    >
                        ↺ Restaurar valores por defecto
                    </button>
                </div>
            </CyberCard>
        </div>
    );
}

