import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

// Chapter metadata (must match CHAPTERS in help/page.tsx)
const CHAPTERS = [
    { slug: 'primeros-pasos', title: 'Primeros Pasos', icon: '🚀' },
    { slug: 'pacientes', title: 'Pacientes', icon: '👥' },
    { slug: 'diario-clinico', title: 'Diario Clínico', icon: '📝' },
    { slug: 'formularios', title: 'Formularios', icon: '📋' },
    { slug: 'reservas', title: 'Reservas', icon: '📅' },
    { slug: 'automatizaciones', title: 'Automatizaciones', icon: '⚡' },
    { slug: 'whatsapp', title: 'WhatsApp & AletheIA', icon: '💬' },
    { slug: 'facturacion', title: 'Facturación', icon: '💳' },
];

interface Props {
    params: Promise<{ chapter: string; locale: string }>;
}

export default async function ChapterPage({ params }: Props) {
    const { chapter, locale } = await params;

    // Find chapter metadata
    const chapterIndex = CHAPTERS.findIndex(c => c.slug === chapter);
    if (chapterIndex === -1) {
        notFound();
    }

    const currentChapter = CHAPTERS[chapterIndex];
    const prevChapter = chapterIndex > 0 ? CHAPTERS[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < CHAPTERS.length - 1 ? CHAPTERS[chapterIndex + 1] : null;

    // Read MDX content (Server Component)
    const contentDir = path.join(process.cwd(), 'content', 'help', locale === 'en' ? 'en' : 'es');
    const filePath = path.join(contentDir, `${chapter}.mdx`);

    let content = '';
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch {
        // Fallback to Spanish if locale not available
        try {
            const fallbackPath = path.join(process.cwd(), 'content', 'help', 'es', `${chapter}.mdx`);
            content = fs.readFileSync(fallbackPath, 'utf-8');
        } catch {
            content = `# ${currentChapter.title}\n\n> Esta guía estará disponible pronto.`;
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/settings/help"
                    className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Ayuda
                </Link>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl">{currentChapter.icon}</span>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{currentChapter.title}</h1>
                    <p className="text-foreground/60 text-sm">Guía de referencia rápida</p>
                </div>
            </div>

            {/* Content */}
            <div className="prose prose-slate max-w-none">
                <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                    {/* Render markdown content as HTML-safe text for now */}
                    {/* TODO: Use proper MDX rendering with compile() */}
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                        {content.split('\n').map((line, i) => {
                            // Basic markdown rendering
                            if (line.startsWith('# ')) {
                                return <h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>;
                            }
                            if (line.startsWith('## ')) {
                                return <h2 key={i} className="text-xl font-semibold text-foreground mt-8 mb-4">{line.slice(3)}</h2>;
                            }
                            if (line.startsWith('> ')) {
                                return <blockquote key={i} className="border-l-4 border-teal-500 pl-4 italic text-foreground/70 my-4">{line.slice(2)}</blockquote>;
                            }
                            if (line.startsWith('---')) {
                                return <hr key={i} className="my-8 border-border" />;
                            }
                            if (line.startsWith('- ')) {
                                return <li key={i} className="ml-4 text-foreground">{line.slice(2)}</li>;
                            }
                            if (line.match(/^\d+\. /)) {
                                return <li key={i} className="ml-4 list-decimal text-foreground">{line.replace(/^\d+\. /, '')}</li>;
                            }
                            if (line.startsWith('💡') || line.startsWith('⚠️')) {
                                return <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-xl my-4">{line}</div>;
                            }
                            if (line.trim() === '') {
                                return <br key={i} />;
                            }
                            // Bold text
                            const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                            return <p key={i} className="my-2" dangerouslySetInnerHTML={{ __html: boldLine }} />;
                        })}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                {prevChapter ? (
                    <Link
                        href={`/settings/help/${prevChapter.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-teal-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {prevChapter.icon} {prevChapter.title}
                    </Link>
                ) : <div />}

                {nextChapter && (
                    <Link
                        href={`/settings/help/${nextChapter.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-teal-600 transition-colors"
                    >
                        {nextChapter.icon} {nextChapter.title}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}

// Generate static params for all chapters
export function generateStaticParams() {
    return CHAPTERS.map((chapter) => ({
        chapter: chapter.slug,
    }));
}
