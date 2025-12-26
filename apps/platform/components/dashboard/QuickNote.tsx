'use client';

import { useState, useEffect, useRef } from 'react';
import { StickyNote } from 'lucide-react';

const STORAGE_KEY = 'kura-quick-note';

export function QuickNote() {
    const [note, setNote] = useState('');
    const [saved, setSaved] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setNote(stored);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNote(value);

        // Clear previous timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Debounced save to localStorage
        timeoutRef.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, value);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        }, 500);
    };

    const clearNote = () => {
        setNote('');
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-amber-500" />
                    <span className="type-h2 text-xs">Nota Rápida</span>
                </div>
                {saved && (
                    <span className="text-[10px] text-emerald-500 animate-pulse">Guardado</span>
                )}
            </div>
            <textarea
                value={note}
                onChange={handleChange}
                placeholder="Escribe una nota rápida..."
                className="w-full h-24 bg-muted/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-muted-foreground"
            />
            {note.length > 0 && (
                <button
                    onClick={clearNote}
                    className="mt-2 text-xs text-muted-foreground hover:text-risk transition-colors"
                >
                    Limpiar nota
                </button>
            )}
        </div>
    );
}
