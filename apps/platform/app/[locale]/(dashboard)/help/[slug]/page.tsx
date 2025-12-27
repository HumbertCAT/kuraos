import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getHelpContent, getChapter, parseMarkdown, getAllSlugs, HELP_NAV } from '@/lib/mdx';

interface Props {
    params: Promise<{ slug: string; locale: string }>;
}

export default async function HelpArticlePage({ params }: Props) {
    const { slug } = await params;

    // Get chapter metadata
    const chapter = getChapter(slug);
    if (!chapter) {
        notFound();
    }

    // Get content
    const content = getHelpContent(slug);

    // Get navigation (prev/next)
    const allSlugs = getAllSlugs();
    const currentIndex = allSlugs.indexOf(slug);
    const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
    const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
    const prevChapter = prevSlug ? getChapter(prevSlug) : null;
    const nextChapter = nextSlug ? getChapter(nextSlug) : null;

    if (!content) {
        return (
            <div className="max-w-3xl">
                <ChapterHeader chapter={chapter} icon={chapter.icon} />
                <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                    <p className="text-muted-foreground italic">
                        Esta guía estará disponible pronto.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl pb-20">
            {/* Header */}
            <ChapterHeader chapter={chapter} icon={chapter.icon} />

            {/* Content */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                <article className="prose prose-slate dark:prose-invert max-w-none">
                    {parseMarkdown(content)}
                </article>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                {prevSlug && prevChapter ? (
                    <Link
                        href={`/help/${prevSlug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-brand transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{prevChapter.icon} {prevChapter.title}</span>
                    </Link>
                ) : <div />}

                {nextSlug && nextChapter && (
                    <Link
                        href={`/help/${nextSlug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-brand transition-colors"
                    >
                        <span>{nextChapter.icon} {nextChapter.title}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}

function ChapterHeader({ chapter, icon }: { chapter: { title: string; description: string }; icon: string }) {
    return (
        <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl">{icon}</span>
            <div>
                <h1 className="type-h1">{chapter.title}</h1>
                <p className="type-body text-muted-foreground">{chapter.description}</p>
            </div>
        </div>
    );
}

// Generate static params for all articles
export function generateStaticParams() {
    return getAllSlugs().map((slug) => ({ slug }));
}
