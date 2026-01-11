'use client';

import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down' | null;

/**
 * useScrollDirection - Detects scroll direction for mobile UX patterns.
 * 
 * Useful for:
 * - Auto-hiding FABs when scrolling down
 * - Showing/hiding toolbars based on scroll
 * 
 * @param threshold Minimum scroll delta before triggering (default: 10px)
 * @returns 'up' | 'down' | null
 * 
 * Usage:
 * ```tsx
 * const scrollDirection = useScrollDirection();
 * const showFab = scrollDirection !== 'down';
 * ```
 */
export function useScrollDirection(threshold = 10): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;

      // Only trigger if delta exceeds threshold
      if (Math.abs(delta) < threshold) {
        return;
      }

      const direction: ScrollDirection = delta > 0 ? 'down' : 'up';
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      
      setLastScrollY(scrollY);
    };

    // Debounced listener for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollDirection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, scrollDirection, threshold]);

  return scrollDirection;
}

/**
 * useScrollAtTop - Returns true if user is at the top of the page.
 * Useful for showing/hiding elements based on scroll position.
 */
export function useScrollAtTop(offset = 50): boolean {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY <= offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);

  return atTop;
}
