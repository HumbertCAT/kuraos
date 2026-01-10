'use client';

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDetailSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    /** Show back button instead of X */
    showBackButton?: boolean;
    /** Footer actions */
    footer?: React.ReactNode;
    /** Desktop width (default: 500px) */
    width?: string;
}

/**
 * MobileDetailSheet - Slide-over on desktop, full-screen on mobile.
 * 
 * Pattern Library component for Mobile-First v1.7.1
 * 
 * Uses portal for proper z-index layering.
 * Pure React/CSS implementation (no shadcn deps).
 */
export function MobileDetailSheet({
    open,
    onClose,
    title,
    children,
    showBackButton = true,
    footer,
    width = '500px',
}: MobileDetailSheetProps) {
    // Close on Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, handleEscape]);

    if (!open) return null;

    // Only render portal on client
    if (typeof window === 'undefined') return null;

    const content = (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 transition-opacity"
                onClick={onClose}
            />

            {/* Desktop: Right-side panel */}
            <div
                className={cn(
                    // Only show on desktop
                    'hidden md:flex',
                    // Positioning
                    'absolute right-0 top-0 bottom-0',
                    'flex-col bg-card border-l border-border',
                    // Animation
                    'animate-in slide-in-from-right duration-300'
                )}
                style={{ width }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="font-semibold text-lg text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-border">
                        {footer}
                    </div>
                )}
            </div>

            {/* Mobile: Full-screen modal */}
            <div
                className={cn(
                    // Only show on mobile
                    'md:hidden',
                    // Full screen
                    'absolute inset-0',
                    'flex flex-col bg-background',
                    // Safe areas
                    'pt-[env(safe-area-inset-top)]',
                    // Animation
                    'animate-in slide-in-from-bottom duration-300'
                )}
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border min-h-14">
                    {showBackButton ? (
                        <button
                            onClick={onClose}
                            className="h-10 w-10 -ml-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}

                    <h2 className="font-semibold text-foreground truncate max-w-[60%]">
                        {title}
                    </h2>

                    {!showBackButton ? (
                        <button
                            onClick={onClose}
                            className="h-10 w-10 -mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>

                {/* Mobile Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {children}
                </div>

                {/* Mobile Footer */}
                {footer && (
                    <div
                        className={cn(
                            'px-4 py-4 border-t border-border',
                            'pb-[calc(1rem+env(safe-area-inset-bottom))]'
                        )}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
