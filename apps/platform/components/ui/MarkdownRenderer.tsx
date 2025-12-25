'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
    /** Markdown content to render */
    content: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * MarkdownRenderer - Renders Markdown content as styled HTML.
 * Uses simple regex-based parsing for common Markdown patterns.
 * For full-featured editing, use RichTextEditor instead.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const html = useMemo(() => {
        if (!content) return '';

        let result = content
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers
            .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium text-foreground mt-4 mb-2">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-foreground mt-5 mb-2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-3">$1</h1>')
            // Bold and Italic
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-semibold text-foreground"><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
            .replace(/__(.+?)__/g, '<strong class="font-semibold text-foreground">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
            .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
            // Lists
            .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-foreground/70">$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-foreground/70">$2</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p class="mb-3 text-foreground/70 leading-relaxed">')
            .replace(/\n/g, '<br />');

        // Wrap in paragraph if not already wrapped
        if (!result.startsWith('<h') && !result.startsWith('<li')) {
            result = `<p class="mb-3 text-foreground/70 leading-relaxed">${result}</p>`;
        }

        return result;
    }, [content]);

    return (
        <div
            className={`prose prose-slate prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
