'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListMetadata } from '@/lib/api';

interface PaginationToolbarProps {
    meta: ListMetadata;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function PaginationToolbar({
    meta,
    onPageChange,
    className
}: PaginationToolbarProps) {
    const { page, page_size, total, filtered } = meta;

    const startLine = (page - 1) * page_size + 1;
    const endLine = Math.min(page * page_size, filtered);
    const totalPages = Math.ceil(filtered / page_size);

    return (
        <div className={cn(
            "flex items-center justify-between px-4 py-3 border-t bg-muted/10",
            className
        )}>
            {/* Legend */}
            <div className="flex-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                    {filtered > 0 ? `${startLine}-${endLine}` : '0'}
                </span>
                {' '}de{' '}
                <span className="font-medium text-foreground">{filtered}</span>
                {filtered !== total && (
                    <span className="ml-1 opacity-70">
                        (total {total})
                    </span>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95 group"
                    title="Anterior"
                >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>

                <div className="flex items-center gap-1.5 px-3 h-9 rounded-lg border bg-muted/20 text-sm font-medium">
                    <span className="text-foreground">{page}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{totalPages || 1}</span>
                </div>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-95 group"
                    title="Siguiente"
                >
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                </button>
            </div>
        </div>
    );
}
