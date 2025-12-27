'use client';

import { useState, useEffect, useRef } from 'react';
import { Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'kura-quick-note';

export function QuickNote() {
    const t = useTranslations('Dashboard.quickNote');
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
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="type-ui text-amber-700 dark:text-amber-400">{t('title')}</span>
                </div>
                {saved && (
                    <span className="type-ui text-success animate-pulse">✓</span>
                )}
            </div>
            <textarea
                value={note}
                onChange={handleChange}
                placeholder={`💡 ${t('placeholder')}`}
                className="w-full h-24 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none placeholder:text-amber-400/50 dark:placeholder:text-amber-500/30 text-foreground"
            />
            {note.length > 0 && (
                <button
                    onClick={clearNote}
                    className="type-body text-muted-foreground hover:text-risk transition-colors"
                >
                    {t('clear')}
                </button>
            )}
        </div>
    );
}
