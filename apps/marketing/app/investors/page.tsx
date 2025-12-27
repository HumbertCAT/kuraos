'use client';

import { useState } from 'react';
import {
    Ghost,
    Activity,
    Wallet,
    Brain,
    Lock,
    Shield,
    Mail,
    ExternalLink,
    Zap,
    Users,
    TrendingUp,
    CreditCard,
    Cpu,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

/**
 * INVESTOR DECK v6.0 - "THE ARSENAL EDITION"
 * 
 * Design: SpaceX Dashboard meets High-Frequency Trading
 * Visuals: Bento Grids, Glassmorphism, Neon Accents (Teal/Violet)
 */

export default function InvestorsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02] pointer-events-none" />

            {/* Gradient Blobs */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[150px] pointer-events-none" />

            <main className="relative z-10">
                <HeroSection />
                <ProblemSection />
                <TrinitySection />
                <ArsenalSection />
                <BusinessModelSection />
                <TractionSection />
                <FooterSection />
            </main>
        </div>
    );
}

// ============================================
// 1. HERO SECTION
// ============================================
function HeroSection() {
    return (
        <section className="min-h-screen flex items-center justify-center px-6 py-20">
            <div className="max-w-5xl mx-auto text-center">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-400 text-sm font-medium tracking-wide">
                        The Operating System for Conscious Practitioners
                    </span>
                </div>

                {/* Main Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
                    <span className="text-white">INTELLIGENT</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                        PRACTICE INFRASTRUCTURE
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                    Bridging the gap between <span className="text-white font-medium">High-Ticket Clinical Care</span> and{' '}
                    <span className="text-white font-medium">Business Scalability</span>.
                </p>

                {/* CTA */}
                <a
                    href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Investment%20Inquiry"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                >
                    <Mail className="w-5 h-5" />
                    Request Access
                    <ArrowRight className="w-5 h-5" />
                </a>

                {/* Footer Tag */}
                <div className="mt-16 flex items-center justify-center gap-3 text-slate-500 text-sm font-mono">
                    <span className="text-emerald-500">●</span>
                    KURA OS // INVESTOR DECK v6.0
                    <span className="text-slate-600">|</span>
                    Q1 2026
                </div>
            </div>
        </section>
    );
}

// ============================================
// 2. THE PROBLEM
// ============================================
function ProblemSection() {
    const frictions = [
        {
            title: 'LEAD LEAKAGE',
            stat: '40%',
            description: 'Revenue lost. Great healers are often terrible operators.',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
        },
        {
            title: 'CONTEXT BLINDNESS',
            stat: '0',
            description: 'Clinical notes & financial data live in disconnected silos.',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        },
        {
            title: 'THE HAMSTER WHEEL',
            stat: '∞',
            description: 'Zero retention automation. Manual follow-up is unscalable.',
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20',
        },
    ];

    return (
        <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-4">
                    THE CLINICAL-COMMERCIAL
                    <br />
                    <span className="text-red-400">DIVIDE.</span>
                </h2>
                <p className="text-xl text-slate-400 mb-16 max-w-2xl">
                    Great Healers. Poor Operators.
                    <br />
                    Fragmented tools are suffocating practice growth.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {frictions.map((friction, i) => (
                        <div
                            key={i}
                            className={`${friction.bgColor} ${friction.borderColor} border rounded-2xl p-8 backdrop-blur-sm`}
                        >
                            <div className={`text-5xl font-mono font-bold ${friction.color} mb-4`}>
                                {friction.stat}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{friction.title}</h3>
                            <p className="text-slate-400 text-sm">{friction.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex items-center gap-3 text-slate-500 text-sm">
                    <span className="text-red-400">⊘</span>
                    <span className="italic">"Modern Therapy has outgrown Legacy Software."</span>
                </div>
            </div>
        </section>
    );
}

// ============================================
// 3. THE TRINITY
// ============================================
function TrinitySection() {
    const pillars = [
        {
            label: 'CONNECT',
            title: 'Speed-to-Lead',
            features: ['WhatsApp CRM', 'Auto-Qualification', 'Calendar Sync'],
            color: 'from-emerald-500 to-teal-500',
            icon: Zap,
        },
        {
            label: 'PRACTICE',
            title: 'Deep Care',
            features: ['Soul Record', 'Multimedia Journal', 'Risk Shield'],
            color: 'from-violet-500 to-purple-500',
            icon: Users,
        },
        {
            label: 'GROW',
            title: 'LTV Engine',
            features: ['Nurture Agents', 'Fintech Payments', 'Post-Retreat Loops'],
            color: 'from-blue-500 to-cyan-500',
            icon: TrendingUp,
        },
    ];

    return (
        <section className="py-32 px-6 bg-slate-900/50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">THE ARCHITECTURE</p>
                    <h2 className="text-4xl md:text-6xl font-black">
                        One Unified <span className="text-emerald-400">Command Center</span>
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pillars.map((pillar, i) => (
                        <div
                            key={i}
                            className="relative group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600/50 transition-colors"
                        >
                            {/* Gradient Top Bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${pillar.color} rounded-t-2xl`} />

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${pillar.color} flex items-center justify-center mb-6`}>
                                <pillar.icon className="w-6 h-6 text-white" />
                            </div>

                            <p className="text-slate-500 font-mono text-xs tracking-widest mb-2">{pillar.label}</p>
                            <h3 className="text-2xl font-bold text-white mb-4">{pillar.title}</h3>

                            <ul className="space-y-2">
                                {pillar.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-2 text-slate-400 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// 4. THE ARSENAL - VISUAL CENTERPIECE
// ============================================
function ArsenalSection() {
    const arsenalItems = [
        {
            icon: Ghost,
            emoji: '👻',
            title: 'THE GHOST DETECTOR',
            description: 'Visual Urgency. Automatically flags leads that go cold (<48h) and triggers resurrection agents.',
            gradient: 'from-slate-500 to-gray-600',
        },
        {
            icon: Activity,
            emoji: '📡',
            title: 'SENTINEL PULSE',
            description: '7-Day Emotional Trajectory. Real-time visualization of patient sentiment before crisis hits.',
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            icon: Wallet,
            emoji: '💰',
            title: 'THE COST LEDGER',
            description: 'Real-Time FinOps. We track every AI token. 50% Margin baked into every compute credit.',
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            icon: Brain,
            emoji: '🧠',
            title: 'NEURAL CIRCUITS',
            description: 'Visual Logic Builder. We visualize automation flows (Trigger → Condition → Action) so therapists don\'t have to code.',
            gradient: 'from-violet-500 to-purple-500',
        },
        {
            icon: Lock,
            emoji: '🔐',
            title: 'THE CLEAN ROOM',
            description: 'The Vault. Anonymous datasets & auto-incineration of sensitive media. GDPR/HIPAA Solved.',
            gradient: 'from-blue-500 to-indigo-500',
        },
        {
            icon: Shield,
            emoji: '🛡️',
            title: 'HUMAN-IN-THE-LOOP',
            description: 'Clinical Sovereignty. AI drafts, You approve. Zero hallucination risk in patient communications.',
            gradient: 'from-rose-500 to-pink-500',
        },
    ];

    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-violet-400 font-mono text-sm mb-4 tracking-widest">THE ARSENAL</p>
                    <h2 className="text-4xl md:text-6xl font-black">
                        Proprietary Tech.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                            Unfair Advantages.
                        </span>
                    </h2>
                </div>

                {/* Bento Grid 3x2 */}
                <div className="grid md:grid-cols-3 gap-4">
                    {arsenalItems.map((item, i) => (
                        <div
                            key={i}
                            className="group relative bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all hover:scale-[1.02] duration-300 backdrop-blur-sm overflow-hidden"
                        >
                            {/* Glow Effect on Hover */}
                            <div className={`absolute -inset-1 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-white mb-2 font-mono tracking-tight">
                                    {item.emoji} {item.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// 5. BUSINESS MODEL
// ============================================
function BusinessModelSection() {
    const layers = [
        {
            layer: 'LAYER 1',
            title: 'SaaS',
            description: 'Recurring Revenue',
            value: '€49-€149/mo',
            icon: CreditCard,
            color: 'emerald',
        },
        {
            layer: 'LAYER 2',
            title: 'Fintech',
            description: '1.5% Take Rate on High-Ticket GMV',
            value: 'Retreats',
            icon: Wallet,
            color: 'violet',
        },
        {
            layer: 'LAYER 3',
            title: 'AI Usage',
            description: 'High-margin Consumption Model',
            value: 'Credits',
            icon: Cpu,
            color: 'blue',
        },
    ];

    return (
        <section className="py-32 px-6 bg-slate-900/50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">THE MACHINE</p>
                    <h2 className="text-4xl md:text-6xl font-black">
                        SaaS + Fintech + <span className="text-emerald-400">AI</span>
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {layers.map((layer, i) => (
                        <div
                            key={i}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                        >
                            <layer.icon className={`w-8 h-8 text-${layer.color}-400 mb-4`} />
                            <p className="text-slate-500 font-mono text-xs mb-1">{layer.layer}</p>
                            <h3 className="text-2xl font-bold text-white mb-1">{layer.title}</h3>
                            <p className="text-slate-400 text-sm mb-4">{layer.description}</p>
                            <div className={`text-${layer.color}-400 font-mono font-bold text-lg`}>
                                {layer.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Target ARPU */}
                <div className="text-center p-8 bg-gradient-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-slate-400 text-sm mb-2">Target ARPU</p>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-400 font-mono">
                        €450<span className="text-2xl text-slate-500">/month</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================
// 6. TRACTION & ASK
// ============================================
function TractionSection() {
    const stats = [
        { label: 'Production Live', value: 'app.kuraos.ai', check: true },
        { label: 'Stripe Connect', value: 'Infrastructure Ready', check: true },
        { label: 'LOIs Signed', value: '4 (Day 1 Revenue)', check: true },
    ];

    return (
        <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">TRACTION</p>
                    <h2 className="text-4xl md:text-6xl font-black">
                        Built for <span className="text-emerald-400">Scale.</span>
                    </h2>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="bg-slate-800/50 border border-emerald-500/20 rounded-2xl p-6 text-center"
                        >
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                            <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                            <p className="text-white font-bold text-lg">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* The Ask */}
                <div className="text-center p-12 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-3xl">
                    <p className="text-violet-400 font-mono text-sm mb-4 tracking-widest">THE ASK</p>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                        Pre-Seed Round: <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">€260,000</span>
                    </h3>
                    <p className="text-slate-400 text-lg mb-8">Q1 2026</p>

                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <div className="px-6 py-3 bg-slate-800/50 rounded-xl">
                            <span className="text-violet-400 font-bold">40%</span> <span className="text-slate-400">Product</span>
                        </div>
                        <div className="px-6 py-3 bg-slate-800/50 rounded-xl">
                            <span className="text-pink-400 font-bold">30%</span> <span className="text-slate-400">Growth</span>
                        </div>
                        <div className="px-6 py-3 bg-slate-800/50 rounded-xl">
                            <span className="text-cyan-400 font-bold">30%</span> <span className="text-slate-400">Ops</span>
                        </div>
                    </div>

                    <a
                        href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Pre-Seed%20Inquiry"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                    >
                        <Mail className="w-5 h-5" />
                        Let's Talk
                        <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </section>
    );
}

// ============================================
// FOOTER
// ============================================
function FooterSection() {
    return (
        <footer className="py-16 px-6 border-t border-slate-800">
            <div className="max-w-6xl mx-auto text-center">
                <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                    "HELP THEM HEAL.{' '}
                    <span className="text-emerald-400">WE HANDLE THE REST.</span>"
                </p>
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <p className="font-medium">Humbert Torroella</p>
                    <a href="mailto:humbert@kuraos.ai" className="text-emerald-400 hover:underline">
                        humbert@kuraos.ai
                    </a>
                </div>
                <div className="mt-8 text-slate-600 text-sm font-mono">
                    © 2025 KURA OS. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
