import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { HELP_NAV, HELP_CHAPTERS } from '@/lib/mdx';

/**
 * Help Center Index Page
 * 
 * Shows the 4 Pillars with their articles.
 * The sidebar is provided by the layout.
 */
export default function HelpCenterPage() {
    const pillars = Object.entries(HELP_NAV);

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="type-h1 mb-2">Centro de Ayuda</h1>
                <p className="type-body text-muted-foreground">
                    Guías y documentación para dominar KURA OS.
                </p>
            </div>

            {/* Pillars Grid */}
            <div className="space-y-8">
                {pillars.map(([pillarId, pillar]) => (
                    <section key={pillarId}>
                        {/* Pillar Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">{pillar.icon}</span>
                            <h2 className="text-lg font-semibold text-foreground">{pillar.title}</h2>
                        </div>

                        {/* Articles Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pillar.items.map((slug) => {
                                const chapter = HELP_CHAPTERS[slug];
                                if (!chapter) return null;

                                return (
                                    <Link
                                        key={slug}
                                        href={`/help/${slug}`}
                                        className="group flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-brand/30 hover:shadow-md transition-all"
                                    >
                                        <span className="text-2xl">{chapter.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground group-hover:text-brand transition-colors truncate">
                                                {chapter.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {chapter.description}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* Quick Help */}
            <div className="mt-12 p-6 bg-muted/30 rounded-2xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">¿No encuentras lo que buscas?</h3>
                <p className="text-sm text-muted-foreground">
                    Usa el <span className="text-brand font-medium">Chat de Ayuda IA</span> en la esquina inferior derecha.
                    Está disponible 24/7 y conoce toda la documentación.
                </p>
            </div>
        </div>
    );
}
