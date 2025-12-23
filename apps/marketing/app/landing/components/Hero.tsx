import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck, Activity, FileText } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand-accent/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left Column: Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-medium mb-6 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
              </span>
              Presentamos el Motor AletheIA™
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              <span className="whitespace-nowrap">Tu Medicina es <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Sagrada</span></span><br />
              Tu Seguridad es <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-emerald-300">Clínica</span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              El primer Sistema Operativo diseñado para la realidad clínica de la terapia psicodélica.
              Gestiona preparación, dosificación e integración mientras <span className="text-brand-accent font-semibold">AletheIA</span> detecta
              los riesgos invisibles que el screening manual pasa por alto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="https://app.kuraos.ai/es/register" className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-brand-dark bg-brand-accent rounded-lg hover:bg-brand-glow transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Activity className="w-5 h-5 mr-2" />
                Empezar Gratis
              </a>
              <a href="/pitch" className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
                <FileText className="w-5 h-5 mr-2" />
                Ver Pitch
              </a>
            </div>
          </div>

          {/* Right Column: The "Hero Shot" - Risk Shield UI */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-full">
            {/* The main card container */}
            <div className="glass-panel rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden neon-glow transform transition-transform hover:scale-[1.01] duration-500">

              {/* Header of the fake UI */}
              <div className="flex items-center justify-between mb-6 border-b border-gray-700/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold">
                    SJ
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Sara Jiménez</h3>
                    <p className="text-xs text-gray-400">Protocolo: Psilocibina para Depresión</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                  En Preparación
                </span>
              </div>

              {/* The Alert Box - The key differentiator */}
              <div className="bg-brand-warning/10 border border-brand-warning/30 rounded-lg p-4 mb-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-warning"></div>
                <div className="flex gap-3">
                  <div className="mt-1">
                    <AlertTriangle className="text-brand-warning w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-brand-warning font-bold text-sm mb-1">Interacción Latente Detectada</h4>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      El paciente reportó uso diario de <span className="text-white font-medium">"Hierba de San Juan"</span> en el registro de suplementos.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-brand-warning/20 rounded text-brand-warning text-xs font-bold uppercase tracking-wider">
                      Riesgo: Síndrome Serotoninérgico Leve
                    </div>
                    <p className="text-gray-400 text-xs mt-2 italic">
                      Recomendación: Periodo de lavado de 7 días.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full py-2 bg-brand-dark/50 border border-brand-accent/50 text-brand-accent hover:bg-brand-accent hover:text-brand-dark transition-colors rounded text-sm font-medium flex items-center justify-center gap-2">
                  <ShieldCheck size={16} />
                  Notificar a Directora Médica
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Activity size={12} className="animate-pulse text-brand-accent" />
                  Análisis generado por AletheIA™ en 0.4s
                </div>
              </div>

            </div>

            {/* Decorative background elements behind the card */}
            <div className="absolute -z-10 -top-6 -right-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -z-10 -bottom-8 -left-8 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;