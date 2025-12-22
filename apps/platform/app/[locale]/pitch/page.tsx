"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowRight,
    ShieldAlert,
    BrainCircuit,
    ChevronRight,
    ChevronLeft,
    Atom,
    FileSpreadsheet,
    MessageCircle,
    AlertTriangle,
    Mic,
    Eye,
    ShieldCheck,
    Zap,
    Building2,
    CreditCard,
    Calendar,
    CheckCircle,
    Smartphone,
    HeartPulse,
    Mail
} from "lucide-react";

// --- HELPER COMPONENT for Dense Matrix ---
function TableRow({ feature, builder, pro, center, centerHighlight = false }: {
    feature: string;
    builder: string;
    pro: string;
    center: string;
    centerHighlight?: boolean
}) {
    return (
        <div className="grid grid-cols-4 border-t border-slate-800 text-xs">
            <div className="p-2 text-slate-300 font-medium">{feature}</div>
            <div className="p-2 text-center text-slate-500 border-l border-slate-800">{builder}</div>
            <div className="p-2 text-center text-slate-400 border-l border-slate-800">{pro}</div>
            <div className={`p-2 text-center border-l border-emerald-500/30 ${centerHighlight ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-emerald-300'}`}>
                {center}
            </div>
        </div>
    );
}

// --- SLIDE DATA (v2.0 - Investor Ready) ---
const slides = [
    // SLIDE 1: COVER (La Portada - La Tesis)
    {
        id: "cover",
        content: (
            <div className="text-center space-y-8">
                <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl mb-4 ring-1 ring-emerald-500/30">
                    <Atom className="w-20 h-20 text-emerald-400" />
                </div>
                <h1 className="text-7xl font-bold text-white tracking-tight">
                    Therapist<span className="text-emerald-400">OS</span>
                </h1>
                <p className="text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
                    "La Infraestructura de Cumplimiento para el Renacimiento Psicodélico."
                </p>
                <div className="pt-12 flex items-center justify-center gap-4 text-sm uppercase tracking-widest font-mono">
                    <span className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400">Vertical SaaS</span>
                    <span className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400">AI Risk Management</span>
                    <span className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-400">FinTech</span>
                </div>
            </div>
        )
    },
    // SLIDE 2: THE PROBLEM (La "Brecha de Seguridad")
    {
        id: "problem",
        content: (
            <div className="w-full max-w-6xl mx-auto">
                <h2 className="text-5xl font-bold text-center text-white mb-4">
                    La terapia escala. <span className="text-rose-400">La seguridad no.</span>
                </h2>
                <p className="text-center text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
                    La brecha entre innovación clínica y gestión operativa crea riesgo sistémico.
                </p>

                <div className="grid grid-cols-2 gap-8">
                    {/* Left: El Caos */}
                    <div className="p-8 bg-slate-900/50 border border-slate-700 rounded-2xl">
                        <h3 className="text-lg font-semibold text-slate-300 mb-6 uppercase tracking-wider">Gestión Manual</h3>
                        <div className="space-y-4">
                            {[
                                { icon: <FileSpreadsheet className="w-5 h-5" />, text: "Hojas de Excel dispersas" },
                                { icon: <MessageCircle className="w-5 h-5" />, text: "WhatsApps sin cifrar" },
                                { icon: <Calendar className="w-5 h-5" />, text: "Calendarios manuales" },
                                { icon: <CreditCard className="w-5 h-5" />, text: "Cobros informales" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg text-slate-400">
                                    <span className="text-slate-500">{item.icon}</span>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: El Riesgo */}
                    <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                        <div className="flex items-center justify-center mb-6">
                            <AlertTriangle className="w-16 h-16 text-rose-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-rose-300 mb-6 uppercase tracking-wider text-center">Riesgo Crítico</h3>
                        <div className="space-y-4 text-rose-200">
                            <p className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                                El <strong>85%</strong> de los facilitadores operan en zonas grises legales.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                                Los screenings en papel no detectan contraindicaciones farmacológicas.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                                Resultado: <strong>Eventos adversos prevenibles</strong> y responsabilidad legal masiva.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    // SLIDE 3: THE SOLUTION (El Sistema Operativo)
    {
        id: "solution",
        content: (
            <div className="w-full max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-white mb-12">
                    Un sistema de registro único que <span className="text-emerald-400">protege al paciente</span> y <span className="text-emerald-400">cobra por el terapeuta.</span>
                </h2>

                {/* Dashboard Mockup with Labels */}
                <div className="relative bg-slate-900/80 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    {/* Simulated Dashboard */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Patient Card - Red (Risk) */}
                        <div className="relative p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                            <div className="absolute -top-3 -right-3 px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">
                                RIESGO ALTO
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-500/30 flex items-center justify-center">
                                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Javier Roca</p>
                                    <p className="text-rose-300 text-sm">Bloqueado por AletheIA</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">Contraindicación IMAO detectada</p>
                            {/* Floating Label */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-full">
                                    <span className="text-rose-300 text-sm font-medium">→ Gestión de Riesgo Clínico (AletheIA)</span>
                                </div>
                            </div>
                        </div>

                        {/* Patient Card - Yellow (Recovery) */}
                        <div className="relative p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <div className="absolute -top-3 -right-3 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                                PAGO PENDIENTE
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Sofía Blanco</p>
                                    <p className="text-amber-300 text-sm">Recordatorio enviado</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">€450 pendiente - 48h</p>
                            {/* Floating Label */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full">
                                    <span className="text-amber-300 text-sm font-medium">→ Recuperación de Ingresos</span>
                                </div>
                            </div>
                        </div>

                        {/* Automations Card */}
                        <div className="relative p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <div className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                AUTOMÁTICO
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Playbook Activo</p>
                                    <p className="text-emerald-300 text-sm">Onboarding Retiro</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">32 pacientes procesados</p>
                            {/* Floating Label */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                    <span className="text-emerald-300 text-sm font-medium">→ Eficiencia Operativa</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    // SLIDE 4: THE TECHNOLOGY (El "Moat" Defensivo)
    {
        id: "technology",
        content: (
            <div className="w-full max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Motor AletheIA™: <span className="text-emerald-400">Seguridad en Tiempo Real.</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        No somos un wrapper de ChatGPT. Somos un <strong className="text-white">motor de inferencia clínica</strong>.
                    </p>
                </div>

                {/* Code Block Visual */}
                <div className="rounded-2xl overflow-hidden bg-[#0d1117] border border-slate-700 shadow-2xl mb-12">
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-slate-700">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                        <span className="ml-4 text-slate-500 text-sm font-mono">aletheia_core.ts</span>
                    </div>
                    <div className="p-6 font-mono text-sm leading-7 overflow-x-auto">
                        <pre className="text-slate-300">
                            {`const analysis = await aletheia.analyze({
  patient_id: "px_847291",
  sources: ["intake_form", "whatsapp_audio", "medical_history"],
  parameters: {
    detect_contraindications: true,
    pharmacology_scan: true,
    suicide_ideation_check: true
  }
});

if (analysis.riskScore > 0.8) {
  await riskShield.activateBlock({
    reason: analysis.primaryWarning,
    level: "CRITICAL",
    actions: ["block_calendar", "notify_therapist", "freeze_payments"]
  });
}`}
                        </pre>
                    </div>
                </div>

                {/* 3 Feature Columns */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl text-center">
                        <Mic className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Ingesta Multimodal</h3>
                        <p className="text-slate-400 text-sm">WhatsApp Audio (Whisper) + Texto + Historial Médico.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl text-center">
                        <Eye className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Análisis de Patrones</h3>
                        <p className="text-slate-400 text-sm">Detección de ideación suicida, manía y disociación.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl text-center">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Protocolo Risk Shield™</h3>
                        <p className="text-slate-400 text-sm">Bloqueo automático de agenda y pagos ante riesgo crítico.</p>
                    </div>
                </div>
            </div>
        )
    },
    // SLIDE 5: BUSINESS MODEL (Dense Matrix)
    {
        id: "business",
        content: (
            <div className="w-full max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                    Modelo de Negocio SaaS + FinTech
                </h2>

                {/* Dense Comparison Matrix */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-4 bg-slate-800/80 border-b border-slate-700">
                        <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Feature</div>
                        <div className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-700">Builder<br /><span className="text-white text-sm font-bold">Gratis</span></div>
                        <div className="p-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider border-l border-slate-700">Pro<br /><span className="text-white text-sm font-bold">49€/mes</span></div>
                        <div className="p-3 text-center text-xs font-semibold text-emerald-400 uppercase tracking-wider border-l border-emerald-500/30 bg-emerald-500/10">Center<br /><span className="text-white text-sm font-bold">149€/mes</span></div>
                    </div>

                    {/* SOUL RECORD Section */}
                    <div className="border-b border-slate-700">
                        <div className="grid grid-cols-4 bg-slate-800/40">
                            <div className="col-span-4 px-3 py-2 text-xs font-bold text-purple-400 uppercase tracking-wider">🗂️ Soul Record (CRM)</div>
                        </div>
                        <TableRow feature="Pacientes" builder="3" pro="50" center="150" />
                        <TableRow feature="Historial" builder="Básico" pro="Timeline Multimedia" center="Auditoría Completa" />
                        <TableRow feature="Formularios" builder="Ilimitados" pro="Marca Blanca" center="Lógica Condicional" />
                        <TableRow feature="Usuarios" builder="1 (Solo tú)" pro="1 (Solo tú)" center="Multi-Rol (Staff)" />
                    </div>

                    {/* ALETHEIA Section */}
                    <div className="border-b border-slate-700">
                        <div className="grid grid-cols-4 bg-slate-800/40">
                            <div className="col-span-4 px-3 py-2 text-xs font-bold text-blue-400 uppercase tracking-wider">🧠 AletheIA (Inteligencia)</div>
                        </div>
                        <TableRow feature="Transcripción (Whisper)" builder="Manual" pro="100 min/mes" center="Ilimitada" />
                        <TableRow feature="Sentimiento" builder="—" pro="Diario" center="Tiempo Real" />
                        <TableRow feature="Risk Shield™" builder="—" pro="Solo Alertas" center="Auto-Bloqueo" centerHighlight />
                        <TableRow feature="Farmacología" builder="—" pro="Escaneo Básico" center="Cruce Completo" />
                    </div>

                    {/* BOX OFFICE Section */}
                    <div className="border-b border-slate-700">
                        <div className="grid grid-cols-4 bg-slate-800/40">
                            <div className="col-span-4 px-3 py-2 text-xs font-bold text-amber-400 uppercase tracking-wider">🎟️ Box Office (Operaciones)</div>
                        </div>
                        <TableRow feature="Reservas" builder="Manual" pro="Google Cal Sync" center="Multi-Sala" />
                        <TableRow feature="Pagos" builder="—" pro="Cobros Simples" center="Marketplace (Split)" centerHighlight />
                        <TableRow feature="Automatización" builder="—" pro="3 Playbooks" center="Ilimitados" />
                        <TableRow feature="WhatsApp" builder="—" pro="Sync Básico" center="Monitorización 24/7" centerHighlight />
                    </div>

                    {/* GOVERNANCE Section */}
                    <div>
                        <div className="grid grid-cols-4 bg-slate-800/40">
                            <div className="col-span-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">🔒 Governance</div>
                        </div>
                        <TableRow feature="Exportación" builder="CSV" pro="PDF Clínico" center="JSON/API" />
                        <TableRow feature="HIPAA/BAA" builder="❌" pro="❌" center="✅ Firmado" centerHighlight />
                    </div>
                </div>

                {/* Unit Economics Footer */}
                <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700 rounded-xl flex justify-center gap-12 text-xs">
                    <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">&lt; $0.50</div>
                        <p className="text-slate-400">Coste AI/paciente</p>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">1%</div>
                        <p className="text-slate-400">Take Rate Pagos</p>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">&gt; 85%</div>
                        <p className="text-slate-400">Margen Bruto</p>
                    </div>
                </div>
            </div>
        )
    },
    // SLIDE 6: TRACTION & ROADMAP
    {
        id: "traction",
        content: (
            <div className="w-full max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold text-white text-center mb-12">
                    Tracción & Roadmap
                </h2>

                {/* Timeline */}
                <div className="relative mb-12">
                    <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700 rounded-full" />
                    <div className="grid grid-cols-3 gap-8 relative">
                        {/* Q4 2024 - Completed */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-emerald-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-emerald-500/20">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-full mb-2">Q4 2024</span>
                            <h3 className="text-white font-bold mb-2">Beta Privada</h3>
                            <p className="text-slate-400 text-sm">Core OS + AletheIA v1</p>
                        </div>

                        {/* Q1 2025 - Current */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-amber-500/20 animate-pulse">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-semibold rounded-full mb-2">Q1 2025</span>
                            <h3 className="text-white font-bold mb-2">Lanzamiento v1.0</h3>
                            <p className="text-slate-400 text-sm">Integración WhatsApp completa</p>
                        </div>

                        {/* Q3 2025 - Future */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-600/20">
                                <Smartphone className="w-8 h-8 text-slate-400" />
                            </div>
                            <span className="inline-block px-3 py-1 bg-slate-700/50 text-slate-400 text-sm font-semibold rounded-full mb-2">Q3 2025</span>
                            <h3 className="text-white font-bold mb-2">Expansión</h3>
                            <p className="text-slate-400 text-sm">Mobile App + Seguros Médicos</p>
                        </div>
                    </div>
                </div>

                {/* Playbook Preview */}
                <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Zap className="w-6 h-6 text-emerald-400" />
                            <span className="text-white font-semibold">Playbooks de Automatización</span>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">Escalabilidad</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                        </div>
                        <span className="text-slate-400 text-sm">Onboarding automatizado para retiros de 50+ personas</span>
                    </div>
                </div>
            </div>
        )
    },
    // SLIDE 7: THE ASK (Cierre)
    {
        id: "ask",
        content: (
            <div className="text-center space-y-10 max-w-3xl mx-auto">
                <h2 className="text-5xl font-bold text-white leading-tight">
                    Únete a la evolución de la <span className="text-emerald-400">Salud Mental.</span>
                </h2>

                {/* Founder */}
                <div className="flex items-center justify-center gap-6">
                    <img
                        src="/humbert.jpg"
                        alt="Humbert Torroella"
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/30"
                    />
                    <div className="text-left">
                        <p className="text-white font-semibold text-lg">Humbert Torroella</p>
                        <p className="text-slate-400">Founder & CEO</p>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-all cursor-pointer text-xl shadow-lg shadow-emerald-500/30">
                        Buscando Partners Estratégicos para Seed Round
                        <ArrowRight className="w-6 h-6" />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 pt-8 text-slate-400">
                    <a href="mailto:humbert@therapistos.com" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Mail className="w-5 h-5" />
                        humbert@therapistos.com
                    </a>
                </div>
            </div>
        )
    }
];

// --- MAIN COMPONENT ---

export default function PitchDeck() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToSlide = (index: number) => {
        if (index >= 0 && index < slides.length && !isTransitioning) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentSlide(index);
                setIsTransitioning(false);
            }, 150);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                goToSlide(currentSlide + 1);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToSlide(currentSlide - 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSlide, isTransitioning]);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans selection:bg-emerald-500/30">

            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Slide Content */}
            <div className="relative z-10 w-full h-screen flex flex-col">

                {/* Header */}
                <div className="p-8 flex justify-between items-center opacity-50">
                    <div className="flex items-center gap-2">
                        <Atom className="w-5 h-5 text-emerald-500" />
                        <span className="font-bold tracking-tight">TherapistOS</span>
                    </div>
                    <div className="text-sm font-mono">
                        {currentSlide + 1} / {slides.length}
                    </div>
                </div>

                {/* Slide Body */}
                <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
                    <div
                        className={`w-full max-w-6xl transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            }`}
                    >
                        {slides[currentSlide].content}
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-8 flex justify-between items-center">
                    {/* Slide dots */}
                    <div className="flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-emerald-400 w-6' : 'bg-slate-600 hover:bg-slate-500'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Arrow buttons */}
                    <div className="flex gap-4 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => goToSlide(currentSlide - 1)}
                            className={`p-2 hover:bg-white/10 rounded-full transition-colors ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={currentSlide === 0}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => goToSlide(currentSlide + 1)}
                            className={`p-2 hover:bg-white/10 rounded-full transition-colors ${currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            disabled={currentSlide === slides.length - 1}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
