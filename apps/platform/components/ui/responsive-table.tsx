'use client';

import { cn } from '@/lib/utils';

interface Column<T> {
    key: keyof T | string;
    header: string;
    /** Render function for custom cell content */
    render?: (item: T) => React.ReactNode;
    /** Hide on mobile (renders in card instead) */
    hideOnMobile?: boolean;
    /** Primary field for card title */
    isPrimary?: boolean;
    /** Secondary field for card subtitle */
    isSecondary?: boolean;
}

interface ResponsiveTableProps<T> {
    data: T[];
    columns: Column<T>[];
    /** Key field for React keys */
    keyField: keyof T;
    /** Optional click handler for rows/cards */
    onRowClick?: (item: T) => void;
    /** Loading state */
    isLoading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Card component override for fully custom mobile rendering */
    renderCard?: (item: T) => React.ReactNode;
}

/**
 * ResponsiveTable - Table on desktop, cards on mobile.
 * 
 * Pattern Library component for Mobile-First v1.7.1
 * 
 * Pure HTML table on desktop, card grid on mobile.
 * No shadcn dependencies.
 * 
 * Usage:
 * ```tsx
 * <ResponsiveTable
 *   data={patients}
 *   keyField="id"
 *   columns={[
 *     { key: 'name', header: 'Nombre', isPrimary: true },
 *     { key: 'email', header: 'Email', isSecondary: true },
 *     { key: 'status', header: 'Estado', render: (p) => <Badge>{p.status}</Badge> },
 *   ]}
 *   onRowClick={(patient) => openSheet(patient.id)}
 * />
 * ```
 */
export function ResponsiveTable<T extends Record<string, unknown>>({
    data,
    columns,
    keyField,
    onRowClick,
    isLoading,
    emptyMessage = 'No hay datos disponibles',
    renderCard,
}: ResponsiveTableProps<T>) {
    // Get primary and secondary columns for card header
    const primaryCol = columns.find((c) => c.isPrimary);
    const secondaryCol = columns.find((c) => c.isSecondary);

    // Default card renderer
    const defaultRenderCard = (item: T) => {
        const primaryValue = primaryCol
            ? primaryCol.render
                ? primaryCol.render(item)
                : String(item[primaryCol.key as keyof T] ?? '')
            : '';

        const secondaryValue = secondaryCol
            ? secondaryCol.render
                ? secondaryCol.render(item)
                : String(item[secondaryCol.key as keyof T] ?? '')
            : '';

        // Get remaining columns (not primary/secondary)
        const detailCols = columns.filter(
            (c) => !c.isPrimary && !c.isSecondary && !c.hideOnMobile
        );

        return (
            <div
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={cn(
                    'bg-card border border-border rounded-lg p-4 mb-3',
                    'active:scale-[0.98] transition-transform',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                )}
            >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-foreground truncate">
                        {primaryValue}
                    </div>
                </div>

                {secondaryValue && (
                    <div className="text-sm text-muted-foreground mb-3 truncate">
                        {secondaryValue}
                    </div>
                )}

                {/* Card Details */}
                {detailCols.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {detailCols.map((col) => (
                            <div key={String(col.key)} className="flex flex-col">
                                <span className="text-muted-foreground text-xs">
                                    {col.header}
                                </span>
                                <span className="text-foreground">
                                    {col.render
                                        ? col.render(item)
                                        : String(item[col.key as keyof T] ?? '-')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-muted/50 animate-pulse rounded-lg h-24 md:h-12"
                    />
                ))}
            </div>
        );
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {/* Desktop: Traditional Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className="text-left text-sm font-medium text-muted-foreground px-4 py-3"
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr
                                key={String(item[keyField])}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    'border-b border-border last:border-0',
                                    'transition-colors',
                                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className="text-sm text-foreground px-4 py-3"
                                    >
                                        {col.render
                                            ? col.render(item)
                                            : String(item[col.key as keyof T] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: Card Stack */}
            <div className="md:hidden">
                {data.map((item) =>
                    renderCard ? renderCard(item) : defaultRenderCard(item)
                )}
            </div>
        </>
    );
}
