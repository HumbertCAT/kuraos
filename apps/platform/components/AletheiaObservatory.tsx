'use client';

import { BrainCircuit, Mic, Activity, AlertTriangle } from 'lucide-react';
import { CyberButton } from './ui/CyberButton';

/**
 * AletheiaObservatory - Right Sidebar HUD Component
 * 
 * Real-time clinical intelligence display.
 * Light mode: Clean, minimal look
 * Dark mode: Tactical HUD style
 */

interface ObservatoryProps {
    riskScore?: number;
    riskTrend?: 'positive' | 'negative' | 'stable';
    className?: string;
}

export default function AletheiaObservatory({
    riskScore = -0.90,
    riskTrend = 'negative',
    className
}: ObservatoryProps) {
    const riskPercentage = Math.abs(riskScore) * 100;
    const isHighRisk = riskScore < -0.5;

    return (
        <aside className={`hidden xl:flex w-80 flex-col border-l border-sidebar-border bg-sidebar p-4 gap-6 font-mono ${className}`}>
            {/* HEADER */}
            <div className="border-b border-sidebar-border pb-4">
                <div className="flex items-center gap-2 text-ai mb-1">
                    <BrainCircuit size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">AletheIA Observatory</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Real-time inference engine v2.4.1</p>
            </div>

            {/* RISK WIDGET */}
            <div className="bg-card rounded p-4 border border-border relative">
                <span className="text-[10px] text-muted-foreground block mb-2 uppercase tracking-wider">Current Risk Score</span>
                <div className={`text-4xl font-medium mb-2 tracking-tighter ${isHighRisk ? 'text-risk' : 'text-success'}`}>
                    {riskScore >= 0 ? '+' : ''}{riskScore.toFixed(2)}
                </div>
                <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full ${isHighRisk ? 'bg-risk' : 'bg-success'}`}
                        style={{ width: `${riskPercentage}%` }}
                    />
                </div>
                <div className={`flex items-center gap-2 text-[10px] ${riskTrend === 'negative' ? 'text-risk' :
                    riskTrend === 'positive' ? 'text-success' : 'text-muted-foreground'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${riskTrend === 'negative' ? 'bg-risk' :
                        riskTrend === 'positive' ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                    <span className="uppercase tracking-wider">
                        {riskTrend === 'negative' && 'Trending Negative (72H)'}
                        {riskTrend === 'positive' && 'Trending Positive (72H)'}
                        {riskTrend === 'stable' && 'Stable (72H)'}
                    </span>
                </div>
            </div>

            {/* INFERENCE WIDGET */}
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Latest Inference</h3>
                <div className="bg-ai/5 border border-ai/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2 text-ai">
                        <Mic size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Voice Analysis</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tone indicates <span className="text-foreground">high flatness</span> and <span className="text-foreground">latency</span>. Correlation with depressive episode: <span className="text-risk">85%</span>.
                    </p>
                </div>
            </div>

            {/* BIOMARKERS WIDGET */}
            <div className="bg-card border border-border p-3 rounded">
                <div className="flex items-center gap-2 mb-2 text-brand">
                    <Activity size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Biomarkers (Oura)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">HRV</span>
                        <span className="text-sm text-foreground">22ms</span>
                    </div>
                    <div className="bg-muted p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">SLEEP</span>
                        <span className="text-sm text-foreground">4h 12m</span>
                    </div>
                </div>
            </div>

            {/* ALERTS */}
            <div className="bg-risk/10 border border-risk/20 p-3 rounded">
                <div className="flex items-center gap-2 mb-2 text-risk">
                    <AlertTriangle size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Flags</span>
                </div>
                <ul className="text-[10px] text-risk/80 space-y-1">
                    <li>• Suicidal ideation markers detected</li>
                    <li>• Sleep pattern disruption (3+ days)</li>
                </ul>
            </div>

            {/* FOOTER ACTION */}
            <div className="mt-auto pt-4 border-t border-sidebar-border">
                <CyberButton className="w-full" size="md">
                    <BrainCircuit size={12} />
                    Clinical Summary
                </CyberButton>
            </div>
        </aside>
    );
}

