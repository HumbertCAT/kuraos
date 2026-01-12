'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';

/**
 * PWAUpdater - The "Skip Waiting" Pattern
 * 
 * Detects when a new service worker version is ready and prompts
 * the user to update immediately instead of waiting for tab close.
 */
export function PWAUpdater() {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // Register the service worker
        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                console.log('[PWA] Service Worker registered');

                // Check for waiting SW on registration
                if (reg.waiting) {
                    console.log('[PWA] Update found waiting on load');
                    setRegistration(reg);
                    setNeedsUpdate(true);
                }

                // Listen for new service worker installing
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version installed, waiting to activate
                            console.log('[PWA] New version available!');
                            setRegistration(reg);
                            setNeedsUpdate(true);
                        }
                    });
                });
            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        };

        registerSW();

        // Listen for controller change (after skipWaiting)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            console.log('[PWA] Controller changed, reloading...');
            window.location.reload();
        });
    }, []);

    const handleUpdate = useCallback(() => {
        if (!registration?.waiting) {
            // Fallback: just reload if no waiting worker
            window.location.reload();
            return;
        }

        // Send SKIP_WAITING message to service worker
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }, [registration]);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
    }, []);

    // Don't render if no update or dismissed
    if (!needsUpdate || dismissed) return null;

    return (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-card border border-border shadow-2xl p-4 rounded-2xl flex items-center justify-between gap-3">
                {/* Info Section */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="bg-warning/10 p-2.5 rounded-xl text-warning shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">Actualización disponible</h4>
                        <p className="text-xs text-muted-foreground truncate">Nueva versión de Kura OS lista.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Más tarde"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <CyberButton
                        variant="highlight"
                        size="sm"
                        onClick={handleUpdate}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar
                    </CyberButton>
                </div>
            </div>
        </div>
    );
}
