'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Command } from 'cmdk';
import { api } from '@/lib/api';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    FileText,
    Briefcase,
    Search,
    Sparkles,
    User,
    Loader2
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    shortcut?: string;
}

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
}

const NAVIGATION_ITEMS: CommandItem[] = [
    { id: 'dashboard', label: 'Ir a Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard', shortcut: '⌘D' },
    { id: 'patients', label: 'Ir a Clientes', icon: <Users className="w-4 h-4" />, path: '/patients', shortcut: '⌘P' },
    { id: 'calendar', label: 'Ir a Agenda', icon: <Calendar className="w-4 h-4" />, path: '/calendar', shortcut: '⌘A' },
    { id: 'bookings', label: 'Ir a Reservas', icon: <Briefcase className="w-4 h-4" />, path: '/bookings' },
    { id: 'forms', label: 'Ir a Formularios', icon: <FileText className="w-4 h-4" />, path: '/forms' },
    { id: 'settings', label: 'Ir a Configuración', icon: <Settings className="w-4 h-4" />, path: '/settings', shortcut: '⌘,' },
];

// Custom event name for opening from sidebar
const OPEN_COMMAND_EVENT = 'kura:open-command-palette';

/**
 * GlobalCommandPalette - "The Omni-Search"
 * 
 * A Spotlight-style command palette for rapid navigation and patient search.
 * Opens with ⌘K (Mac) or Ctrl+K (Windows), or via sidebar click.
 * 
 * @since v1.1.17 - The Omni-Search
 */
export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
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

        // Listen for custom event from sidebar
        const handleOpenEvent = () => setOpen(true);

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener(OPEN_COMMAND_EVENT, handleOpenEvent);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener(OPEN_COMMAND_EVENT, handleOpenEvent);
        };
    }, []);

    // Fetch patients when modal opens
    useEffect(() => {
        if (!open) return;

        const fetchPatients = async () => {
            setLoadingPatients(true);
            try {
                const response = await api.patients.list(1);
                const data = response.data || [];
                setPatients(data.slice(0, 50)); // Limit to 50 for performance
            } catch (error) {
                console.error('[CommandPalette] Failed to fetch patients:', error);
            } finally {
                setLoadingPatients(false);
            }
        };

        fetchPatients();
    }, [open]);

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

            {/* SR-only title for accessibility (cosmetic warning from Radix is acceptable) */}
            <h2 className="sr-only">Paleta de comandos - Navegación rápida</h2>

            {/* Command Panel */}
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl px-4">
                <div className="bg-background/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <Command.Input
                            placeholder="Escribe un comando o busca pacientes..."
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
                        <Command.Group heading="Navegación">
                            {NAVIGATION_ITEMS.map((item) => (
                                <Command.Item
                                    key={item.id}
                                    value={item.label}
                                    onSelect={() => handleSelect(item.path)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-foreground/80 hover:bg-muted/50 data-[selected=true]:bg-brand/10 data-[selected=true]:text-foreground transition-colors"
                                >
                                    <span className="text-muted-foreground">
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
                        </Command.Group>

                        {/* Patients Group */}
                        <Command.Group heading="Pacientes">
                            {loadingPatients ? (
                                <div className="flex items-center justify-center py-4 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    <span className="text-sm">Cargando pacientes...</span>
                                </div>
                            ) : patients.length > 0 ? (
                                patients.map((patient) => (
                                    <Command.Item
                                        key={patient.id}
                                        value={`${patient.first_name} ${patient.last_name} ${patient.email || ''}`}
                                        onSelect={() => handleSelect(`/patients/${patient.id}`)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-foreground/80 hover:bg-muted/50 data-[selected=true]:bg-brand/10 data-[selected=true]:text-foreground transition-colors"
                                    >
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                                {patient.first_name} {patient.last_name}
                                            </div>
                                            {patient.email && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {patient.email}
                                                </div>
                                            )}
                                        </div>
                                    </Command.Item>
                                ))
                            ) : (
                                <div className="py-3 px-3 text-sm text-muted-foreground">
                                    Sin pacientes registrados
                                </div>
                            )}
                        </Command.Group>
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

// Export helper function to open the palette from anywhere
export function openCommandPalette() {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_EVENT));
}
