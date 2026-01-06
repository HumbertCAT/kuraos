'use client';

import { useEffect } from 'react';

/**
 * HydrationMarker - Anti-Flake Strategy for E2E Tests
 * 
 * Sets `data-hydrated="true"` on document.body when React hydration completes.
 * Playwright tests can wait for this attribute before interacting with the page.
 * 
 * @example Playwright usage:
 * await page.waitForSelector('body[data-hydrated="true"]');
 */
export function HydrationMarker() {
    useEffect(() => {
        document.body.setAttribute('data-hydrated', 'true');

        // Cleanup on unmount (unlikely but good practice)
        return () => {
            document.body.removeAttribute('data-hydrated');
        };
    }, []);

    return null;
}
