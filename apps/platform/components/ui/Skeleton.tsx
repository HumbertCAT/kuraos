'use client';

interface SkeletonProps {
    className?: string;
}

/**
 * Skeleton - Animated loading placeholder with pulsing effect.
 * Use for indicating loading states in cards, lists, text, etc.
 */
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-slate-200 rounded ${className}`}
        />
    );
}

/**
 * SkeletonCard - A full card skeleton for list loading states.
 * Matches the ElevatedCard dimensions.
 */
export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-card rounded-xl border border-border p-4 ${className}`}>
            <div className="flex items-start gap-3">
                {/* Avatar skeleton */}
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    {/* Name skeleton */}
                    <Skeleton className="h-5 w-3/4" />
                    {/* Email skeleton */}
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        </div>
    );
}

/**
 * PatientCardSkeleton - Specific skeleton for patient list cards.
 */
export function PatientCardSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}

/**
 * FormCardSkeleton - Specific skeleton for form list cards.
 */
export function FormCardSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
}
