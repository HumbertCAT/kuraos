'use client';

import { cn } from '@/lib/utils';

interface MobileSkeletonProps {
    /** Number of card skeletons to show */
    count?: number;
    /** Show header skeleton */
    showHeader?: boolean;
    /** Card variant */
    variant?: 'card' | 'list' | 'stats';
}

/**
 * MobileSkeletonLoader - Optimized loading skeletons for mobile views.
 * 
 * Pattern Library component for Mobile-First v1.7.4
 * 
 * Usage:
 * ```tsx
 * {isLoading ? <MobileSkeletonLoader count={5} /> : <ActualContent />}
 * ```
 */
export function MobileSkeletonLoader({
    count = 3,
    showHeader = false,
    variant = 'card',
}: MobileSkeletonProps) {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Header Skeleton */}
            {showHeader && (
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-muted rounded-lg" />
                    <div className="h-4 w-64 bg-muted/50 rounded" />
                </div>
            )}

            {/* Stats Row (3 mini cards) */}
            {variant === 'stats' && (
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4">
                            <div className="h-3 w-16 bg-muted rounded mb-2" />
                            <div className="h-6 w-12 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Card Skeletons */}
            {variant === 'card' && (
                <div className="space-y-3">
                    {[...Array(count)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-card border border-border rounded-xl p-4"
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0" />

                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-24 bg-muted/50 rounded" />
                                </div>

                                {/* Action */}
                                <div className="w-8 h-8 bg-muted rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List Skeletons (compact) */}
            {variant === 'list' && (
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                    {[...Array(count)].map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-40 bg-muted rounded" />
                                <div className="h-3 w-28 bg-muted/50 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * MobilePageSkeleton - Full page loading skeleton for mobile.
 */
export function MobilePageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Page Header */}
            <div className="space-y-2">
                <div className="h-4 w-20 bg-muted/50 rounded" />
                <div className="h-7 w-48 bg-muted rounded-lg" />
                <div className="h-4 w-64 bg-muted/50 rounded" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4">
                        <div className="h-3 w-16 bg-muted rounded mb-2" />
                        <div className="h-6 w-12 bg-muted rounded" />
                    </div>
                ))}
            </div>

            {/* Content Cards */}
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-card border border-border rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-muted rounded" />
                                <div className="h-3 w-24 bg-muted/50 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
