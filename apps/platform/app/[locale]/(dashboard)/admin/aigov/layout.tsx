'use client';

/**
 * AI Governance Layout
 * 
 * Shared layout with tab navigation for all AI Governance pages.
 * v1.4.6: Route-based tabs to eliminate flasheo.
 */

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Brain, Activity, Settings, TrendingUp, Play, Route } from 'lucide-react';

const TABS = [
    { id: 'routing', label: 'Routing', icon: Route, path: 'routing' },
    { id: 'models', label: 'Models', icon: Brain, path: 'models' },
    { id: 'ledger', label: 'Ledger', icon: TrendingUp, path: 'ledger' },
    { id: 'logs', label: 'Logs', icon: Activity, path: 'logs' },
    { id: 'run', label: 'Run', icon: Play, path: 'run' },
];

export default function AiGovLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const params = useParams();
    const locale = params.locale as string || 'es';

    // Determine active tab from pathname
    const activeTab = TABS.find(tab => pathname.includes(`/aigov/${tab.path}`))?.id || 'routing';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">AI Governance</h2>
                        <p className="text-sm text-muted-foreground">Multi-Model Intelligence Engine</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <Link
                            key={tab.id}
                            href={`/${locale}/admin/aigov/${tab.path}`}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {children}
            </div>
        </div>
    );
}
