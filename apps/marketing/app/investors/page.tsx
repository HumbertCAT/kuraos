'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Mail,
    Zap,
    Users,
    TrendingUp,
    Activity,
    Wallet,
    Shield,
    FileCheck,
    Target,
    CreditCard,
    Cpu,
    CheckCircle2,
    Rocket,
    MapPin,
    User,
    ArrowRight,
    Scale,
    HeartCrack,
    PuzzleIcon,
    Brain,
    Lock,
    CalendarCheck,
    Wand2,
    BarChart3,
    MessageSquare,
    Mic,
    RefreshCw,
    LineChart
} from 'lucide-react';

/**
 * INVESTOR DECK v9.0 - CONTENT DENSITY UPGRADE
 * 
 * Design: Premium Fintech / Cyber-Clinical
 * Layout: 3+2 centered grids, 5 items per section
 * Features: Deep Space BG, Obsidian Glass Cards, Titan Typography
 */

const TOTAL_SLIDES = 10;

export default function InvestorsPage() {
    const [currentSlide, setCurrentSlide] = useState(1);

    const goToSlide = useCallback((slide: number) => {
        if (slide >= 1 && slide <= TOTAL_SLIDES) {
            setCurrentSlide(slide);
        }
    }, []);

    const nextSlide = useCallback(() => {
        goToSlide(currentSlide + 1);
    }, [currentSlide, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide(currentSlide - 1);
    }, [currentSlide, goToSlide]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    return (
        <div className="min-h-screen bg-[#030305] text-white overflow-hidden relative">
            {/* LAYER 2: Grid Pattern */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(128,128,128,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.05) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }}
            />

            {/* LAYER 3: Atmospheric Glows - More Intense */}
            <div className="fixed top-[-30%] left-[-15%] w-[800px] h-[800px] rounded-full bg-teal-500/[0.12] blur-[200px] pointer-events-none" />
            <div className="fixed bottom-[-30%] right-[-15%] w-[900px] h-[900px] rounded-full bg-violet-500/[0.12] blur-[200px] pointer-events-none" />
            <div className="fixed top-[30%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.08] blur-[150px] pointer-events-none" />

            {/* Event Horizon Glow at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-teal-500/[0.05] to-transparent pointer-events-none" />

            {/* Slide Container */}
            <div className="h-screen w-screen relative z-10">
                {currentSlide === 1 && <SlideCover />}
                {currentSlide === 2 && <SlideProblem />}
                {currentSlide === 3 && <SlideSolution />}
                {currentSlide === 4 && <SlideArsenal />}
                {currentSlide === 5 && <SlideMarket />}
                {currentSlide === 6 && <SlideBusinessModel />}
                {currentSlide === 7 && <SlideTraction />}
                {currentSlide === 8 && <SlideRoadmap />}
                {currentSlide === 9 && <SlideTeam />}
                {currentSlide === 10 && <SlideAsk />}
            </div>

            {/* Navigation Controls */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
                <button
                    onClick={prevSlide}
                    disabled={currentSlide === 1}
                    className="p-3 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-teal-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i + 1)}
                            className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i + 1
                                ? 'bg-teal-400 w-8 shadow-[0_0_12px_rgba(45,212,191,0.6)]'
                                : 'bg-white/20 w-2 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    disabled={currentSlide === TOTAL_SLIDES}
                    className="p-3 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-teal-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Slide Counter */}
            <div className="fixed bottom-8 right-8 text-white/30 font-mono text-sm z-50 tracking-widest">
                {String(currentSlide).padStart(2, '0')} / {TOTAL_SLIDES}
            </div>

            {/* Footer Brand */}
            <div className="fixed bottom-8 left-8 flex items-center gap-2 text-white/20 text-sm font-mono z-50">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                KURA OS // v9.0
            </div>
        </div>
    );
}

// Obsidian Glass Card Component - More Intense
function GlassCard({
    children,
    className = '',
    glow = ''
}: {
    children: React.ReactNode;
    className?: string;
    glow?: 'teal' | 'violet' | 'blue' | 'red' | 'orange' | '';
}) {
    const glowStyles = {
        teal: 'hover:border-teal-500/50 hover:shadow-[0_0_50px_-10px_rgba(45,212,191,0.5)]',
        violet: 'hover:border-violet-500/50 hover:shadow-[0_0_50px_-10px_rgba(139,92,246,0.5)]',
        blue: 'hover:border-blue-500/50 hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.5)]',
        red: 'hover:border-red-500/50 hover:shadow-[0_0_50px_-10px_rgba(239,68,68,0.5)]',
        orange: 'hover:border-orange-500/50 hover:shadow-[0_0_50px_-10px_rgba(249,115,22,0.5)]',
    };

    return (
        <div
            className={`
                relative bg-white/[0.02] backdrop-blur-sm
                border border-white/[0.08] border-t-white/[0.15]
                rounded-2xl overflow-hidden
                shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                hover:bg-white/[0.05] transition-all duration-500
                ${glow ? glowStyles[glow] : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

// Slide wrapper
function SlideWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full w-full flex items-center justify-center p-6 md:p-12 lg:p-16">
            <div className="max-w-7xl w-full">
                {children}
            </div>
        </div>
    );
}

// ============================================
// SLIDE 1: THE COVER
// ============================================
function SlideCover() {
    return (
        <SlideWrapper>
            <div className="text-center">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-5 py-2 mb-10 rounded-full bg-teal-500/[0.08] border border-teal-500/20">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                    <span className="text-teal-400 text-sm font-medium tracking-widest uppercase">
                        Pre-Seed 2026
                    </span>
                </div>

                {/* Main Title - TITAN */}
                <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-black tracking-tighter mb-8 leading-[0.9]">
                    <span className="block bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        INTELLIGENT
                    </span>
                    <span className="block bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        PRACTICE
                    </span>
                    <span className="block bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        INFRASTRUCTURE
                    </span>
                </h1>

                {/* Subhead */}
                <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-12 font-light">
                    The Operating System for the next generation of Mental Health.
                </p>

                {/* Tagline */}
                <div className="flex items-center justify-center gap-6 mb-14 text-xl md:text-2xl font-bold tracking-wide">
                    <span className="text-teal-400">CONNECT</span>
                    <span className="text-white/20">·</span>
                    <span className="text-violet-400">PRACTICE</span>
                    <span className="text-white/20">·</span>
                    <span className="text-blue-400">GROW</span>
                </div>

                {/* CTA with Pulse */}
                <a
                    href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Investment%20Inquiry"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-teal-500 text-black font-bold text-lg rounded-xl hover:bg-teal-400 transition-all duration-300 shadow-[0_0_40px_rgba(45,212,191,0.5)] hover:shadow-[0_0_60px_rgba(45,212,191,0.7)]"
                >
                    <Mail className="w-5 h-5" />
                    Request Access
                </a>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 2: THE PROBLEM (5 Friction Cards - 3+2 Grid)
// ============================================
function SlideProblem() {
    const frictions = [
        {
            emoji: '📉',
            title: 'Revenue Bleed',
            description: '40% of leads vanish due to slow response times and lack of follow-up.',
            color: 'text-red-400',
        },
        {
            emoji: '🧩',
            title: 'Context Blindness',
            description: 'Clinical notes, booking data, and financials live in disconnected silos.',
            color: 'text-orange-400',
        },
        {
            emoji: '🐹',
            title: 'The Hamster Wheel',
            description: 'Zero leverage. Income is strictly tied to manual admin hours.',
            color: 'text-amber-400',
        },
        {
            emoji: '⚖️',
            title: 'Legal Roulette',
            description: 'High liability. Storing sensitive trauma data on WhatsApp/Forms is a ticking bomb.',
            color: 'text-red-500',
        },
        {
            emoji: '🕳️',
            title: 'The Integration Void',
            description: 'Great sessions, terrible post-care. Patients drop off when they need support most.',
            color: 'text-orange-500',
        },
    ];

    return (
        <SlideWrapper>
            <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        The Clinical-Commercial
                    </span>
                    <br />
                    <span className="text-red-400">Divide.</span>
                </h2>
                <p className="text-lg text-white/40 mb-10">
                    Great Healers. Terrible Operators.
                </p>

                {/* 3+2 Grid Layout */}
                <div className="space-y-4">
                    {/* Row 1: 3 cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {frictions.slice(0, 3).map((item, i) => (
                            <GlassCard key={i} glow="red" className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                </div>
                                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                    {/* Row 2: 2 cards centered */}
                    <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {frictions.slice(3, 5).map((item, i) => (
                            <GlassCard key={i + 3} glow="orange" className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                </div>
                                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 3: THE TRINITY (3 Pillars x 5 Features)
// ============================================
function SlideSolution() {
    const pillars = [
        {
            label: 'CONNECT',
            subtitle: 'Marketing & Sales',
            color: 'teal',
            icon: Zap,
            features: [
                { icon: MessageSquare, text: 'WhatsApp CRM: Unified inbox for leads' },
                { icon: Activity, text: 'Speed-to-Lead: Visual urgency system' },
                { icon: Target, text: 'Auto-Qualification: AI filtering of bad fits' },
                { icon: CalendarCheck, text: 'Smart Calendar: Multi-schedule sync' },
                { icon: Wand2, text: 'Public Wizard: 4-step frictionless booking' },
            ],
        },
        {
            label: 'PRACTICE',
            subtitle: 'Clinical Ops',
            color: 'violet',
            icon: Users,
            features: [
                { icon: User, text: 'Soul Record: 360° Patient Profile' },
                { icon: Shield, text: 'Risk Shield: Auto-detection of risks' },
                { icon: Activity, text: 'Sentinel Pulse: Emotional monitoring' },
                { icon: Mic, text: 'Multimedia Journal: Audio/Text entries' },
                { icon: FileCheck, text: 'Clinical Scribe: AI session synthesis' },
            ],
        },
        {
            label: 'GROW',
            subtitle: 'Business Scale',
            color: 'blue',
            icon: TrendingUp,
            features: [
                { icon: RefreshCw, text: 'Nurture Agents: Auto re-engagement' },
                { icon: CreditCard, text: 'Fintech Engine: Stripe Connect & Split' },
                { icon: Users, text: 'Membership Builder: Recurring revenue' },
                { icon: Activity, text: 'Lead Resurrection: Detect stale leads' },
                { icon: LineChart, text: 'Business Analytics: Real-time HUD' },
            ],
        },
    ];

    const colorMap = {
        teal: {
            text: 'text-teal-400',
            bg: 'bg-teal-500/[0.08]',
            border: 'border-teal-500/30',
            glow: 'shadow-[0_0_60px_-15px_rgba(45,212,191,0.6)]',
            check: 'text-teal-400',
        },
        violet: {
            text: 'text-violet-400',
            bg: 'bg-violet-500/[0.08]',
            border: 'border-violet-500/30',
            glow: 'shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)]',
            check: 'text-violet-400',
        },
        blue: {
            text: 'text-blue-400',
            bg: 'bg-blue-500/[0.08]',
            border: 'border-blue-500/30',
            glow: 'shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)]',
            check: 'text-blue-400',
        },
    };

    return (
        <SlideWrapper>
            <div>
                <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">THE SOLUTION</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        One Unified{' '}
                    </span>
                    <span className="text-teal-400">Command Center</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-5">
                    {pillars.map((pillar, i) => {
                        const colors = colorMap[pillar.color as keyof typeof colorMap];
                        return (
                            <div
                                key={i}
                                className={`
                                    relative p-6 rounded-2xl
                                    ${colors.bg} border ${colors.border}
                                    ${colors.glow}
                                `}
                            >
                                <pillar.icon className={`w-8 h-8 ${colors.text} mb-3`} />
                                <h3 className={`text-xl font-black ${colors.text} mb-1 tracking-tight`}>
                                    {pillar.label}
                                </h3>
                                <p className="text-white/40 text-xs mb-5">{pillar.subtitle}</p>

                                <ul className="space-y-2.5">
                                    {pillar.features.map((feature, j) => (
                                        <li key={j} className="flex items-start gap-2 text-white/70 text-sm">
                                            <CheckCircle2 className={`w-4 h-4 ${colors.check} mt-0.5 flex-shrink-0`} />
                                            <span>{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 4: THE ARSENAL (5 Techs - 3+2 Grid)
// ============================================
function SlideArsenal() {
    const features = [
        {
            emoji: '📡',
            title: 'Sentinel Pulse',
            description: '7-Day Emotional Trajectory. Visualizing risk before crisis hits.',
            gradient: 'from-teal-500 to-cyan-500',
        },
        {
            emoji: '💰',
            title: 'AI Margin Control',
            description: 'Real-Time FinOps. We track every token and bake in a 50% margin.',
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            emoji: '🧠',
            title: 'Neural Circuits',
            description: 'Visual Logic Builder. No-code automation flows (Trigger → Action).',
            gradient: 'from-violet-500 to-purple-500',
        },
        {
            emoji: '🔐',
            title: 'Privacy Vault',
            description: 'GDPR/HIPAA compliant. Anonymous datasets & auto-incineration.',
            gradient: 'from-blue-500 to-indigo-500',
        },
        {
            emoji: '🛡️',
            title: 'Draft Mode',
            description: 'Clinical Sovereignty. AI drafts the content, you approve. Zero risk.',
            gradient: 'from-fuchsia-500 to-pink-500',
        },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-violet-400 font-mono text-sm mb-3 tracking-widest">THE ARSENAL</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Proprietary{' '}
                    </span>
                    <span className="text-violet-400">Technology</span>
                </h2>

                {/* 3+2 Grid Layout */}
                <div className="space-y-4">
                    {/* Row 1: 3 cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {features.slice(0, 3).map((item, i) => (
                            <GlassCard key={i} glow="teal" className="p-6 group">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} mb-4 shadow-lg group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-shadow`}>
                                    <span className="text-xl">{item.emoji}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                    {/* Row 2: 2 cards centered */}
                    <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {features.slice(3, 5).map((item, i) => (
                            <GlassCard key={i + 3} glow="violet" className="p-6 group">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${item.gradient} mb-4 shadow-lg group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-shadow`}>
                                    <span className="text-xl">{item.emoji}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 5: THE MARKET
// ============================================
function SlideMarket() {
    const segments = [
        'Psychedelic Clinics',
        'Retreat Centers',
        'High-End Coaching',
    ];

    return (
        <SlideWrapper>
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">THE MARKET</p>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
                        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            The Rise of the
                        </span>
                        <br />
                        <span className="text-teal-400">Conscious Practitioner</span>
                    </h2>
                    <p className="text-lg text-white/40 mb-8">
                        Moving from $50/h sessions to $3,000 Retreats.
                    </p>

                    <div className="space-y-4">
                        {segments.map((segment, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Target className="w-5 h-5 text-teal-500" />
                                <span className="text-white/80">{segment}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <GlassCard className="p-12" glow="teal">
                        <p className="text-white/30 text-sm mb-3 tracking-widest">TAM</p>
                        <div className="text-6xl md:text-7xl font-black font-mono bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                            $120B
                        </div>
                        <p className="text-white/40 mt-3">Mental Health Market</p>
                    </GlassCard>
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 6: BUSINESS MODEL
// ============================================
function SlideBusinessModel() {
    const layers = [
        { layer: 'Layer 1', title: 'Recurrence', value: '€49-€149', unit: '/mo', subtitle: 'SaaS Subscriptions', icon: CreditCard },
        { layer: 'Layer 2', title: 'Transaction', value: '1.5%', unit: '', subtitle: 'Fintech Take Rate on GMV', icon: Wallet },
        { layer: 'Layer 3', title: 'Consumption', value: 'Credits', unit: '', subtitle: 'Usage-based AI', icon: Cpu },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">BUSINESS MODEL</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        SaaS + Fintech +{' '}
                    </span>
                    <span className="text-teal-400">AI</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-5 mb-10">
                    {layers.map((item, i) => (
                        <GlassCard key={i} glow="teal" className="p-6">
                            <item.icon className="w-8 h-8 text-white/30 mb-4" />
                            <p className="text-white/30 font-mono text-xs mb-2 tracking-widest">{item.layer}</p>
                            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-white/40 text-sm mb-4">{item.subtitle}</p>
                            <div className="text-2xl font-bold font-mono text-teal-400">
                                {item.value}<span className="text-white/40 text-base">{item.unit}</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <GlassCard className="p-8 text-center" glow="teal">
                    <p className="text-white/30 text-sm mb-2 tracking-widest">TARGET ARPU</p>
                    <div className="text-5xl md:text-6xl font-black font-mono text-teal-400">
                        €450<span className="text-xl text-white/30">/month</span>
                    </div>
                </GlassCard>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 7: TRACTION
// ============================================
function SlideTraction() {
    const items = [
        { icon: Rocket, label: 'Production Live', value: 'v1.1.4' },
        { icon: CreditCard, label: 'Stripe Connect', value: 'Infrastructure Ready' },
        { icon: FileCheck, label: 'LOIs Signed', value: '4 (Day 1 Revenue)' },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">TRACTION</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Real Tech.{' '}
                    </span>
                    <span className="text-teal-400">Real Demand.</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-5">
                    {items.map((item, i) => (
                        <GlassCard key={i} glow="teal" className="p-8 text-center">
                            <item.icon className="w-10 h-10 text-teal-400 mx-auto mb-4" />
                            <p className="text-white/40 text-sm mb-2">{item.label}</p>
                            <p className="text-xl font-bold text-white">{item.value}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 8: ROADMAP
// ============================================
function SlideRoadmap() {
    const phases = [
        { year: '2026', title: 'The Viral Loop', focus: 'Acquisition focus', active: true },
        { year: '2027', title: 'Fintech Expansion', focus: 'Monetization focus', active: false },
        { year: '2028', title: 'B2B Bridge', focus: 'Corporate Wellness API', active: false },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-blue-400 font-mono text-sm mb-3 tracking-widest">ROADMAP</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        From Tool to{' '}
                    </span>
                    <span className="text-blue-400">Network</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-5">
                    {phases.map((phase, i) => (
                        <GlassCard
                            key={i}
                            glow={phase.active ? 'teal' : ''}
                            className={`p-8 ${phase.active ? 'border-teal-500/40 shadow-[0_0_50px_-10px_rgba(45,212,191,0.5)]' : ''}`}
                        >
                            <div className={`text-sm font-mono mb-4 ${phase.active ? 'text-teal-400' : 'text-white/30'}`}>
                                {phase.year}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{phase.title}</h3>
                            <p className="text-white/40">{phase.focus}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 9: THE TEAM
// ============================================
function SlideTeam() {
    return (
        <SlideWrapper>
            <div className="text-center">
                <p className="text-violet-400 font-mono text-sm mb-3 tracking-widest">THE TEAM</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Founder-Market{' '}
                    </span>
                    <span className="text-violet-400">Fit</span>
                </h2>

                <GlassCard className="inline-block p-12 max-w-md mx-auto" glow="violet">
                    <div className="w-24 h-24 bg-white/[0.05] border border-white/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <User className="w-12 h-12 text-white/40" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Humbert Torroella</h3>
                    <p className="text-violet-400 font-medium mb-4">Founder & Architect</p>
                    <p className="text-white/40">
                        Product Engineer. Built Kura OS from zero to production in {"<"}30 days.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-white/30 text-sm">
                        <MapPin className="w-4 h-4" />
                        Barcelona, Spain
                    </div>
                </GlassCard>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 10: THE ASK
// ============================================
function SlideAsk() {
    return (
        <SlideWrapper>
            <div className="text-center">
                <p className="text-violet-400 font-mono text-sm mb-3 tracking-widest">THE ASK</p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Fueling the Revolution
                    </span>
                </h2>

                {/* THE NUMBER - MAXIMUM DRAMA */}
                <div className="text-6xl md:text-8xl lg:text-[8rem] font-black font-mono bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-6 tracking-tight">
                    €260,000
                </div>

                <p className="text-white/40 text-xl mb-10">Pre-Seed Round</p>

                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <GlassCard className="px-6 py-3">
                        <span className="text-violet-400 font-bold font-mono">40%</span>{' '}
                        <span className="text-white/40">Product</span>
                    </GlassCard>
                    <GlassCard className="px-6 py-3">
                        <span className="text-pink-400 font-bold font-mono">30%</span>{' '}
                        <span className="text-white/40">Growth</span>
                    </GlassCard>
                    <GlassCard className="px-6 py-3">
                        <span className="text-cyan-400 font-bold font-mono">30%</span>{' '}
                        <span className="text-white/40">Ops</span>
                    </GlassCard>
                </div>

                <div className="mb-12">
                    <p className="text-2xl md:text-3xl font-bold">
                        <span className="text-white">"HELP THEM HEAL.</span>{' '}
                        <span className="text-teal-400">WE HANDLE THE REST."</span>
                    </p>
                </div>

                <a
                    href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Pre-Seed%20Inquiry"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all duration-300 shadow-[0_0_50px_rgba(139,92,246,0.5)]"
                >
                    <Mail className="w-5 h-5" />
                    Let's Talk
                    <ArrowRight className="w-5 h-5" />
                </a>
            </div>
        </SlideWrapper>
    );
}
