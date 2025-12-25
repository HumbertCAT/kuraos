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
        <aside className={`hidden xl:flex w-80 flex-col border-l border-border bg-card p-4 gap-6 font-mono dark:border-zinc-800 dark:bg-[#0C0C0E] ${className}`}>
            {/* HEADER */}
            <div className="border-b border-border pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-ai mb-1">
                    <BrainCircuit size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">AletheIA Observatory</span>
                </div>
                <p className="text-[10px] text-foreground/50 dark:text-zinc-500">Real-time inference engine v2.4.1</p>
            </div>

            {/* RISK WIDGET */}
            <div className="bg-muted/50 rounded p-4 border border-border relative dark:bg-zinc-900/50 dark:border-zinc-800">
                <span className="text-[10px] text-foreground/50 block mb-2 uppercase tracking-wider dark:text-zinc-500">Current Risk Score</span>
                <div className={`text-4xl font-medium mb-2 tracking-tighter ${isHighRisk ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {riskScore >= 0 ? '+' : ''}{riskScore.toFixed(2)}
                </div>
                <div className="w-full bg-border h-1 rounded-full overflow-hidden mb-2 dark:bg-zinc-800">
                    <div
                        className={`h-full ${isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${riskPercentage}%` }}
                    />
                </div>
                <div className={`flex items-center gap-2 text-[10px] ${riskTrend === 'negative' ? 'text-rose-500 dark:text-rose-400' :
                        riskTrend === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : 'text-foreground/50 dark:text-zinc-400'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${riskTrend === 'negative' ? 'bg-rose-500' :
                            riskTrend === 'positive' ? 'bg-emerald-500' : 'bg-zinc-500'
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
                <h3 className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-3 dark:text-zinc-500">Latest Inference</h3>
                <div className="bg-ai/5 border border-ai/20 p-3 rounded dark:bg-violet-950/10 dark:border-violet-900/20">
                    <div className="flex items-center gap-2 mb-2 text-ai">
                        <Mic size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Voice Analysis</span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed dark:text-zinc-400">
                        Tone indicates <span className="text-foreground dark:text-zinc-200">high flatness</span> and <span className="text-foreground dark:text-zinc-200">latency</span>. Correlation with depressive episode: <span className="text-rose-500 dark:text-rose-400">85%</span>.
                    </p>
                </div>
            </div>

            {/* BIOMARKERS WIDGET */}
            <div className="bg-muted border border-border p-3 rounded dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-brand">
                    <Activity size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Biomarkers (Oura)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 p-2 rounded dark:bg-black/40">
                        <span className="text-[10px] text-foreground/50 block dark:text-zinc-500">HRV</span>
                        <span className="text-sm text-foreground dark:text-zinc-200">22ms</span>
                    </div>
                    <div className="bg-background/50 p-2 rounded dark:bg-black/40">
                        <span className="text-[10px] text-foreground/50 block dark:text-zinc-500">SLEEP</span>
                        <span className="text-sm text-foreground dark:text-zinc-200">4h 12m</span>
                    </div>
                </div>
            </div>

            {/* ALERTS */}
            <div className="bg-rose-50 border border-rose-200 p-3 rounded dark:bg-rose-950/20 dark:border-rose-900/30">
                <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Flags</span>
                </div>
                <ul className="text-[10px] text-rose-600/80 space-y-1 dark:text-rose-300/80">
                    <li>• Suicidal ideation markers detected</li>
                    <li>• Sleep pattern disruption (3+ days)</li>
                </ul>
            </div>

            {/* FOOTER ACTION */}
            <div className="mt-auto pt-4 border-t border-border dark:border-zinc-800">
                <CyberButton className="w-full" size="md">
                    <BrainCircuit size={12} />
                    Clinical Summary
                </CyberButton>
            </div>
        </aside>
    );
}

