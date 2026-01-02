'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, List, Heading2 } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
    /** Markdown content */
    value: string;
    /** Called with markdown string on change */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Minimum height of the editor */
    minHeight?: string;
    /** Whether the editor is disabled */
    disabled?: boolean;
}

/**
 * RichTextEditor - A Notion-like WYSIWYG editor powered by TipTap.
 * 
 * Features:
 * - Markdown shortcuts (# for headings, - for lists, **bold**, etc.)
 * - Floating bubble menu on text selection
 * - Stores and outputs clean Markdown
 * - Tailwind-styled prose output
 */
export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Escribe aquí...',
    className = '',
    minHeight = '150px',
    disabled = false,
}: RichTextEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            BubbleMenuExtension.configure({
                // Extension config if needed
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-brand underline decoration-brand/50 underline-offset-2 hover:text-foreground',
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
            }),
            Markdown.configure({
                html: false,
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ],
        content: value,
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'focus:outline-none cursor-text',
                style: `min-height: ${minHeight}`,
            },
        },
        onUpdate: ({ editor }) => {
            const markdown = editor.storage.markdown.getMarkdown();
            onChange(markdown);
        },
        immediatelyRender: false,
    });

    // Sync external value changes (e.g., form reset)
    useEffect(() => {
        if (editor && !editor.isFocused) {
            const currentMarkdown = editor.storage.markdown?.getMarkdown() || '';
            if (value !== currentMarkdown) {
                editor.commands.setContent(value || '');
            }
        }
    }, [value, editor]);

    // Update editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    if (!editor) {
        return (
            <div
                className={`w-full border border-border rounded-xl bg-muted p-4 animate-pulse ${className}`}
                style={{ minHeight }}
            >
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
            </div>
        );
    }

    return (
        <div className={`relative w-full border border-border rounded-xl bg-input transition-all 
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-border'}
            focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand ${className}`}
        >
            {/* Bubble Menu - appears on text selection */}
            {editor && !disabled && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{
                        duration: 100,
                        placement: 'top',
                        appendTo: () => document.body,
                    }}
                    shouldShow={({ editor, state }) => {
                        // Only show when there's a text selection and editor is focused
                        const { from, to } = state.selection;
                        return from !== to && editor.isFocused;
                    }}
                    className="flex items-center gap-0.5 px-1 py-1 bg-card rounded-lg shadow-lg border border-border"
                >
                    <BubbleButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        title="Negrita"
                    >
                        <Bold className="w-4 h-4" />
                    </BubbleButton>
                    <BubbleButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        title="Cursiva"
                    >
                        <Italic className="w-4 h-4" />
                    </BubbleButton>

                    <div className="w-px h-4 bg-border mx-1" />

                    <BubbleButton
                        onClick={() => {
                            if (editor.isActive('heading', { level: 2 })) {
                                editor.chain().focus().setParagraph().run();
                            } else {
                                editor.chain().focus().setHeading({ level: 2 }).run();
                            }
                        }}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Título"
                    >
                        <Heading2 className="w-4 h-4" />
                    </BubbleButton>
                    <BubbleButton
                        onClick={() => {
                            if (editor.isActive('bulletList')) {
                                editor.chain().focus().liftListItem('listItem').run();
                            } else {
                                editor.chain().focus().toggleBulletList().run();
                            }
                        }}
                        isActive={editor.isActive('bulletList')}
                        title="Lista"
                    >
                        <List className="w-4 h-4" />
                    </BubbleButton>
                </BubbleMenu>
            )}

            {/* Editor Content */}
            <div className="p-4">
                <EditorContent
                    editor={editor}
                    className="prose prose-slate prose-sm max-w-none
                        prose-headings:font-semibold prose-headings:text-foreground
                        prose-h1:text-xl prose-h1:mb-3
                        prose-h2:text-lg prose-h2:mb-2
                        prose-h3:text-base prose-h3:mb-2
                        prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3
                        prose-ul:text-foreground prose-ul:mb-3 prose-ul:pl-4
                        prose-ol:text-foreground prose-ol:mb-3 prose-ol:pl-4
                        prose-li:my-0.5
                        prose-strong:text-foreground prose-strong:font-bold
                        prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/70
                        [&_.ProseMirror]:text-foreground
                        [&_.ProseMirror_p]:text-foreground
                        [&_.ProseMirror-selectednode]:bg-blue-100
                        selection:bg-brand/20 selection:text-foreground"
                />
            </div>

            {/* Markdown hint */}
            <div className="absolute right-3 bottom-2 text-[10px] text-muted-foreground pointer-events-none select-none flex items-center gap-2">
                <span className="hidden sm:inline">**bold** | # heading | - list</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Markdown</span>
            </div>
        </div>
    );
}

/** Helper component for bubble menu buttons */
function BubbleButton({
    onClick,
    isActive,
    children,
    title
}: {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${isActive
                ? 'text-foreground bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
        >
            {children}
        </button>
    );
}
