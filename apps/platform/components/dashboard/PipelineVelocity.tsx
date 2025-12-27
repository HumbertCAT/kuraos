'use client';

import { Link } from '@/i18n/navigation';
import { Users, UserPlus, MessageCircle, Handshake, ChevronRight } from 'lucide-react';

interface PipelineStage {
    key: string;
    label: string;
    count: number;
    color: string; // Tailwind color class
    icon: React.ReactNode;
}

interface PipelineVelocityProps {
    stages?: PipelineStage[];
}

const DEFAULT_STAGES: PipelineStage[] = [
    { key: 'new', label: 'Nuevos', count: 2, color: 'bg-success', icon: <UserPlus className="w-4 h-4" /> },
    { key: 'contacted', label: 'Contactados', count: 5, color: 'bg-warning', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'closing', label: 'Cierre', count: 1, color: 'bg-brand', icon: <Handshake className="w-4 h-4" /> },
];

/**
 * PipelineVelocity - "The Future"
 * 
 * Shows the flow of leads through the sales pipeline.
 * Philosophy: Quick visibility into what's coming.
 */
export function PipelineVelocity({ stages = DEFAULT_STAGES }: PipelineVelocityProps) {
    const totalLeads = stages.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="card bg-card/80 backdrop-blur-sm border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand" />
                    <h3 className="type-ui text-muted-foreground tracking-wider">FLUJO DE PACIENTES</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{totalLeads} total</span>
            </div>

            {/* Pipeline Stages */}
            <div className="space-y-3">
                {stages.map((stage, index) => (
                    <div key={stage.key} className="flex items-center gap-3">
                        {/* Stage Indicator */}
                        <div className={`w-8 h-8 rounded-lg ${stage.color}/10 flex items-center justify-center`}>
                            <span className={`${stage.color.replace('bg-', 'text-')}`}>
                                {stage.icon}
                            </span>
                        </div>

                        {/* Label & Count */}
                        <div className="flex-1 flex items-center justify-between">
                            <span className="type-body text-foreground">{stage.label}</span>
                            <span className="type-h3 font-mono text-foreground">{stage.count}</span>
                        </div>

                        {/* Connector Arrow (except last) */}
                        {index < stages.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/30 absolute -right-2 hidden" />
                        )}
                    </div>
                ))}
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    {stages.map((stage) => (
                        <div
                            key={stage.key}
                            className={`${stage.color} transition-all`}
                            style={{ width: `${(stage.count / totalLeads) * 100}%` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Conversión estimada</span>
                    <span className="text-xs text-success font-medium">
                        {Math.round((stages[stages.length - 1]?.count / totalLeads) * 100)}%
                    </span>
                </div>
            </div>

            {/* Action */}
            <Link
                href="/leads"
                className="btn btn-ghost btn-sm w-full mt-3 justify-center text-muted-foreground"
            >
                Ver Pipeline Completo
                <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
