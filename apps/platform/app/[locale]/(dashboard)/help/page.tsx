import { Link } from '@/i18n/navigation';
import { HelpCircle, BookOpen, ArrowRight } from 'lucide-react';
import { HELP_CHAPTERS } from '@/lib/mdx';

interface Props {
    params: Promise<{ locale: string }>;
}

export default async function HelpCenterPage({ params }: Props) {
    const { locale } = await params;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-brand/10">
                    <HelpCircle className="w-8 h-8 text-brand" />
                </div>
                <div>
                    <h1 className="type-h1">Centro de Ayuda</h1>
                    <p className="type-body text-muted-foreground">
                        Guías rápidas para dominar KURA OS
                    </p>
                </div>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HELP_CHAPTERS.map((chapter) => (
                    <Link
                        key={chapter.slug}
                        href={`/help/${chapter.slug}`}
                        className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-brand/30 hover:shadow-lg transition-all"
                    >
                        <span className="text-3xl">{chapter.icon}</span>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors">
                                {chapter.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {chapter.description}
                            </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-brand group-hover:translate-x-1 transition-all" />
                    </Link>
                ))}
            </div>

            {/* Quick Help Note */}
            <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <p className="type-ui text-muted-foreground">
                        ¿No encuentras lo que buscas? Usa el{' '}
                        <span className="font-medium text-brand">Chat de Ayuda IA</span> en la esquina inferior derecha.
                    </p>
                </div>
            </div>
        </div>
    );
}
