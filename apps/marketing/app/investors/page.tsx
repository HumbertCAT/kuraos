'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Mail,
    Users,
    TrendingUp,
    Activity,
    Wallet,
    Shield,
    Target,
    CreditCard,
    Cpu,
    CheckCircle2,
    ArrowRight,
    Scale,
    AlertTriangle,
    Brain,
    Lock,
    Wand2,
    BarChart3,
    MessageSquare,
    Calendar,
    HeartPulse,
    FileText,
    Mic,
    RefreshCw,
    Zap,
    Building2,
    Rocket,
    Sparkles,
} from 'lucide-react';

/**
 * INVESTOR DECK v11.0 - CONTENT DENSITY + SILENT LUXURY
 * 
 * Design Philosophy:
 * - High information density (investors want depth)
 * - Silent Luxury aesthetic (Linear, Raycast, Stripe)
 * - Matte black, crisp borders, no motion blur
 */

const TOTAL_SLIDES = 15;

// ============================================
// MOTION VARIANTS
// ============================================
const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' }
};

const stagger = {
    animate: { transition: { staggerChildren: 0.08 } }
};

// ============================================
// LAYOUT COMPONENTS
// ============================================
function SlideWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full w-full flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 max-w-7xl mx-auto">
            {children}
        </div>
    );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            className={`p-5 bg-white/[0.02] border border-white/10 rounded-xl ${className}`}
            variants={fadeUp}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function InvestorsPage() {
    const [currentSlide, setCurrentSlide] = useState(1);

    const goToSlide = useCallback((slide: number) => {
        if (slide >= 1 && slide <= TOTAL_SLIDES) setCurrentSlide(slide);
    }, []);

    const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide]);
    const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    const progressPercent = ((currentSlide - 1) / (TOTAL_SLIDES - 1)) * 100;

    return (
        <div className="min-h-screen bg-[#05050A] text-white overflow-hidden relative">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
                <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 via-violet-500 to-blue-500"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Subtle Grid */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />


            {/* Slide Container */}
            <div className="h-screen w-screen relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="h-full w-full"
                    >
                        {currentSlide === 1 && <SlideHero />}
                        {currentSlide === 2 && <SlideProblem />}
                        {currentSlide === 3 && <SlideMarket />}
                        {currentSlide === 4 && <SlideKillSheet />}
                        {currentSlide === 5 && <SlideMarketMap />}
                        {currentSlide === 6 && <SlideAdvantage />}
                        {currentSlide === 7 && <SlideTrinity />}
                        {currentSlide === 8 && <SlideArsenal />}
                        {currentSlide === 9 && <SlideInvisibleEar />}
                        {currentSlide === 10 && <SlideSecurity />}
                        {currentSlide === 11 && <SlideVentureEconomics />}
                        {currentSlide === 12 && <SlideFinancial />}
                        {currentSlide === 13 && <SlideTraction />}
                        {currentSlide === 14 && <SlideTeam />}
                        {currentSlide === 15 && <SlideAsk />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex items-center justify-center gap-4">
                <button onClick={prevSlide} disabled={currentSlide === 1} className="p-2.5 rounded-full bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i + 1)}
                            className={`h-1.5 rounded-full transition-all ${currentSlide === i + 1 ? 'w-6 bg-teal-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                        />
                    ))}
                </div>
                <button onClick={nextSlide} disabled={currentSlide === TOTAL_SLIDES} className="p-2.5 rounded-full bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ============================================
// SLIDE 1: HERO
// ============================================
function SlideHero() {
    return (
        <SlideWrapper>
            <motion.div className="text-center" initial="initial" animate="animate" variants={stagger}>
                {/* Logo + Trinity Badge */}
                <motion.div className="mb-12" variants={fadeUp}>
                    <img
                        src="/kura-logo-full.png"
                        alt="KURA OS"
                        className="h-24 md:h-32 lg:h-40 mx-auto mb-4"
                    />
                    <div className="inline-flex items-center gap-3">
                        <span className="text-teal-400 font-medium text-sm">CONNECT</span>
                        <span className="text-white/20">·</span>
                        <span className="text-violet-400 font-medium text-sm">PRACTICE</span>
                        <span className="text-white/20">·</span>
                        <span className="text-blue-400 font-medium text-sm">GROW</span>
                    </div>
                </motion.div>

                <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6" variants={fadeUp}>
                    <span className="bg-gradient-to-r from-white via-white to-teal-300 bg-clip-text text-transparent">INTELLIGENT</span>
                    <br />
                    <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">PRACTICE</span>
                    <br />
                    <span className="bg-gradient-to-r from-white/40 via-white/60 to-white/40 bg-clip-text text-transparent">INFRASTRUCTURE</span>
                </motion.h1>

                <motion.p className="text-lg max-w-2xl mx-auto mb-10" variants={fadeUp}>
                    <span className="text-white/60">The Operating System for the next generation of </span>
                    <span className="text-teal-400 font-medium">Mental Health</span>
                    <span className="text-white/60">.</span>
                    <br />
                    <span className="text-white/40">AI-native. HIPAA-ready. Built for scale.</span>
                </motion.p>

                <motion.a
                    href="mailto:humbert@kuraos.ai"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 text-black font-bold rounded-xl hover:from-teal-400 hover:via-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                    variants={fadeUp}
                >
                    Request Deep Dive
                    <ArrowRight className="w-5 h-5" />
                </motion.a>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 2: THE PROBLEM (4 Quadrant Pain Grid)
// ============================================
function SlideProblem() {
    const pains = [
        {
            icon: TrendingUp,
            label: 'REVENUE BLEED',
            highlight: '40% Lead Loss',
            copy: "High-ticket leads on WhatsApp vanish due to slow manual response times. No automation = No conversion.",
        },
        {
            icon: Target,
            label: 'CONTEXT BLINDNESS',
            highlight: 'Dangerous Silos',
            copy: "Your booking engine doesn't know your client is on anti-depressants. Your clinical notes don't know they haven't paid.",
        },
        {
            icon: RefreshCw,
            label: 'THE HAMSTER WHEEL',
            highlight: 'Zero Leverage',
            copy: "Income is strictly tied to manual admin hours. You are a highly paid secretary for your own practice.",
        },
        {
            icon: Zap,
            label: 'THE HYBRID TRAP',
            highlight: '1:1 vs. Retreats',
            copy: "EHRs (SimplePractice) can't manage Retreats. Booking tools (Retreat Guru) can't manage Clinical Care. You pay for both.",
        },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>THE PROBLEM</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Clinical-Commercial Divide
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>
                    Great Healers. Terrible Operators. The 4 silent killers of a modern practice.
                </motion.p>

                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={stagger}>
                    {pains.map((pain, i) => (
                        <div
                            key={i}
                            className="group bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <pain.icon className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <span className="text-xs font-mono text-white/40 block">{pain.label}</span>
                                    <span className="text-sm font-bold text-red-400">{pain.highlight}</span>
                                </div>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed">{pain.copy}</p>
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 3: THE TRINITY (5 Items per Pillar)
// ============================================
function SlideTrinity() {
    const pillars = [
        {
            label: 'CONNECT',
            color: 'teal',
            icon: Users,
            features: [
                { name: 'WhatsApp CRM', sub: 'Unified Inbox' },
                { name: 'Speed-to-Lead', sub: 'Visual Urgency' },
                { name: 'Auto-Qualification', sub: 'AI Triage' },
                { name: 'Smart Calendar', sub: '2-Way Sync' },
                { name: 'Public Wizard', sub: 'Frictionless Booking' },
            ]
        },
        {
            label: 'PRACTICE',
            color: 'violet',
            icon: Brain,
            features: [
                { name: 'Soul Record', sub: 'Patient Timeline' },
                { name: 'Risk Shield', sub: 'Contraindication Alert' },
                { name: 'Sentinel Pulse', sub: 'Emotional Tracking' },
                { name: 'Multimedia Journal', sub: 'Audio/Text' },
                { name: 'Clinical Scribe', sub: 'AI Notes' },
            ]
        },
        {
            label: 'GROW',
            color: 'blue',
            icon: TrendingUp,
            features: [
                { name: 'Nurture Agents', sub: 'Re-engagement' },
                { name: 'Fintech Engine', sub: 'Stripe Connect' },
                { name: 'Membership Builder', sub: 'Recurring Rev' },
                { name: 'Lead Resurrection', sub: 'Anti-Ghosting' },
                { name: 'Business Analytics', sub: 'Real-time HUD' },
            ]
        },
    ];

    const colorMap = {
        teal: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>THE SOLUTION</motion.p>
                <motion.h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white" variants={fadeUp}>
                    The KURA Trinity
                </motion.h2>
                <motion.p className="text-lg text-white/40 mb-8" variants={fadeUp}>We replace 5 different SaaS subscriptions.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {pillars.map((pillar, i) => {
                        const colors = colorMap[pillar.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <pillar.icon className={`w-5 h-5 ${colors.text}`} />
                                    <span className={`font-bold ${colors.text}`}>{pillar.label}</span>
                                </div>
                                <div className="space-y-3">
                                    {pillar.features.map((f, j) => (
                                        <div key={j} className="flex items-start gap-2">
                                            <CheckCircle2 className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                                            <div>
                                                <span className="text-sm text-white font-medium">{f.name}</span>
                                                <span className="text-xs text-white/40 ml-2">{f.sub}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 4: THE ARSENAL (6-Pillar Bento Grid)
// ============================================
function SlideArsenal() {
    const pillars = [
        // Row 1: Active Intelligence
        {
            icon: Activity,
            name: 'SENTINEL PULSE',
            label: 'Monitoring',
            copy: 'Real-time emotional trajectory tracking. We detect the drop before the crash.',
            color: 'teal'
        },
        {
            icon: Shield,
            name: 'CLINICAL SHIELD',
            label: 'Safety',
            copy: 'Active intervention layer. Blocks contraindications and flags crisis keywords in real-time.',
            color: 'blue'
        },
        {
            icon: Sparkles,
            name: 'TRINITY AGENTS',
            label: 'Automation',
            copy: 'Autonomous workers for Connect, Practice & Grow. They book, document, and nurture while you sleep.',
            color: 'violet'
        },
        // Row 2: Infrastructure
        {
            icon: Mic,
            name: 'OMNI-SCRIBE',
            label: 'Ingestion',
            copy: 'Platform Agnostic AI. Records & structures clinical data from Direct Audio, Zoom, Meet, and WhatsApp.',
            color: 'amber'
        },
        {
            icon: RefreshCw,
            name: 'NEURO-NURTURE',
            label: 'The Flywheel',
            copy: "Safe Growing Training Data. Every interaction refines the model's clinical intuition for your practice.",
            color: 'violet'
        },
        {
            icon: Lock,
            name: 'THE VAULT',
            label: 'Sovereignty',
            copy: 'GDPR Native (EU Residency). Architecture hardened for HIPAA Certification (2028 Roadmap).',
            color: 'emerald'
        },
    ];

    const colorMap = {
        teal: { icon: 'text-teal-400', bg: 'bg-teal-500/5', border: 'border-teal-500/20' },
        blue: { icon: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
        violet: { icon: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/20' },
        amber: { icon: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
        emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>PROPRIETARY INTELLIGENCE</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Arsenal
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>Six layers of defense, automation, and insight.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-3" variants={stagger}>
                    {pillars.map((p, i) => {
                        const colors = colorMap[p.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <p.icon className={`w-5 h-5 ${colors.icon}`} />
                                    <span className="text-xs text-white/40 font-mono">{p.label}</span>
                                </div>
                                <h3 className={`text-base font-bold ${colors.icon} mb-2`}>{p.name}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{p.copy}</p>
                            </Card>
                        );
                    })}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 5: SENTINEL PULSE (Clinical Safety HUD)
// ============================================
function SlideInvisibleEar() {
    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>SENTINEL PULSE</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    Active Risk Monitoring
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>
                    24/7 AI Sentinel. Because therapy doesn't stop when the session ends.
                </motion.p>

                <motion.div className="grid md:grid-cols-2 gap-4" variants={stagger}>
                    {/* Left: Intelligence Stream */}
                    <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-white/40 font-mono mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            INTELLIGENCE STREAM
                        </div>

                        {/* Log Entry 1 */}
                        <div className="font-mono text-xs text-white/30 p-2 bg-white/[0.02] rounded border border-white/5">
                            <span className="text-white/20">[10:42 AM]</span> Scanning Patient Journals (N=142)...
                        </div>

                        {/* Critical Alert - Pulsing */}
                        <div className="bg-gradient-to-r from-red-950/50 to-transparent border border-red-500/40 rounded-lg p-4 animate-pulse">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-white/40">[10:45 AM]</span>
                                <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">CRITICAL</span>
                            </div>
                            <div className="text-sm font-bold text-red-400 mb-2">⚠ PATIENT 892 (SOFIA R.)</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex gap-2">
                                    <span className="text-white/40">Status:</span>
                                    <span className="text-red-300 font-medium">CRITICAL FLAG DETECTED</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-white/40">Source:</span>
                                    <span className="text-white/60">Journal Entry #45</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-white/40">Triggers:</span>
                                    <span className="text-red-300 font-mono">"Ending it", "Goodbye", "No hope"</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendation */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <div className="text-xs text-amber-400 font-bold mb-2">⚡ ACTION REQUIRED: Urgent Intervention</div>
                            <div className="flex gap-2">
                                <button className="flex-1 text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 px-3 rounded-lg hover:bg-emerald-500/30 transition-colors">
                                    📞 Call Patient
                                </button>
                                <button className="flex-1 text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-400 py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors">
                                    🚑 Dispatch Protocol
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Risk Analysis */}
                    <div className="space-y-4">
                        {/* Risk Chart */}
                        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-white/40 font-mono">RISK SCORE (7 DAYS)</span>
                                <span className="text-lg font-bold text-red-400">92/100</span>
                            </div>
                            <div className="relative h-24">
                                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                                    {/* Grid */}
                                    <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    {/* Risk Line */}
                                    <path
                                        d="M 0,55 L 30,52 L 60,50 L 90,48 L 120,45 L 150,30 L 180,8"
                                        fill="none"
                                        stroke="url(#riskGradient)"
                                        strokeWidth="2"
                                    />
                                    {/* Spike Point */}
                                    <circle cx="180" cy="8" r="4" fill="#ef4444" />
                                    <defs>
                                        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="70%" stopColor="#f59e0b" />
                                            <stop offset="100%" stopColor="#ef4444" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                {/* Day labels */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-white/20 font-mono">
                                    <span>Day 1</span>
                                    <span>Day 4</span>
                                    <span className="text-red-400">Day 7</span>
                                </div>
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-amber-400">-45%</div>
                                <div className="text-[10px] text-white/40">Sentiment</div>
                                <div className="text-[9px] text-amber-400/60">Rapid Drop</div>
                            </div>
                            <div className="bg-neutral-900/60 backdrop-blur-xl border border-red-500/30 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-red-400">92</div>
                                <div className="text-[10px] text-white/40">Risk Score</div>
                                <div className="text-[9px] text-red-400/60">Critical</div>
                            </div>
                            <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-white/60">4d</div>
                                <div className="text-[10px] text-white/40">Last Contact</div>
                                <div className="text-[9px] text-white/30">Silent</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 6: THE MARKET (The Great Migration - Bento Grid)
// ============================================
function SlideMarket() {
    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>THE MARKET</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Great Migration
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>From Low-Margin Insurance to High-Ticket Sovereignty.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {/* Block A: The Macro Wave (Spans 1 col, 2 rows on desktop) */}
                    <Card className="md:row-span-2 flex flex-col justify-between bg-gradient-to-b from-teal-500/5 to-transparent">
                        <div>
                            <p className="text-xs text-white/40 font-mono mb-4">THE MACRO WAVE</p>
                            <div className="text-5xl md:text-6xl font-bold text-teal-400 mb-2">$120B</div>
                            <p className="text-sm text-white/60 mb-6">Global Mental Health Market</p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">Behavioral Software (2030)</span>
                                <span className="text-sm font-bold text-white">$8.2B</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white/40">YoY Growth</span>
                                <span className="text-sm font-bold text-teal-400">+11% CAGR</span>
                            </div>
                        </div>
                        <p className="text-[11px] text-white/30 mt-4 italic">The demand is exploding. The infrastructure is broken.</p>
                    </Card>

                    {/* Block B: Unit Economics Shift (Top Right) */}
                    <Card className="md:col-span-2">
                        <p className="text-xs text-white/40 font-mono mb-4">THE UNIT ECONOMICS SHIFT</p>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Old Way */}
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="text-xs text-red-400/80 font-mono mb-2">🔴 OLD (INSURANCE)</div>
                                <div className="text-3xl font-bold text-red-400 mb-1">$111/hr</div>
                                <p className="text-xs text-white/40 mb-2">Avg. Reimbursement</p>
                                <div className="flex items-center gap-1 text-[10px] text-red-400/60">
                                    <TrendingUp className="w-3 h-3 rotate-180" />
                                    <span>-3.4% Real Value</span>
                                </div>
                                <p className="text-[10px] text-white/30 mt-2">Pain: Burnout & Volume</p>
                            </div>
                            {/* New Way */}
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                <div className="text-xs text-emerald-400/80 font-mono mb-2">🟢 NEW (RETREATS)</div>
                                <div className="text-3xl font-bold text-emerald-400 mb-1">$3,500+</div>
                                <p className="text-xs text-white/40 mb-2">Per Participant</p>
                                <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Psychedelic Boom</span>
                                </div>
                                <p className="text-[10px] text-white/30 mt-2">Gain: High Margin & Depth</p>
                            </div>
                        </div>
                    </Card>

                    {/* Block C: Wallet Share (Bottom Right) */}
                    <Card className="md:col-span-2">
                        <p className="text-xs text-white/40 font-mono mb-2">WALLET SHARE PROOF</p>
                        <h3 className="text-lg font-bold text-white mb-3">They Are Already Spending</h3>
                        <div className="flex items-end gap-4 mb-3">
                            <div className="text-4xl font-bold text-violet-400">$600</div>
                            <div className="text-sm text-white/40 pb-1">/ month</div>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed mb-3">
                            The average US solo-practitioner spends $400-$600/mo on a fragmented stack (EHR + Email + Marketing + Directory listings).
                        </p>
                        <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                            <p className="text-xs text-violet-300">
                                <span className="font-bold">KURA Opportunity:</span> Consolidate this spend into one superior OS at €49-€149/mo.
                            </p>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 6: BUSINESS MODEL (The Stack)
// ============================================
function SlideBusinessModel() {
    const layers = [
        {
            label: 'LAYER 1: SaaS',
            title: 'The Floor',
            highlight: '€49 - €149/mo',
            copy: 'Recurring subscription revenue. Predictable, stable base.',
            color: 'teal'
        },
        {
            label: 'LAYER 2: FINTECH',
            title: 'The Upside',
            highlight: '1.5% GMV Take Rate',
            copy: 'We process high-ticket payments (€2K+). This is our massive upside.',
            color: 'violet',
            featured: true
        },
        {
            label: 'LAYER 3: AI USAGE',
            title: 'The Margin',
            highlight: '50% Margin',
            copy: 'Consumption-based AI credits. Real-time token metering.',
            color: 'blue'
        },
    ];

    const colorMap = {
        teal: { text: 'text-teal-400', bg: 'bg-teal-500/5', border: 'border-teal-500/20' },
        violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>BUSINESS MODEL</motion.p>
                <motion.h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white" variants={fadeUp}>
                    Triple Revenue Stack
                </motion.h2>

                <motion.div className="space-y-4" variants={stagger}>
                    {layers.map((layer, i) => {
                        const colors = colorMap[layer.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border} ${layer.featured ? 'ring-1 ring-violet-500/50' : ''}`}>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-mono text-white/40">{layer.label}</span>
                                            {layer.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">KEY DRIVER</span>}
                                        </div>
                                        <h3 className="text-lg font-bold text-white">{layer.title}</h3>
                                        <p className="text-sm text-white/50">{layer.copy}</p>
                                    </div>
                                    <div className={`text-2xl font-bold font-mono ${colors.text}`}>{layer.highlight}</div>
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 7: VENTURE ECONOMICS (ARPU Deep Dive)
// ============================================
function SlideVentureEconomics() {
    const arpuStack = [
        { label: 'Fintech Take Rate', value: '€250', pct: 55, color: 'violet', icon: '💳', desc: '1.5% on €3,500+ Retreat GMV' },
        { label: 'SaaS Subscription', value: '€150', pct: 33, color: 'teal', icon: '☁️', desc: 'Pro/Center Tier Recurring' },
        { label: 'AI Credits', value: '€50', pct: 12, color: 'blue', icon: '🧠', desc: 'Usage-Based (50% Margin)' },
    ];

    const ltvDrivers = [
        { icon: '🏥', title: 'Clinical Gravity', desc: 'Patient history (EHR) creates natural retention. Data migration is painful.' },
        { icon: '💳', title: 'Cash Flow Lock', desc: 'We handle their revenue. Churn means stopping their business.' },
        { icon: '🔄', title: 'Post-Care Tail', desc: 'Monetizing the 6-week integration phase after the retreat.' },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>VENTURE ECONOMICS</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    High-Ticket Infrastructure
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>High-Fidelity Revenue. €450 ARPU vs €180 Industry Average.</motion.p>

                <motion.div className="grid md:grid-cols-2 gap-6" variants={stagger}>
                    {/* Left: ARPU Stack */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs text-white/40 font-mono">TARGET ARPU</p>
                            <span className="text-xs text-white/30">vs €180 avg</span>
                        </div>

                        <div className="text-5xl font-bold text-emerald-400 mb-6">€450<span className="text-lg text-white/40 font-normal">/mo</span></div>

                        {/* Stacked Bar Visualization */}
                        <div className="relative h-12 bg-white/5 rounded-lg overflow-hidden mb-6 flex">
                            {arpuStack.map((item, i) => (
                                <div
                                    key={i}
                                    className={`h-full flex items-center justify-center text-xs font-bold ${item.color === 'violet' ? 'bg-violet-500/40' :
                                        item.color === 'teal' ? 'bg-teal-500/40' : 'bg-blue-500/40'
                                        }`}
                                    style={{ width: `${item.pct}%` }}
                                >
                                    {item.value}
                                </div>
                            ))}
                        </div>

                        {/* ARPU Breakdown */}
                        <div className="space-y-3">
                            {arpuStack.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white">{item.label}</span>
                                            <span className={`text-sm font-bold ${item.color === 'violet' ? 'text-violet-400' :
                                                item.color === 'teal' ? 'text-teal-400' : 'text-blue-400'
                                                }`}>{item.value}</span>
                                        </div>
                                        <div className="text-[11px] text-white/40">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Right: Growth + LTV */}
                    <div className="space-y-4">
                        {/* Customer Path */}
                        <Card>
                            <p className="text-xs text-white/40 font-mono mb-3">CUSTOMER TRAJECTORY</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <div className="text-2xl font-bold text-white">50</div>
                                    <div className="text-xs text-white/40">2026 (Seed)</div>
                                    <div className="text-[10px] text-teal-400/60">High Touch</div>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <div className="text-2xl font-bold text-white">500</div>
                                    <div className="text-xs text-white/40">2028 (Ser. A)</div>
                                    <div className="text-[10px] text-violet-400/60">HIPAA Ready</div>
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-lg">
                                    <div className="text-2xl font-bold text-emerald-400">2,500+</div>
                                    <div className="text-xs text-white/40">2030 (Exit)</div>
                                    <div className="text-[10px] text-emerald-400/60">Category King</div>
                                </div>
                            </div>
                        </Card>

                        {/* LTV Drivers */}
                        <Card>
                            <p className="text-xs text-white/40 font-mono mb-3">WHY HIGH LTV?</p>
                            <div className="space-y-3">
                                {ltvDrivers.map((m, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-lg">{m.icon}</span>
                                        <div>
                                            <div className="text-xs font-medium text-white">{m.title}</div>
                                            <div className="text-[11px] text-white/40">{m.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 8: THE KILL SHEET (5-Player Matrix with Valuations)
// ============================================
function SlideKillSheet() {
    const dimensions = [
        {
            dimension: 'Status / Val.',
            simplepractice: { text: '$4.0B (Acq.)', status: 'valuation' },
            honeybook: { text: '$2.4B (Peak)', status: 'valuation' },
            heidi: { text: '$465M (Ser. B)', status: 'valuation' },
            retreatguru: { text: '~$20M (Est.)', status: 'neutral' },
            kura: { text: 'PRE-SEED', status: 'preseed' },
        },
        {
            dimension: 'Type',
            simplepractice: { text: 'Legacy ERP', status: 'neutral' },
            honeybook: { text: 'General CRM', status: 'neutral' },
            heidi: { text: 'AI Feature', status: 'neutral' },
            retreatguru: { text: 'Booking Engine', status: 'neutral' },
            kura: { text: 'End-to-End OS', status: 'good' },
        },
        {
            dimension: 'Architecture',
            simplepractice: { text: 'Ruby Monolith', status: 'bad' },
            honeybook: { text: 'Web App', status: 'neutral' },
            heidi: { text: 'Headless Tool', status: 'neutral' },
            retreatguru: { text: 'WordPress Legacy', status: 'bad' },
            kura: { text: 'AI-Native Platform', status: 'good' },
        },
        {
            dimension: 'Security',
            simplepractice: { text: '✅ HIPAA Compliant', status: 'good' },
            honeybook: { text: '⛔ Illegal (No HIPAA)', status: 'bad' },
            heidi: { text: '✅ HIPAA (Scribing)', status: 'good' },
            retreatguru: { text: '⚠️ Partial / Guest', status: 'neutral' },
            kura: { text: '✅ Encrypted Vault', status: 'good' },
        },
        {
            dimension: 'Business Model',
            simplepractice: { text: 'Predatory Fees', status: 'bad' },
            honeybook: { text: 'Sub + Processing', status: 'neutral' },
            heidi: { text: 'Usage / SaaS', status: 'neutral' },
            retreatguru: { text: '14% Commission', status: 'bad' },
            kura: { text: 'SaaS + Fintech Share', status: 'good' },
        },
        {
            dimension: 'Data Control',
            simplepractice: { text: 'Hostile Lock-in', status: 'bad' },
            honeybook: { text: 'No Export', status: 'bad' },
            heidi: { text: 'API Access', status: 'neutral' },
            retreatguru: { text: 'Marketplace Data', status: 'bad' },
            kura: { text: '✅ Sovereign Vault', status: 'good' },
        },
    ];

    const statusColor = (status: string) => {
        if (status === 'bad') return 'text-red-400';
        if (status === 'good') return 'text-teal-400';
        if (status === 'valuation') return 'text-amber-400 font-bold';
        if (status === 'preseed') return 'text-emerald-400 font-bold';
        return 'text-white/50';
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>COMPETITIVE ANALYSIS</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Financial Reality
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>Billion-dollar incumbents. One pre-seed challenger.</motion.p>

                <motion.div className="overflow-x-auto -mx-4 px-4" variants={fadeUp}>
                    <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-white/30 font-normal w-24">Dimension</th>
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-orange-400/80 font-normal">
                                    <div>SimplePractice</div>
                                    <div className="text-[9px] text-white/20 font-normal normal-case">The Old Giant</div>
                                </th>
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-pink-400/80 font-normal">
                                    <div>HoneyBook</div>
                                    <div className="text-[9px] text-white/20 font-normal normal-case">The Aesthetic</div>
                                </th>
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-blue-400/80 font-normal">
                                    <div>Heidi Health</div>
                                    <div className="text-[9px] text-white/20 font-normal normal-case">The AI Feature</div>
                                </th>
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-yellow-400/80 font-normal">
                                    <div>Retreat Guru</div>
                                    <div className="text-[9px] text-white/20 font-normal normal-case">The Legacy</div>
                                </th>
                                <th className="p-2 md:p-3 text-[10px] md:text-xs uppercase tracking-widest text-teal-400 font-medium bg-gradient-to-r from-teal-500/10 to-violet-500/10">
                                    <div>KURA OS</div>
                                    <div className="text-[9px] text-teal-300/60 font-normal normal-case">The Future</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {dimensions.map((row, i) => (
                                <tr key={i} className={`border-b border-white/5 ${i === 0 ? 'bg-white/[0.02]' : ''}`}>
                                    <td className="p-2 md:p-3 text-white/60 font-medium">{row.dimension}</td>
                                    <td className={`p-2 md:p-3 ${statusColor(row.simplepractice.status)}`}>{row.simplepractice.text}</td>
                                    <td className={`p-2 md:p-3 ${statusColor(row.honeybook.status)}`}>{row.honeybook.text}</td>
                                    <td className={`p-2 md:p-3 ${statusColor(row.heidi.status)}`}>{row.heidi.text}</td>
                                    <td className={`p-2 md:p-3 ${statusColor(row.retreatguru.status)}`}>{row.retreatguru.text}</td>
                                    <td className={`p-2 md:p-3 ${statusColor(row.kura.status)} bg-gradient-to-r from-teal-500/5 to-violet-500/5`}>{row.kura.text}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 8: MARKET MAP (Scope × Intelligence with Valuations)
// ============================================
function SlideMarketMap() {
    // X = Intelligence (Manual → AI-Native)
    // Y = Scope (Feature → Operating System)
    const players = [
        { name: 'SimplePractice', valuation: '$4.0B', label: 'The Legacy Monopoly', x: 20, y: 80, color: 'bg-orange-500' },
        { name: 'HoneyBook', valuation: '$2.4B', label: 'The Aesthetic CRM', x: 25, y: 25, color: 'bg-pink-500' },
        { name: 'Heidi Health', valuation: '$465M', label: 'Just a Scribe', x: 85, y: 20, color: 'bg-blue-500' },
        { name: 'KURA OS', valuation: 'PRE-SEED', label: 'THE NEXT CATEGORY KING', x: 85, y: 85, color: 'bg-teal-500', isKura: true },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>MARKET POSITIONING</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    Escaping the Commodity Trap
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>Tools solve tasks. Operating Systems run businesses.</motion.p>

                <motion.div
                    className="relative w-full h-[420px] bg-white/[0.01] border border-white/10 rounded-xl"
                    variants={fadeUp}
                >
                    {/* Y-Axis Label */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-white/50 whitespace-nowrap font-mono">
                        SCOPE OF OPERATION →
                    </div>

                    {/* X-Axis Label */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm text-white/50 font-mono">
                        CLINICAL INTELLIGENCE →
                    </div>

                    {/* Quadrant Labels */}
                    <div className="absolute left-16 top-6 text-xs text-white/30">Operating System</div>
                    <div className="absolute left-16 bottom-10 text-xs text-white/30">Point Solution</div>
                    <div className="absolute right-6 bottom-10 text-xs text-white/30">AI-Native</div>
                    <div className="absolute left-16 bottom-10 text-xs text-white/30 ml-32">Manual</div>

                    {/* Axes Container */}
                    <div className="absolute left-16 right-8 top-10 bottom-14">
                        {/* Vertical axis */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
                        {/* Horizontal axis */}
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" />
                        {/* Center cross */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />

                        {/* Players */}
                        {players.map((player, i) => (
                            <div
                                key={i}
                                className="absolute transform -translate-x-1/2 translate-y-1/2"
                                style={{ left: `${player.x}%`, bottom: `${player.y}%` }}
                            >
                                <div className="relative flex flex-col items-center">
                                    {/* Dot */}
                                    <div className={`w-4 h-4 rounded-full ${player.color} ${player.isKura ? 'ring-8 ring-teal-500/20' : ''}`} />
                                    {/* Label */}
                                    <div className="mt-2 text-center">
                                        <div className={`font-medium ${player.isKura ? 'text-base text-teal-400 font-bold' : 'text-sm text-white/70'}`}>
                                            {player.name}
                                        </div>
                                        <div className={`text-sm font-bold ${player.isKura ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {player.valuation}
                                        </div>
                                        <div className={`text-xs ${player.isKura ? 'text-teal-300/70' : 'text-white/40'}`}>
                                            {player.label}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Quadrant shading for top-right */}
                        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-gradient-to-br from-teal-500/5 to-transparent rounded-tr-xl" />
                    </div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 9: THE UNFAIR ADVANTAGE (Competitive Moat)
// ============================================
function SlideAdvantage() {
    const pillars = [
        {
            emoji: '🧘‍♂️',
            headline: 'Built by Practitioners',
            stat: '10 Years & 1,000+ Journeys',
            copy: "Humbert isn't just an engineer. He is a veteran facilitator. We understand the nuance of a 'Bad Trip' and the logistics of a 20-person retreat because we've lived it.",
            badges: ['Serial Entrepreneur', 'Product Architect', 'Clinical Expert'],
            color: 'violet'
        },
        {
            emoji: '⚡',
            headline: 'Born in the Intelligence Age',
            stat: '0% Legacy Code',
            copy: "Incumbents like SimplePractice are trying to bolt AI onto 10-year-old Ruby monoliths. We started with LLMs as our co-founders. Our cost is 10x lower; our speed is 10x faster.",
            badges: ['AI-Native', 'Modern Stack', 'Infinite Leverage'],
            color: 'teal'
        },
        {
            emoji: '🌊',
            headline: 'Riding the Deregulation Tsunami',
            stat: 'First Mover in Psychedelic Ops',
            copy: "As MDMA and Psilocybin gain FDA/EMA approval, clinics need specific protocols (Prep/Dose/Integration). General tools fail here. We are the purpose-built infrastructure.",
            badges: ['FDA Timing', 'Clinical Protocols', 'Category Creator'],
            color: 'blue'
        },
    ];

    const colorMap = {
        violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
        teal: { bg: 'bg-teal-500/5', border: 'border-teal-500/20', text: 'text-teal-400' },
        blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>COMPETITIVE ADVANTAGE</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Unfair Advantage
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>Where Deep Tech meets Deep Care.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {pillars.map((pillar, i) => {
                        const colors = colorMap[pillar.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border}`}>
                                <div className="text-3xl mb-3">{pillar.emoji}</div>
                                <h3 className={`font-bold text-sm ${colors.text} mb-1`}>{pillar.headline}</h3>
                                <div className="text-xl font-bold text-white mb-3">{pillar.stat}</div>
                                <p className="text-xs text-white/50 leading-relaxed mb-4">{pillar.copy}</p>
                                <div className="flex flex-wrap gap-1">
                                    {pillar.badges.map((badge, j) => (
                                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>

                {/* Winning Formula Footer */}
                <motion.div
                    className="mt-6 p-4 bg-white/[0.02] border border-white/10 rounded-xl"
                    variants={fadeUp}
                >
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        <span className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">🧠 Brilliance</span>
                        <span className="text-white/30 font-mono">+</span>
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">🍄 Domain Authority</span>
                        <span className="text-white/30 font-mono">+</span>
                        <span className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">🤖 AI-Native Speed</span>
                        <span className="text-white/30 font-mono">=</span>
                        <span className="px-4 py-1.5 bg-gradient-to-r from-teal-500/20 to-violet-500/20 border border-teal-500/30 rounded-lg text-white font-bold">🚀 CATEGORY KING</span>
                    </div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 10: VENTURE TRAJECTORY (Financial Path)
// ============================================
function SlideFinancial() {
    const milestones = [
        { year: '2026', value: '€2.5M', focus: 'PMF & First 50 Centers', pct: 15, color: 'teal' },
        { year: '2028', value: '€15M', focus: 'HIPAA Cert & 500 Centers', pct: 45, color: 'violet' },
        { year: '2030', value: '€100M', focus: 'Category Dominance', pct: 90, color: 'emerald' },
    ];

    const moats = [
        { icon: '🏥', title: 'Clinical OS Lock-in', desc: 'We hold patient history (EHR). Migration is painful, retention is natural.' },
        { icon: '💳', title: 'Fintech Gravity', desc: 'We process their revenue. Leaving Kura means stopping cash flow.' },
        { icon: '🔄', title: 'Integration Tail', desc: 'Unlike platforms that end at checkout, we monetize post-retreat therapy months.' },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>VENTURE TRAJECTORY</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Path to €100M
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>From Bootstrap to Category King.</motion.p>

                <motion.div className="grid md:grid-cols-2 gap-6" variants={stagger}>
                    {/* Left: Valuation Curve */}
                    <Card className="relative overflow-hidden">
                        <p className="text-xs text-white/40 font-mono mb-4">VALUATION CURVE</p>

                        {/* J-Curve Visualization */}
                        <div className="relative h-48 mb-4">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="h-px bg-white/5" />
                                ))}
                            </div>

                            {/* Curve path */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path
                                    d="M 5,95 Q 20,90 35,80 T 65,50 T 95,10"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="2"
                                    className="opacity-60"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#14b8a6" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Milestones */}
                            {milestones.map((m, i) => (
                                <div
                                    key={i}
                                    className="absolute transform -translate-x-1/2"
                                    style={{ left: `${15 + i * 35}%`, bottom: `${m.pct}%` }}
                                >
                                    <div className={`w-3 h-3 rounded-full bg-${m.color}-500 ring-4 ring-${m.color}-500/20`} />
                                    <div className="mt-2 text-center whitespace-nowrap">
                                        <div className="text-lg font-bold text-emerald-400">{m.value}</div>
                                        <div className="text-[10px] text-white/40">{m.year}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Focus Areas */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            {milestones.map((m, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                    <span className="text-white/40 font-mono w-10">{m.year}</span>
                                    <span className="text-white/60">{m.focus}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Right: The Engine */}
                    <div className="space-y-4">
                        {/* Unit Economics */}
                        <Card>
                            <p className="text-xs text-white/40 font-mono mb-3">UNIT ECONOMICS</p>
                            <div className="flex items-end gap-3 mb-4">
                                <div className="text-4xl font-bold text-emerald-400">€450</div>
                                <div className="text-sm text-white/40 pb-1">ARPU / month</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-white/[0.02] rounded-lg">
                                    <div className="text-lg font-bold text-white">50</div>
                                    <div className="text-[10px] text-white/40">2026</div>
                                </div>
                                <div className="p-2 bg-white/[0.02] rounded-lg">
                                    <div className="text-lg font-bold text-white">500</div>
                                    <div className="text-[10px] text-white/40">2028</div>
                                </div>
                                <div className="p-2 bg-white/[0.02] rounded-lg">
                                    <div className="text-lg font-bold text-teal-400">2,500+</div>
                                    <div className="text-[10px] text-white/40">2030</div>
                                </div>
                            </div>
                        </Card>

                        {/* LTV Moat */}
                        <Card>
                            <p className="text-xs text-white/40 font-mono mb-3">WHY HIGH LTV?</p>
                            <div className="space-y-3">
                                {moats.map((m, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-lg">{m.icon}</span>
                                        <div>
                                            <div className="text-xs font-medium text-white">{m.title}</div>
                                            <div className="text-[11px] text-white/40">{m.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 11: TRACTION
// ============================================
function SlideTraction() {
    const metrics = [
        { value: 'v1.1.3', label: 'Production Live', sub: 'Deployed & Operational', icon: Rocket },
        { value: 'Active', label: 'Stripe Connect', sub: 'Payment Infrastructure', icon: CreditCard },
        { value: '4 LOIs', label: 'Day 1 Revenue', sub: 'Signed Commitments', icon: FileText },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>TRACTION</motion.p>
                <motion.h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white" variants={fadeUp}>
                    This is Not a Deck
                </motion.h2>
                <motion.p className="text-lg text-white/40 mb-8" variants={fadeUp}>It's a running company.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {metrics.map((m, i) => (
                        <Card key={i} className="text-center">
                            <m.icon className="w-6 h-6 text-teal-400 mx-auto mb-4" />
                            <div className="text-3xl font-bold text-white mb-1">{m.value}</div>
                            <div className="text-sm text-white/60 font-medium">{m.label}</div>
                            <div className="text-xs text-white/40">{m.sub}</div>
                        </Card>
                    ))}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 8: ROADMAP
// ============================================
function SlideRoadmap() {
    const milestones = [
        { year: '2026', title: 'Viral Loop', sub: 'Acquisition Engine', icon: Zap, color: 'teal' },
        { year: '2027', title: 'Fintech Bank', sub: 'Full Monetization', icon: CreditCard, color: 'violet' },
        { year: '2028', title: 'B2B Network', sub: 'Corporate API', icon: Building2, color: 'blue' },
    ];

    const colorMap = {
        teal: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>ROADMAP</motion.p>
                <motion.h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white" variants={fadeUp}>
                    Path to €100M Valuation
                </motion.h2>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {milestones.map((m, i) => {
                        const colors = colorMap[m.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border} text-center`}>
                                <div className={`text-3xl font-bold font-mono ${colors.text} mb-2`}>{m.year}</div>
                                <m.icon className={`w-6 h-6 ${colors.text} mx-auto mb-3`} />
                                <h3 className="text-lg font-bold text-white">{m.title}</h3>
                                <p className="text-sm text-white/50">{m.sub}</p>
                            </Card>
                        );
                    })}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 11: SECURITY ARCHITECTURE (The Kura Vault)
// ============================================
function SlideSecurity() {
    const layers = [
        {
            icon: '🔥',
            title: 'THE CLEAN ROOM',
            subtitle: 'Toxic Waste Disposal',
            items: [
                { label: 'Raw Audio Incineration', desc: 'Process for AI, then permanently delete source files immediately.' },
                { label: 'Zero Liability', desc: 'No gigabytes of therapy recordings. If breached, nothing to hear.' },
            ],
            color: 'emerald'
        },
        {
            icon: '🛡️',
            title: 'THE VAULT',
            subtitle: 'Hardened Database',
            items: [
                { label: 'Row Level Security', desc: 'Mathematical guarantee User A cannot read User B data.' },
                { label: 'AES-256 Encryption', desc: 'Data encrypted at rest and in transit.' },
                { label: 'Sovereign Keys', desc: 'Client-managed encryption keys (roadmap).' },
            ],
            color: 'teal'
        },
        {
            icon: '⚖️',
            title: 'COMPLIANCE PATH',
            subtitle: 'Regulatory Strategy',
            items: [
                { label: '✅ GDPR (Europe)', desc: 'Compliant now. Data residency EU.' },
                { label: '🟡 HIPAA (USA)', desc: 'Architecturally ready. Pending audit (Series A).' },
                { label: '🟡 SOC 2 Type II', desc: 'Planned for enterprise scale.' },
            ],
            color: 'violet'
        },
    ];

    const colorMap = {
        emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400' },
        teal: { bg: 'bg-teal-500/5', border: 'border-teal-500/20', text: 'text-teal-400' },
        violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-400' },
    };

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>SECURITY ARCHITECTURE</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    Sovereignty by Design
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-8" variants={fadeUp}>Zero-Knowledge Architecture. HIPAA Ready Infrastructure.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger}>
                    {layers.map((layer, i) => {
                        const colors = colorMap[layer.color as keyof typeof colorMap];
                        return (
                            <Card key={i} className={`${colors.bg} ${colors.border}`}>
                                <div className="text-3xl mb-3">{layer.icon}</div>
                                <h3 className={`font-bold text-sm ${colors.text} mb-1`}>{layer.title}</h3>
                                <p className="text-xs text-white/40 mb-4">{layer.subtitle}</p>
                                <div className="space-y-3">
                                    {layer.items.map((item, j) => (
                                        <div key={j}>
                                            <div className="text-xs text-white font-medium font-mono">{item.label}</div>
                                            <div className="text-[11px] text-white/40 leading-relaxed">{item.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 12: THE TEAM (Player Profile)
// ============================================
function SlideTeam() {
    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger} className="text-center">
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>THE FOUNDER</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    The Architect
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-8" variants={fadeUp}>Where Silicon Valley meets Ancient Wisdom.</motion.p>

                {/* Organic Layout: Photo Center + Floating Cards */}
                <motion.div className="relative max-w-4xl mx-auto" variants={stagger}>
                    {/* Central Photo */}
                    <motion.div className="flex flex-col items-center mb-8" variants={fadeUp}>
                        <div className="relative">
                            <img
                                src="/humbert-photo.jpg"
                                alt="Humbert Torroella"
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-teal-500/30 shadow-2xl shadow-teal-500/10"
                            />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-1 rounded-full">
                                <span className="text-xs font-bold text-black">FOUNDER</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-6">Humbert Torroella</h3>
                        <p className="text-teal-400 text-sm">Product Architect & Clinical Operator</p>
                        <p className="text-sm text-white/40 italic mt-3 max-w-md">"I built Kura because generalist software was failing my patients."</p>
                    </motion.div>

                    {/* Floating Stats Grid */}
                    <motion.div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto" variants={stagger}>
                        {/* Builder Card */}
                        <motion.div
                            className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl p-5 md:-rotate-1 hover:rotate-0 transition-transform"
                            variants={fadeUp}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">⚡</span>
                                <span className="text-sm font-bold text-teal-400">THE BUILDER</span>
                            </div>
                            <div className="flex justify-around text-center">
                                <div>
                                    <div className="text-3xl font-bold text-white">10+</div>
                                    <div className="text-xs text-white/40">Years in Tech</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-teal-400">30</div>
                                    <div className="text-xs text-white/40">Days to v1.0</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Healer Card */}
                        <motion.div
                            className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 md:rotate-1 hover:rotate-0 transition-transform"
                            variants={fadeUp}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🌿</span>
                                <span className="text-sm font-bold text-emerald-400">THE HEALER</span>
                            </div>
                            <div className="flex justify-around text-center">
                                <div>
                                    <div className="text-3xl font-bold text-emerald-400">1,000+</div>
                                    <div className="text-xs text-white/40">Journeys</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">20+</div>
                                    <div className="text-xs text-white/40">Retreats/Year</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Advantage Tags */}
                    <motion.div className="flex flex-wrap justify-center gap-2 mt-6" variants={fadeUp}>
                        {['Failed Fast, Learned Faster', 'Full Stack Operator', 'Category Native'].map((tag, i) => (
                            <span key={i} className="text-xs px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}

// ============================================
// SLIDE 16: THE ASK (Investment Opportunity - Ambitious)
// ============================================
function SlideAsk() {
    const useOfFunds = [
        { pct: 45, label: 'Product', icon: '🛠️', desc: 'AletheIA Native & Security Hardening', color: 'teal' },
        { pct: 35, label: 'Growth', icon: '🚀', desc: 'Founder-Led Sales to 100 Centers', color: 'violet' },
        { pct: 20, label: 'Ops', icon: '⚖️', desc: 'Legal (HIPAA) & Admin', color: 'blue' },
    ];

    return (
        <SlideWrapper>
            <motion.div initial="initial" animate="animate" variants={stagger}>
                <motion.p className="text-white/40 font-mono text-xs tracking-widest mb-3" variants={fadeUp}>THE INVESTMENT OPPORTUNITY</motion.p>
                <motion.h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white" variants={fadeUp}>
                    Join the Mission
                </motion.h2>
                <motion.p className="text-sm text-white/40 mb-6" variants={fadeUp}>Fueling the path to a €15M Series A.</motion.p>

                <motion.div className="grid md:grid-cols-3 gap-4 mb-6" variants={stagger}>
                    {/* Col 1: THE DEAL */}
                    <Card className="bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/20">
                        <p className="text-xs text-white/40 font-mono mb-4">THE DEAL</p>
                        <div className="text-5xl md:text-6xl font-bold text-emerald-400 mb-2">€250K</div>
                        <p className="text-sm text-white/50 mb-6">Pre-Seed Round</p>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-sm">
                                <span>📄</span>
                                <span className="text-white/40">Instrument:</span>
                                <span className="text-white font-medium">SAFE (YC)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span>🎯</span>
                                <span className="text-white/40">Val. Cap:</span>
                                <span className="text-emerald-400 font-bold">€3M</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span>⏳</span>
                                <span className="text-white/40">Runway:</span>
                                <span className="text-white font-medium">18-24 Months</span>
                            </div>
                        </div>
                    </Card>

                    {/* Col 2: THE FUEL */}
                    <Card>
                        <p className="text-xs text-white/40 font-mono mb-4">THE FUEL</p>

                        {/* Fund Bar */}
                        <div className="relative h-10 bg-white/5 rounded-lg overflow-hidden mb-4 flex">
                            <div className="h-full bg-teal-500/50 flex items-center justify-center text-sm font-bold" style={{ width: '45%' }}>45%</div>
                            <div className="h-full bg-violet-500/50 flex items-center justify-center text-sm font-bold" style={{ width: '35%' }}>35%</div>
                            <div className="h-full bg-blue-500/50 flex items-center justify-center text-sm font-bold" style={{ width: '20%' }}>20%</div>
                        </div>

                        <div className="space-y-3">
                            {useOfFunds.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <div>
                                        <div className="text-sm text-white font-medium">{item.pct}% {item.label}</div>
                                        <div className="text-xs text-white/40">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Col 3: THE MULTIPLIER */}
                    <Card>
                        <p className="text-xs text-white/40 font-mono mb-4">THE MULTIPLIER</p>

                        <div className="space-y-3">
                            {/* Step 1: NOW */}
                            <div className="p-3 rounded-lg bg-white/[0.02]">
                                <div className="text-[10px] text-white/40 font-mono mb-1">2026 · NOW</div>
                                <div className="text-xl font-bold text-white">€3M Cap</div>
                                <div className="text-xs text-white/40">Entry Point</div>
                            </div>

                            {/* Step 2: SERIES A - Highlighted */}
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 relative">
                                <div className="absolute -top-2 right-2">
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">5×</span>
                                </div>
                                <div className="text-[10px] text-white/40 font-mono mb-1">2028 · SERIES A</div>
                                <div className="text-2xl font-bold text-emerald-400">€15M</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">€1M ARR</span>
                                    <span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded">100+ Centers</span>
                                    <span className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded">HIPAA</span>
                                </div>
                            </div>

                            {/* Step 3: SERIES B */}
                            <div className="p-3 rounded-lg bg-white/[0.02]">
                                <div className="text-[10px] text-white/40 font-mono mb-1">2030 · SERIES B</div>
                                <div className="text-xl font-bold text-white">€100M</div>
                                <div className="text-xs text-white/40">Global Expansion & B2B API</div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Footer CTA */}
                <motion.div className="text-center" variants={fadeUp}>
                    <p className="text-sm text-white/40 mb-4">Join us in building the Operating System for Conscious Healthcare.</p>
                    <a
                        href="mailto:humbert@kuraos.ai?subject=KURA%20OS%20Investment%20Inquiry"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-black font-bold rounded-lg hover:bg-teal-400 transition-colors"
                    >
                        <Mail className="w-5 h-5" />
                        Schedule Deep Dive
                        <ArrowRight className="w-5 h-5" />
                    </a>
                </motion.div>
            </motion.div>
        </SlideWrapper>
    );
}
