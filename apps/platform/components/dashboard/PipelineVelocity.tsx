'use client';

import { Link } from '@/i18n/navigation';
import { Users, UserPlus, MessageCircle, Handshake, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PipelineStage {
    key: string;
    labelKey: 'new' | 'contacted' | 'closing';
    count: number;
    color: string; // Tailwind color class
    icon: React.ReactNode;
}

interface PipelineVelocityProps {
    stages?: PipelineStage[];
}

/**
 * PipelineVelocity - "The Future"
 * 
 * Shows the flow of leads through the sales pipeline.
 * Philosophy: Quick visibility into what's coming.
 * 
 * @requires Dashboard must pass `stages` prop with real lead data.
 * @since v1.1.16 - Wired to real data, no more mock fallback.
 */
export function PipelineVelocity({ stages = [] }: PipelineVelocityProps) {
    const t = useTranslations('Dashboard.pipeline');

    const pipelineStages = stages;
    const totalLeads = pipelineStages.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand" />
                    <h3 className="type-ui text-muted-foreground tracking-wider">{t('title')}</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{totalLeads} {t('total')}</span>
            </div>

            {/* Pipeline Stages */}
            <div className="space-y-3">
                {pipelineStages.map((stage, index) => (
                    <div key={stage.key} className="flex items-center gap-3">
                        {/* Stage Indicator */}
                        <div className={`w-8 h-8 rounded-lg ${stage.color}/10 flex items-center justify-center`}>
                            <span className={`${stage.color.replace('bg-', 'text-')}`}>
                                {stage.icon}
                            </span>
                        </div>

                        {/* Label & Count */}
                        <div className="flex-1 flex items-center justify-between">
                            <span className="type-body text-foreground">{t(stage.labelKey)}</span>
                            <span className="type-h3 font-mono text-foreground">{stage.count}</span>
                        </div>

                        {/* Connector Arrow (except last) */}
                        {index < pipelineStages.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 absolute -right-2 hidden" />
                        )}
                    </div>
                ))}
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    {pipelineStages.map((stage) => (
                        <div
                            key={stage.key}
                            className={`${stage.color} transition-all`}
                            style={{ width: `${(stage.count / totalLeads) * 100}%` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{t('estimatedConversion')}</span>
                    <span className="text-xs text-success font-medium">
                        {Math.round((pipelineStages[pipelineStages.length - 1]?.count / totalLeads) * 100)}%
                    </span>
                </div>
            </div>

            {/* Action */}
            <Link
                href="/leads"
                className="btn btn-ghost btn-sm w-full mt-3 justify-center text-muted-foreground"
            >
                {t('viewFullPipeline')}
                <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
