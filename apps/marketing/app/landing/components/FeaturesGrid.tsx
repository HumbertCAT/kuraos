import React from 'react';
import { Mic, Fingerprint, Zap, ClipboardCheck } from 'lucide-react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <div className="group relative p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 hover:bg-slate-900/70">
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <span className="text-emerald-400">{icon}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);

const FeaturesGrid: React.FC = () => {
    const features = [
        {
            icon: <Mic size={24} />,
            title: 'Transcripción Clínica (Whisper)',
            description: 'Tus pacientes envían audios de 10 minutos. Therapist OS los transcribe, extrae el sentimiento y resume los puntos clave en el historial clínico.',
        },
        {
            icon: <Fingerprint size={24} />,
            title: 'Expediente Unificado',
            description: 'Más allá de un CRM. Centraliza historial médico, evolución psicológica y datos espirituales en un perfil vivo que evoluciona con cada sesión.',
        },
        {
            icon: <Zap size={24} />,
            title: 'Piloto Automático',
            description: "Instala flujos de trabajo como Apps. Desde 'Cobrador Automático' para pagos fallidos hasta secuencias de 'Fidelización Post-Retiro'.",
        },
        {
            icon: <ClipboardCheck size={24} />,
            title: 'Admisión Inteligente',
            description: "Formularios que saben decir 'No'. Configura niveles de riesgo (High/Critical) para filtrar pacientes automáticamente antes de que reserven.",
        },
    ];

    return (
        <section id="capabilities" className="py-20 bg-slate-950 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-mono uppercase tracking-widest mb-4 border border-emerald-500/20">
                        🛠️ Potencia Operativa
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        No solo seguridad.<br />
                        <span className="text-emerald-400">Un sistema operativo completo.</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Además del escudo clínico de AletheIA, te llevas un CRM especializado, automatizaciones y herramientas diseñadas para terapeutas que necesitan escalar.
                    </p>
                </div>

                {/* Bento Grid 2x2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>

                {/* Bottom CTA hint */}
                <div className="text-center mt-12">
                    <p className="text-gray-500 text-sm">
                        ↓ Descubre los planes que incluyen todas estas capacidades
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
