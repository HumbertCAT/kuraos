import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getHelpPost, HELP_CHAPTERS } from '@/lib/mdx';

interface Props {
    params: Promise<{ slug: string; locale: string }>;
}

export default async function HelpArticlePage({ params }: Props) {
    const { slug, locale } = await params;

    // Find chapter metadata
    const chapterIndex = HELP_CHAPTERS.findIndex(c => c.slug === slug);
    if (chapterIndex === -1) {
        notFound();
    }

    const currentChapter = HELP_CHAPTERS[chapterIndex];
    const prevChapter = chapterIndex > 0 ? HELP_CHAPTERS[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < HELP_CHAPTERS.length - 1 ? HELP_CHAPTERS[chapterIndex + 1] : null;

    // Fetch MDX content
    const post = await getHelpPost(locale, slug);

    if (!post) {
        // Show placeholder if MDX file doesn't exist yet
        return (
            <div className="max-w-3xl mx-auto">
                <Breadcrumb />
                <ChapterHeader chapter={currentChapter} />
                <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                    <p className="text-muted-foreground italic">
                        Esta guía estará disponible pronto.
                    </p>
                </div>
                <Navigation prev={prevChapter} next={nextChapter} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <Breadcrumb />
            <ChapterHeader chapter={currentChapter} />

            {/* MDX Content */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm prose prose-slate max-w-none dark:prose-invert">
                {post.content}
            </div>

            <Navigation prev={prevChapter} next={nextChapter} />
        </div>
    );
}

function Breadcrumb() {
    return (
        <div className="mb-6">
            <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Ayuda
            </Link>
        </div>
    );
}

function ChapterHeader({ chapter }: { chapter: typeof HELP_CHAPTERS[0] }) {
    return (
        <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl">{chapter.icon}</span>
            <div>
                <h1 className="type-h1">{chapter.title}</h1>
                <p className="type-body text-muted-foreground">{chapter.description}</p>
            </div>
        </div>
    );
}

function Navigation({
    prev,
    next
}: {
    prev: typeof HELP_CHAPTERS[0] | null;
    next: typeof HELP_CHAPTERS[0] | null;
}) {
    return (
        <div className="flex justify-between mt-8">
            {prev ? (
                <Link
                    href={`/help/${prev.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-brand transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {prev.icon} {prev.title}
                </Link>
            ) : <div />}

            {next && (
                <Link
                    href={`/help/${next.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-brand transition-colors"
                >
                    {next.icon} {next.title}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}

// Generate static params for all chapters (Vercel SSG)
export function generateStaticParams() {
    return HELP_CHAPTERS.map((chapter) => ({
        slug: chapter.slug,
    }));
}
