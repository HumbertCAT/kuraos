'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Command } from 'cmdk';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    FileText,
    Briefcase,
    Search,
    Sparkles
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    shortcut?: string;
}

const NAVIGATION_ITEMS: CommandItem[] = [
    { id: 'dashboard', label: 'Ir a Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard', shortcut: '⌘D' },
    { id: 'patients', label: 'Ir a Clientes', icon: <Users className="w-4 h-4" />, path: '/patients', shortcut: '⌘P' },
    { id: 'calendar', label: 'Ir a Agenda', icon: <Calendar className="w-4 h-4" />, path: '/calendar', shortcut: '⌘A' },
    { id: 'bookings', label: 'Ir a Reservas', icon: <Briefcase className="w-4 h-4" />, path: '/bookings' },
    { id: 'forms', label: 'Ir a Formularios', icon: <FileText className="w-4 h-4" />, path: '/forms' },
    { id: 'settings', label: 'Ir a Configuración', icon: <Settings className="w-4 h-4" />, path: '/settings', shortcut: '⌘,' },
];

/**
 * GlobalCommandPalette - "The Omni-Search"
 * 
 * A Spotlight-style command palette for rapid navigation.
 * Opens with ⌘K (Mac) or Ctrl+K (Windows).
 * 
 * @since v1.1.17 - The Omni-Search
 */
export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Toggle listener for ⌘K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘K or Ctrl+K to toggle
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            // Escape to close
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = useCallback((path: string) => {
        setOpen(false);
        router.push(path);
    }, [router]);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Paleta de comandos global"
            className="fixed inset-0 z-50"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Visually Hidden Title for Screen Readers */}
            <div className="sr-only">
                <h2>Paleta de comandos - Navegación rápida</h2>
            </div>

            {/* Command Panel */}
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
                <div className="bg-background/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <Command.Input
                            placeholder="Escribe un comando o busca..."
                            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded border border-white/5">
                            ESC
                        </kbd>
                    </div>

                    {/* Commands List */}
                    <Command.List className="max-h-80 overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            No se encontraron resultados.
                        </Command.Empty>

                        {/* Navigation Group */}
                        <Command.Group heading="Navegación" className="px-2 py-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Navegación
                            </span>
                        </Command.Group>

                        {NAVIGATION_ITEMS.map((item) => (
                            <Command.Item
                                key={item.id}
                                value={item.label}
                                onSelect={() => handleSelect(item.path)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-foreground/80 hover:bg-muted/50 data-[selected=true]:bg-brand/10 data-[selected=true]:text-foreground transition-colors"
                            >
                                <span className="text-muted-foreground group-data-[selected=true]:text-brand">
                                    {item.icon}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                {item.shortcut && (
                                    <kbd className="text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                                        {item.shortcut}
                                    </kbd>
                                )}
                            </Command.Item>
                        ))}
                    </Command.List>

                    {/* Footer Hint */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded">↑↓</kbd>
                                navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted/50 rounded">↵</kbd>
                                seleccionar
                            </span>
                        </div>
                        <span className="text-muted-foreground/50">KURA OS v1.1.17</span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
}
