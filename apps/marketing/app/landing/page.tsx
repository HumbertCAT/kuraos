'use client';

import { useState } from 'react';
import {
    Zap,
    Users,
    TrendingUp,
    Activity,
    Shield,
    Lock,
    MessageSquare,
    Calendar,
    CreditCard,
    Brain,
    HeartPulse,
    FileText,
    RefreshCw,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Menu,
    X,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    BarChart3,
    Bot,
    Flame,
    Check
} from 'lucide-react';

/**
 * LANDING PAGE v2.0 - CYBER-CLINICAL TEMPLE
 * 
 * Sections:
 * 1. Hero - The Command Center
 * 2. Problem - The Fragmentation
 * 3. Solution - The Trinity (Connect/Practice/Grow)
 * 4. Deep Tech - Sentinel Pulse & Aletheia
 * 5. Security - The Vault
 * 6. Pricing
 * 7. Footer
 */

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    return (
        <div className="min-h-screen bg-[#030305] text-white overflow-x-hidden">
            {/* Grid Pattern Background */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(128,128,128,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.04) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Atmospheric Glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-teal-500/[0.08] blur-[200px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-violet-500/[0.08] blur-[200px] pointer-events-none" />
            <div className="fixed top-[50%] left-[50%] w-[600px] h-[600px] rounded-full bg-blue-500/[0.05] blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030305]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src="/kura-logo-dark.png"
                            alt="KURA OS"
                            className="h-16 md:h-40 w-auto object-contain"
                        />
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</a>
                        <a href="#technology" className="text-white/60 hover:text-white transition-colors text-sm">Technology</a>
                        <a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</a>
                        <a href="https://app.kuraos.ai/es/login" className="text-white/60 hover:text-white transition-colors text-sm">Login</a>
                        <a
                            href="https://app.kuraos.ai/es/register"
                            className="px-4 py-2 bg-teal-500 text-black font-semibold text-sm rounded-lg hover:bg-teal-400 transition-colors"
                        >
                            Start Free
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#030305] border-t border-white/5 px-6 py-4 space-y-4">
                        <a href="#features" className="block text-white/60 hover:text-white">Features</a>
                        <a href="#technology" className="block text-white/60 hover:text-white">Technology</a>
                        <a href="#pricing" className="block text-white/60 hover:text-white">Pricing</a>
                        <a href="https://app.kuraos.ai/es/login" className="block text-white/60 hover:text-white">Login</a>
                        <a
                            href="https://app.kuraos.ai/es/register"
                            className="block px-4 py-2 bg-teal-500 text-black font-semibold rounded-lg text-center"
                        >
                            Start Free
                        </a>
                    </div>
                )}
            </nav>

            <main className="relative z-10">
                {/* ============================================ */}
                {/* SECTION 1: HERO */}
                {/* ============================================ */}
                <section className="min-h-screen flex items-center justify-center pt-48 px-6">
                    <div className="max-w-6xl mx-auto text-center">
                        {/* Eyebrow */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-teal-500/10 via-violet-500/10 to-blue-500/10 border border-white/10">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            <span className="text-sm text-white/70">
                                The Operating System for <span className="text-teal-400 font-medium">Conscious Practitioners</span>
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.95]">
                            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-teal-400 bg-clip-text text-transparent">
                                INTELLIGENT
                            </span>
                            <span className="block text-white">
                                PRACTICE
                            </span>
                            <span className="block bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                                INFRASTRUCTURE
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10">
                            Stop patching together generic tools. Kura OS unifies your entire clinical and business operation in one command center.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <a
                                href="https://app.kuraos.ai/es/register"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-black font-bold rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_40px_rgba(45,212,191,0.4)] hover:shadow-[0_0_60px_rgba(45,212,191,0.6)]"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                            >
                                See Features
                                <ChevronRight className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Layered Dashboard Preview */}
                        <div className="relative max-w-4xl mx-auto">
                            {/* Layer 1: Back - Connect Dashboard */}
                            <div className="absolute -left-8 top-8 w-64 h-48 bg-white/[0.02] border border-white/10 rounded-2xl p-4 transform -rotate-6 hidden md:block">
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare className="w-4 h-4 text-teal-400" />
                                    <span className="text-xs text-white/60">WhatsApp CRM</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-3 bg-teal-500/20 rounded w-1/2"></div>
                                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                                </div>
                            </div>

                            {/* Layer 2: Middle - Practice Dashboard */}
                            <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Patient: Marcus Chen</p>
                                            <p className="text-xs text-white/40">Integration Journey · Week 3</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span className="text-xs text-emerald-400">Stable</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/40 mb-1">Sessions</p>
                                        <p className="text-2xl font-bold font-mono text-teal-400">12</p>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/40 mb-1">Risk Level</p>
                                        <p className="text-2xl font-bold font-mono text-emerald-400">Low</p>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                        <p className="text-xs text-white/40 mb-1">Next Session</p>
                                        <p className="text-2xl font-bold font-mono text-white">2d</p>
                                    </div>
                                </div>
                            </div>

                            {/* Layer 3: Front - Sentinel Pulse Widget */}
                            <div className="absolute -right-4 -bottom-4 md:-right-8 md:-bottom-8 w-72 bg-white/[0.04] border border-violet-500/30 rounded-2xl p-4 backdrop-blur-sm shadow-[0_0_60px_rgba(139,92,246,0.2)] transform rotate-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-violet-400" />
                                    <span className="text-xs font-medium text-violet-300">Sentinel Pulse</span>
                                    <span className="text-xs text-white/40 ml-auto">7 days</span>
                                </div>
                                {/* Emotional Curve Visualization */}
                                <div className="h-16 flex items-end gap-1">
                                    {[65, 55, 70, 60, 75, 85, 80].map((height, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 rounded-t transition-all"
                                            style={{
                                                height: `${height}%`,
                                                background: `linear-gradient(to top, ${height > 70 ? '#10b981' : height > 50 ? '#f59e0b' : '#ef4444'}, transparent)`
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-white/30">
                                    <span>Mon</span>
                                    <span>Today</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* SECTION 2: THE PROBLEM */}
                {/* ============================================ */}
                <section className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-red-400 font-mono text-sm mb-3 tracking-widest">THE PROBLEM</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
                                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    The Clinical-Commercial
                                </span>
                                <br />
                                <span className="text-red-400">Divide.</span>
                            </h2>
                            <p className="text-white/50 max-w-xl mx-auto">
                                Your tools don't talk to each other. Your data lives in silos. Your time is consumed by admin.
                            </p>
                        </div>

                        {/* Chaos → Order Visual */}
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Chaos Side */}
                            <div className="relative p-8 bg-red-500/[0.03] border border-red-500/20 rounded-2xl">
                                <p className="text-red-400 font-mono text-xs mb-4 tracking-widest">BEFORE</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {['WhatsApp', 'Excel', 'Calendar', 'Word', 'Forms', 'Stripe'].map((tool, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/[0.03] border border-white/10 rounded-lg p-3 text-center transform hover:rotate-2 transition-transform"
                                            style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i + 1)}deg)` }}
                                        >
                                            <span className="text-xs text-white/50">{tool}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-white/30 text-sm mt-4 text-center">Fragmented. Disconnected. Manual.</p>
                            </div>

                            {/* Order Side */}
                            <div className="relative p-8 bg-teal-500/[0.03] border border-teal-500/20 rounded-2xl">
                                <p className="text-teal-400 font-mono text-xs mb-4 tracking-widest">AFTER</p>
                                <div className="flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(45,212,191,0.3)]">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                                            <span className="text-black font-black text-2xl">K</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-white/50 text-sm mt-4 text-center">Unified. Intelligent. Automated.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* SECTION 3: THE TRINITY */}
                {/* ============================================ */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">THE SOLUTION</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    One Unified{' '}
                                </span>
                                <span className="text-teal-400">Command Center</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* CONNECT */}
                            <div className="group relative p-8 rounded-2xl bg-teal-500/[0.05] border border-teal-500/20 hover:border-teal-500/40 transition-all hover:shadow-[0_0_60px_-15px_rgba(45,212,191,0.5)]">
                                <Zap className="w-12 h-12 text-teal-400 mb-6" />
                                <h3 className="text-2xl font-black text-teal-400 mb-2">CONNECT</h3>
                                <p className="text-white/40 text-sm mb-6">Marketing & Sales</p>

                                <ul className="space-y-3">
                                    {[
                                        { icon: MessageSquare, text: 'WhatsApp CRM' },
                                        { icon: Activity, text: 'Speed-to-Lead Alerts' },
                                        { icon: Calendar, text: 'Smart Booking Wizard' },
                                        { icon: Bot, text: 'Auto-Qualification AI' },
                                        { icon: RefreshCw, text: 'Lead Resurrection' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* PRACTICE */}
                            <div className="group relative p-8 rounded-2xl bg-violet-500/[0.05] border border-violet-500/20 hover:border-violet-500/40 transition-all hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.5)]">
                                <Users className="w-12 h-12 text-violet-400 mb-6" />
                                <h3 className="text-2xl font-black text-violet-400 mb-2">PRACTICE</h3>
                                <p className="text-white/40 text-sm mb-6">Clinical Operations</p>

                                <ul className="space-y-3">
                                    {[
                                        { icon: Users, text: 'Soul Record (360° Profile)' },
                                        { icon: Activity, text: 'Sentinel Pulse Analytics' },
                                        { icon: Shield, text: 'Risk Shield Alerts' },
                                        { icon: FileText, text: 'Multimedia Journal' },
                                        { icon: Brain, text: 'Clinical Scribe AI' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-violet-400" />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* GROW */}
                            <div className="group relative p-8 rounded-2xl bg-blue-500/[0.05] border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.5)]">
                                <TrendingUp className="w-12 h-12 text-blue-400 mb-6" />
                                <h3 className="text-2xl font-black text-blue-400 mb-2">GROW</h3>
                                <p className="text-white/40 text-sm mb-6">Business Scale</p>

                                <ul className="space-y-3">
                                    {[
                                        { icon: RefreshCw, text: 'Automated Nurture Loops' },
                                        { icon: CreditCard, text: 'Fintech Payments' },
                                        { icon: Users, text: 'Membership Builder' },
                                        { icon: BarChart3, text: 'Business Analytics HUD' },
                                        { icon: HeartPulse, text: 'Post-Retreat Care' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* SECTION 4: DEEP TECH SPOTLIGHT */}
                {/* ============================================ */}
                <section id="technology" className="py-32 px-6 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-violet-400 font-mono text-sm mb-3 tracking-widest">THE TECHNOLOGY</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    Intelligence That{' '}
                                </span>
                                <span className="text-violet-400">Reasons</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Sentinel Pulse */}
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-violet-500/20 hover:border-violet-500/40 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Sentinel Pulse</h3>
                                        <p className="text-white/40 text-sm">Emotional Intelligence</p>
                                    </div>
                                </div>
                                <p className="text-white/60 mb-6">
                                    "See what they feel, before they say it."
                                </p>
                                {/* Pulse Visualization */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                    <p className="text-xs text-white/40 mb-3">7-Day Emotional Trajectory</p>
                                    <div className="h-20 flex items-end gap-1">
                                        {[50, 40, 55, 45, 60, 75, 85].map((height, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t-sm transition-all"
                                                style={{
                                                    height: `${height}%`,
                                                    background: `linear-gradient(to top, ${height > 70 ? '#10b981' : height > 50 ? '#f59e0b' : '#ef4444'}80, transparent)`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-white/30">
                                        <span>Week Start</span>
                                        <span className="text-emerald-400">↑ Improving</span>
                                    </div>
                                </div>
                            </div>

                            {/* Aletheia */}
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-teal-500/20 hover:border-teal-500/40 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Aletheia</h3>
                                        <p className="text-white/40 text-sm">Clinical Intelligence Engine</p>
                                    </div>
                                </div>
                                <p className="text-white/60 mb-6">
                                    "The AI that reasons, not just transcribes."
                                </p>
                                {/* AI Alert Visualization */}
                                <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Shield className="w-3 h-3 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-amber-400 text-sm font-medium">Risk Alert Detected</p>
                                            <p className="text-white/50 text-xs mt-1">
                                                "Patient mentions discontinuing medication. Cross-referenced with contraindication: Lithium."
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300">MEDICATION</span>
                                                <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-300">CONTRAINDICATION</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* SECTION 5: SECURITY */}
                {/* ============================================ */}
                <section className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-blue-400 font-mono text-sm mb-3 tracking-widest">SECURITY & COMPLIANCE</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    Institutional Grade{' '}
                                </span>
                                <span className="text-blue-400">Privacy</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all group">
                                <Flame className="w-8 h-8 text-orange-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">The Clean Room</h3>
                                <p className="text-white/50 text-sm">Auto-incineration of raw audio after transcription. Zero traces.</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all group">
                                <Lock className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">The Vault</h3>
                                <p className="text-white/50 text-sm">Anonymous clinical datasets. Therapist retains knowledge, patient retains privacy.</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all group">
                                <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">GDPR / HIPAA</h3>
                                <p className="text-white/50 text-sm">Compliance built-in, not bolted on. European & US healthcare standards.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================ */}
                {/* SECTION 6: PRICING */}
                {/* ============================================ */}
                <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-transparent via-teal-500/[0.02] to-transparent">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-teal-400 font-mono text-sm mb-3 tracking-widest">PRICING</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                                <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                    Simple.{' '}
                                </span>
                                <span className="text-teal-400">Transparent.</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Builder */}
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
                                <h3 className="font-bold text-xl mb-2">Builder</h3>
                                <p className="text-white/40 text-sm mb-4">For solopreneurs starting out</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-black font-mono">€0</span>
                                    <span className="text-white/40">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Up to 10 patients', 'Basic CRM', 'Clinical Notes', 'Email Support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-white/30" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <a href="https://app.kuraos.ai/es/register" className="block w-full py-3 text-center bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-all">
                                    Start Free
                                </a>
                            </div>

                            {/* Pro - Highlighted */}
                            <div className="p-8 rounded-2xl bg-teal-500/[0.05] border-2 border-teal-500/40 shadow-[0_0_60px_-20px_rgba(45,212,191,0.5)] relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-500 text-black text-xs font-bold rounded-full">
                                    MOST POPULAR
                                </div>
                                <h3 className="font-bold text-xl mb-2">Pro</h3>
                                <p className="text-white/40 text-sm mb-4">For established practitioners</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-black font-mono text-teal-400">€49</span>
                                    <span className="text-white/40">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Unlimited patients', 'WhatsApp CRM', 'Sentinel Pulse', 'Aletheia AI', 'Stripe Payments'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <a href="https://app.kuraos.ai/es/register" className="block w-full py-3 text-center bg-teal-500 text-black font-bold rounded-lg hover:bg-teal-400 transition-all">
                                    Get Started
                                </a>
                            </div>

                            {/* Center */}
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
                                <h3 className="font-bold text-xl mb-2">Center</h3>
                                <p className="text-white/40 text-sm mb-4">For clinics & retreat centers</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-black font-mono">€149</span>
                                    <span className="text-white/40">/month</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {['Everything in Pro', 'Multi-practitioner', 'Custom automations', 'White-label', 'Priority support'].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-white/30" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <a href="mailto:humbert@kuraos.ai" className="block w-full py-3 text-center bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 transition-all">
                                    Contact Sales
                                </a>
                            </div>
                        </div>

                        {/* Comparison Toggle Button */}
                        <div className="text-center mt-12">
                            <button
                                onClick={() => setShowComparison(!showComparison)}
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white/60 hover:text-white border border-white/10 rounded-full hover:border-white/30 transition-all"
                            >
                                {showComparison ? (
                                    <>
                                        <span>Hide Full Comparison</span>
                                        <ChevronUp className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        <span>View Full Comparison</span>
                                        <ChevronDown className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Comparison Table */}
                        {showComparison && (
                            <div className="mt-8 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-4 bg-white/[0.03] border-b border-white/10">
                                    <div className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Feature</div>
                                    <div className="p-4 text-center text-xs font-bold text-white/40 uppercase tracking-wider border-l border-white/5">
                                        BUILDER<br /><span className="text-white text-sm font-bold">€0</span>
                                    </div>
                                    <div className="p-4 text-center text-xs font-bold text-white/40 uppercase tracking-wider border-l border-white/5">
                                        PRO<br /><span className="text-teal-400 text-sm font-bold">€49</span>
                                    </div>
                                    <div className="p-4 text-center text-xs font-bold text-teal-400 uppercase tracking-wider border-l border-teal-500/20 bg-teal-500/[0.05]">
                                        CENTER<br /><span className="text-white text-sm font-bold">€149</span>
                                    </div>
                                </div>

                                {/* GROUP 1: Clinical */}
                                <div className="grid grid-cols-4 bg-white/[0.03] border-y border-white/10">
                                    <div className="col-span-4 px-4 py-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                                        🗂️ Clinical Management (Soul Record)
                                    </div>
                                </div>
                                <ComparisonRow feature="Patient Limit" builder="10 Patients" pro="Unlimited" center="Unlimited" />
                                <ComparisonRow feature="Clinical Record" builder="Text Notes" pro="Multimedia Timeline" center="+ Audit Trail" isOdd />
                                <ComparisonRow feature="Intake Forms" builder="Basic" pro="White-label" center="+ Conditional Logic" />
                                <ComparisonRow feature="Team Access" builder="Solo" pro="Solo" center="Multi-User (Roles)" isOdd />

                                {/* GROUP 2: AI */}
                                <div className="grid grid-cols-4 bg-white/[0.03] border-y border-white/10">
                                    <div className="col-span-4 px-4 py-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                                        🧠 Artificial Intelligence (Aletheia)
                                    </div>
                                </div>
                                <ComparisonRow feature="Audio Transcription" builder="Manual" pro="100 min/mo (Whisper)" center="Unlimited" />
                                <ComparisonRow feature="Sentiment Analysis" builder="-" pro="Post-Session" center="Real-Time" isOdd />
                                <ComparisonRow feature="Risk Shield™" builder="-" pro="Visual Alerts" center="Auto-Block" />
                                <ComparisonRow feature="Drug Detection" builder="-" pro="Basic Scan" center="Full Interactions" isOdd />
                                <ComparisonRow feature="Crisis Patterns" builder="-" pro="Trends" center="Suicide/Mania Alert" />

                                {/* GROUP 3: Operations */}
                                <div className="grid grid-cols-4 bg-white/[0.03] border-y border-white/10">
                                    <div className="col-span-4 px-4 py-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                                        🎟️ Operations (Box Office)
                                    </div>
                                </div>
                                <ComparisonRow feature="Booking Engine" builder="Email/Manual" pro="Google Calendar Sync" center="Multi-Room / Multi-Staff" isOdd />
                                <ComparisonRow feature="Payment Gateway" builder="-" pro="Stripe Checkout" center="Stripe Connect (Split)" />
                                <ComparisonRow feature="Automation (Playbooks)" builder="-" pro="3 Active" center="Unlimited" isOdd />
                                <ComparisonRow feature="WhatsApp Integration" builder="-" pro="Sync" center="24/7 Monitoring" />

                                {/* GROUP 4: Institutional */}
                                <div className="grid grid-cols-4 bg-white/[0.03] border-y border-white/10">
                                    <div className="col-span-4 px-4 py-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                        🔒 Institutional
                                    </div>
                                </div>
                                <ComparisonRow feature="Data Export" builder="CSV" pro="PDF Clinical" center="JSON / API Access" isOdd />
                                <ComparisonRow feature="BAA Agreement (HIPAA)" builder="❌" pro="❌" center="✅ Included" />
                                <ComparisonRow feature="Support" builder="Community" pro="Email 24h" center="WhatsApp Priority" isOdd />
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* ============================================ */}
            {/* FOOTER */}
            {/* ============================================ */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-3xl md:text-5xl font-black mb-8">
                        <span className="text-white">"HELP THEM HEAL.</span>{' '}
                        <span className="text-teal-400">WE HANDLE THE REST."</span>
                    </p>

                    <a
                        href="https://app.kuraos.ai/es/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-black font-bold rounded-xl hover:bg-teal-400 transition-all shadow-[0_0_40px_rgba(45,212,191,0.4)] mb-12"
                    >
                        Start Your Free Trial
                        <ArrowRight className="w-5 h-5" />
                    </a>

                    <div className="flex items-center justify-center gap-8 text-white/30 text-sm mb-8">
                        <a href="/terms" className="hover:text-white/60">Terms</a>
                        <a href="/privacy" className="hover:text-white/60">Privacy</a>
                        <a href="mailto:humbert@kuraos.ai" className="hover:text-white/60">Contact</a>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-white/20 text-sm">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                            <span className="text-black font-black text-xs">K</span>
                        </div>
                        <span>KURA OS © 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Helper component for comparison table rows
function ComparisonRow({
    feature,
    builder,
    pro,
    center,
    isOdd = false
}: {
    feature: string;
    builder: string;
    pro: string;
    center: string;
    isOdd?: boolean;
}) {
    const renderCell = (value: string) => {
        if (value === '-') return <span className="text-white/20">—</span>;
        if (value === '❌') return <span className="text-white/30">❌</span>;
        if (value.startsWith('✅')) return <span className="text-emerald-400 font-medium">{value}</span>;
        return <span>{value}</span>;
    };

    return (
        <div className={`grid grid-cols-4 text-sm ${isOdd ? 'bg-white/[0.01]' : ''}`}>
            <div className="p-3 text-white/60 font-medium border-r border-white/5">{feature}</div>
            <div className="p-3 text-center text-white/40 border-r border-white/5">{renderCell(builder)}</div>
            <div className="p-3 text-center text-white/50 border-r border-white/5">{renderCell(pro)}</div>
            <div className="p-3 text-center text-white/70 bg-teal-500/[0.03]">{renderCell(center)}</div>
        </div>
    );
}
