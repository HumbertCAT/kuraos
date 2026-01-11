'use client';

import { ChevronLeft, Search, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    title?: string;
    showBack?: boolean;
    showSearch?: boolean;
    showObservatory?: boolean;
    onSearchClick?: () => void;
    onObservatoryClick?: () => void;
}

/**
 * MobileHeader - Top navigation bar for mobile devices.
 * 
 * Features:
 * - Back button (optional)
 * - Page title
 * - Search trigger (⌘K palette)
 * - AletheIA Observatory trigger (bottom sheet)
 */
export function MobileHeader({
    title = 'Kura OS',
    showBack = false,
    showSearch = true,
    showObservatory = true,
    onSearchClick,
    onObservatoryClick,
}: MobileHeaderProps) {
    const router = useRouter();

    return (
        <header
            className={cn(
                // Base styles
                'sticky top-0 z-40',
                'bg-card/95 backdrop-blur-sm border-b border-border',
                'flex items-center justify-between',
                // Height + Safe Area (iPhone notch)
                'h-14 px-4 pt-[env(safe-area-inset-top)]',
                // Only show on mobile
                'md:hidden'
            )}
        >
            {/* Left: Back button or spacer */}
            <div className="flex items-center min-w-[44px]">
                {showBack ? (
                    <button
                        onClick={() => router.back()}
                        className={cn(
                            'flex items-center justify-center',
                            'h-10 w-10 -ml-2',
                            'text-muted-foreground hover:text-foreground',
                            'transition-colors'
                        )}
                        aria-label="Volver"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                ) : (
                    <span className="font-semibold text-lg text-foreground">
                        {title}
                    </span>
                )}
            </div>

            {/* Center: Title (when back button is shown) */}
            {showBack && (
                <span className="font-medium text-foreground truncate max-w-[50%]">
                    {title}
                </span>
            )}

            {/* Right: Action buttons */}
            <div className="flex items-center gap-1">
                {showSearch && (
                    <button
                        onClick={onSearchClick}
                        className={cn(
                            'flex items-center justify-center',
                            'h-10 w-10',
                            'text-muted-foreground hover:text-foreground',
                            'transition-colors'
                        )}
                        aria-label="Buscar"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                )}

                {showObservatory && (
                    <button
                        onClick={onObservatoryClick}
                        className={cn(
                            'flex items-center justify-center',
                            'h-10 w-10',
                            'text-muted-foreground hover:text-foreground',
                            'transition-colors'
                        )}
                        aria-label="AletheIA Observatory"
                    >
                        <Brain className="h-5 w-5" />
                    </button>
                )}
            </div>
        </header>
    );
}
