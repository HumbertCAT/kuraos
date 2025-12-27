'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Mail,
    Zap,
    Users,
    TrendingUp,
    AlertTriangle,
    Activity,
    Wallet,
    Workflow,
    Shield,
    FileCheck,
    Target,
    CreditCard,
    Cpu,
    CheckCircle2,
    Rocket,
    MapPin,
    User,
    ArrowRight
} from 'lucide-react';

/**
 * INVESTOR DECK v8.0 - CLEAN & PROFESSIONAL
 * 
 * 10 Slides with keyboard navigation
 * Design: High-end Fintech aesthetic - clean, whitespace, sharp borders
 * Tone: Professional, grounded, functional descriptions
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

    // Keyboard navigation
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
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Slide Container */}
            <div className="h-screen w-screen relative">
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
                    className="p-3 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i + 1)}
                            className={`w-2 h-2 rounded-full transition-all ${currentSlide === i + 1
                                    ? 'bg-emerald-500 w-6'
                                    : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    disabled={currentSlide === TOTAL_SLIDES}
                    className="p-3 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Slide Counter */}
            <div className="fixed bottom-8 right-8 text-slate-500 font-mono text-sm z-50">
                {String(currentSlide).padStart(2, '0')} / {TOTAL_SLIDES}
            </div>

            {/* Footer Brand */}
            <div className="fixed bottom-8 left-8 flex items-center gap-2 text-slate-600 text-sm font-mono z-50">
                <span className="text-emerald-500">●</span>
                KURA OS // INVESTOR DECK v8.0
            </div>
        </div>
    );
}

// Slide wrapper component
function SlideWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full w-full flex items-center justify-center p-12 md:p-20">
            <div className="max-w-6xl w-full">
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
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400 text-sm font-medium tracking-wide">
                        Pre-Seed 2026
                    </span>
                </div>

                {/* Main Title */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
                    INTELLIGENT
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                        PRACTICE INFRASTRUCTURE
                    </span>
                </h1>

                {/* Subhead */}
                <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12">
                    The Operating System for the next generation of Mental Health.
                </p>

                {/* Tagline */}
                <div className="flex items-center justify-center gap-4 mb-12 text-2xl md:text-3xl font-bold">
                    <span className="text-emerald-400">CONNECT.</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-violet-400">PRACTICE.</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-blue-400">GROW.</span>
                </div>

                {/* CTA */}
                <a
                    href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Investment%20Inquiry"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-slate-950 font-bold text-lg rounded-lg hover:bg-emerald-400 transition-colors"
                >
                    <Mail className="w-5 h-5" />
                    Request Access
                </a>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 2: THE PROBLEM
// ============================================
function SlideProblem() {
    const frictions = [
        {
            icon: AlertTriangle,
            title: 'Revenue Loss',
            stat: '40%',
            description: 'of high-ticket leads are lost due to slow response times.',
        },
        {
            icon: Workflow,
            title: 'Data Silos',
            stat: '0',
            description: 'Clinical notes, booking data, and financials never speak to each other.',
        },
        {
            icon: Users,
            title: 'Manual Burnout',
            stat: '∞',
            description: 'Zero retention automation. The therapist is trapped in admin work.',
        },
    ];

    return (
        <SlideWrapper>
            <div>
                <h2 className="text-4xl md:text-6xl font-black mb-4">
                    The Clinical-Commercial
                    <br />
                    <span className="text-red-400">Divide.</span>
                </h2>
                <p className="text-xl text-slate-400 mb-16">
                    Great Healers. Terrible Operators.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {frictions.map((item, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-8"
                        >
                            <item.icon className="w-8 h-8 text-slate-500 mb-4" />
                            <div className="text-4xl font-mono font-bold text-red-400 mb-2">
                                {item.stat}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-slate-400 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 3: THE SOLUTION (The Trinity)
// ============================================
function SlideSolution() {
    const pillars = [
        {
            label: 'CONNECT',
            subtitle: 'Marketing & Sales',
            features: ['WhatsApp CRM', 'Speed-to-Lead', 'Auto-Qualification'],
            color: 'emerald',
            icon: Zap,
        },
        {
            label: 'PRACTICE',
            subtitle: 'Clinical Ops',
            features: ['Soul Record', 'Multimedia Journal', 'Risk Shield'],
            color: 'violet',
            icon: Users,
        },
        {
            label: 'GROW',
            subtitle: 'Business Scale',
            features: ['Automated Nurture', 'Fintech Payments', 'Post-Retreat Loops'],
            color: 'blue',
            icon: TrendingUp,
        },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">THE SOLUTION</p>
                <h2 className="text-4xl md:text-6xl font-black mb-16">
                    One Unified <span className="text-emerald-400">Command Center</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {pillars.map((pillar, i) => (
                        <div
                            key={i}
                            className={`bg-slate-900 border-2 border-${pillar.color}-500/30 rounded-xl p-8`}
                        >
                            <pillar.icon className={`w-10 h-10 text-${pillar.color}-400 mb-4`} />
                            <h3 className={`text-2xl font-black text-${pillar.color}-400 mb-1`}>
                                {pillar.label}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">{pillar.subtitle}</p>

                            <ul className="space-y-2">
                                {pillar.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-2 text-slate-300 text-sm">
                                        <CheckCircle2 className={`w-4 h-4 text-${pillar.color}-500`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 4: THE ARSENAL
// ============================================
function SlideArsenal() {
    const features = [
        {
            icon: AlertTriangle,
            title: 'Smart Lead Recovery',
            description: 'Visual system that flags cold leads (<48h) and triggers reactivation agents.',
        },
        {
            icon: Activity,
            title: 'Sentinel Pulse',
            description: 'Real-time 7-day emotional trajectory visualization. Detects crisis early.',
        },
        {
            icon: Wallet,
            title: 'AI Margin Control',
            description: 'Real-Time FinOps. We track every token and bake in a 50% margin.',
        },
        {
            icon: Workflow,
            title: 'Visual Automation',
            description: 'No-code logic builder (Trigger → Condition → Action) for clinical workflows.',
        },
        {
            icon: Shield,
            title: 'Privacy Vault',
            description: 'GDPR/HIPAA compliant architecture. Anonymous datasets & media auto-deletion.',
        },
        {
            icon: FileCheck,
            title: 'Draft Mode',
            description: 'Clinical Sovereignty. AI drafts the content, the Therapist approves. Zero risk.',
        },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-violet-400 font-mono text-sm mb-4 tracking-widest">THE ARSENAL</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12">
                    Proprietary Technology
                </h2>

                <div className="grid md:grid-cols-3 gap-4">
                    {features.map((item, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
                        >
                            <item.icon className="w-6 h-6 text-slate-500 mb-3" />
                            <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                        </div>
                    ))}
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
                    <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">THE MARKET</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        The Rise of the
                        <br />
                        <span className="text-emerald-400">Conscious Practitioner</span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-8">
                        Moving from $50/h sessions to $3,000 Retreats.
                    </p>

                    <div className="space-y-3">
                        {segments.map((segment, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-emerald-500" />
                                <span className="text-white">{segment}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <div className="inline-block p-12 bg-slate-900 border border-slate-800 rounded-2xl">
                        <p className="text-slate-500 text-sm mb-2">TAM</p>
                        <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            $120B
                        </div>
                        <p className="text-slate-400 mt-2">Mental Health Market</p>
                    </div>
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
        { layer: 'Layer 1', title: 'Recurrence', value: '€49-€149/mo', subtitle: 'SaaS Subscriptions', icon: CreditCard },
        { layer: 'Layer 2', title: 'Transaction', value: '1.5%', subtitle: 'Fintech Take Rate on GMV', icon: Wallet },
        { layer: 'Layer 3', title: 'Consumption', value: 'Credits', subtitle: 'Usage-based AI', icon: Cpu },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">BUSINESS MODEL</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12">
                    SaaS + Fintech + <span className="text-emerald-400">AI</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {layers.map((item, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <item.icon className="w-8 h-8 text-slate-500 mb-4" />
                            <p className="text-slate-600 font-mono text-xs mb-1">{item.layer}</p>
                            <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-slate-400 text-sm mb-3">{item.subtitle}</p>
                            <div className="text-2xl font-bold text-emerald-400 font-mono">{item.value}</div>
                        </div>
                    ))}
                </div>

                <div className="text-center p-8 bg-slate-900 border border-emerald-500/20 rounded-xl">
                    <p className="text-slate-500 text-sm mb-2">Target ARPU</p>
                    <div className="text-5xl font-black text-emerald-400 font-mono">
                        €450<span className="text-2xl text-slate-500">/month</span>
                    </div>
                </div>
            </div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 7: TRACTION
// ============================================
function SlideTraction() {
    const items = [
        { icon: Rocket, label: 'Production Live', value: 'v1.1.3' },
        { icon: CreditCard, label: 'Stripe Connect', value: 'Infrastructure Ready' },
        { icon: FileCheck, label: 'LOIs Signed', value: '4 (Day 1 Revenue)' },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-emerald-400 font-mono text-sm mb-4 tracking-widest">TRACTION</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12">
                    Real Tech. <span className="text-emerald-400">Real Demand.</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {items.map((item, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                            <item.icon className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm mb-2">{item.label}</p>
                            <p className="text-xl font-bold text-white">{item.value}</p>
                        </div>
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
        { year: '2026', title: 'The Viral Loop', focus: 'Acquisition focus' },
        { year: '2027', title: 'Fintech Expansion', focus: 'Monetization focus' },
        { year: '2028', title: 'B2B Bridge', focus: 'Corporate Wellness API' },
    ];

    return (
        <SlideWrapper>
            <div>
                <p className="text-blue-400 font-mono text-sm mb-4 tracking-widest">ROADMAP</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12">
                    From Tool to <span className="text-blue-400">Network</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {phases.map((phase, i) => (
                        <div
                            key={i}
                            className={`bg-slate-900 border border-slate-800 rounded-xl p-8 ${i === 0 ? 'border-emerald-500/50' : ''
                                }`}
                        >
                            <div className={`text-sm font-mono mb-4 ${i === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {phase.year}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{phase.title}</h3>
                            <p className="text-slate-400">{phase.focus}</p>
                        </div>
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
                <p className="text-violet-400 font-mono text-sm mb-4 tracking-widest">THE TEAM</p>
                <h2 className="text-4xl md:text-5xl font-black mb-12">
                    Founder-Market <span className="text-violet-400">Fit</span>
                </h2>

                <div className="inline-block bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-lg">
                    <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <User className="w-12 h-12 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Humbert Torroella</h3>
                    <p className="text-emerald-400 font-medium mb-4">Founder & Architect</p>
                    <p className="text-slate-400">
                        Product Engineer. Built Kura OS from zero to production in {"<"}30 days.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        Barcelona, Spain
                    </div>
                </div>
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
                <p className="text-violet-400 font-mono text-sm mb-4 tracking-widest">THE ASK</p>
                <h2 className="text-4xl md:text-5xl font-black mb-4">
                    Fueling the Revolution
                </h2>

                <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mb-8">
                    €260,000
                </div>

                <p className="text-slate-400 text-lg mb-8">Pre-Seed Round</p>

                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-violet-400 font-bold">40%</span>{' '}
                        <span className="text-slate-400">Product</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-pink-400 font-bold">30%</span>{' '}
                        <span className="text-slate-400">Growth</span>
                    </div>
                    <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-lg">
                        <span className="text-cyan-400 font-bold">30%</span>{' '}
                        <span className="text-slate-400">Ops</span>
                    </div>
                </div>

                <div className="mb-12">
                    <p className="text-2xl md:text-3xl font-bold text-white">
                        "HELP THEM HEAL.{' '}
                        <span className="text-emerald-400">WE HANDLE THE REST.</span>"
                    </p>
                </div>

                <a
                    href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Pre-Seed%20Inquiry"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-lg rounded-lg hover:opacity-90 transition-opacity"
                >
                    <Mail className="w-5 h-5" />
                    Let's Talk
                    <ArrowRight className="w-5 h-5" />
                </a>
            </div>
        </SlideWrapper>
    );
}
