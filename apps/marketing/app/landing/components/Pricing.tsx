'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

// Helper component for table rows
function ComparisonRow({
  feature,
  builder,
  pro,
  center,
  isOdd
}: {
  feature: string;
  builder: string;
  pro: string;
  center: string;
  isOdd?: boolean;
}) {
  const renderCell = (value: string) => {
    if (value === '-') return <span className="text-slate-600">—</span>;
    if (value === '❌') return <X className="w-4 h-4 text-slate-600 mx-auto" />;
    if (value.startsWith('✅')) return <span className="text-emerald-400 font-medium">{value}</span>;
    return <span>{value}</span>;
  };

  return (
    <div className={`grid grid-cols-4 text-sm ${isOdd ? 'bg-slate-900/50' : 'bg-slate-950/50'}`}>
      <div className="p-3 text-slate-300 font-medium border-r border-slate-800">{feature}</div>
      <div className="p-3 text-center text-slate-500 border-r border-slate-800">{renderCell(builder)}</div>
      <div className="p-3 text-center text-slate-400 border-r border-slate-800">{renderCell(pro)}</div>
      <div className="p-3 text-center text-emerald-300 bg-emerald-500/5">{renderCell(center)}</div>
    </div>
  );
}

// Section header for groups
function SectionHeader({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="grid grid-cols-4 bg-slate-800/60 border-y border-slate-700">
      <div className="col-span-4 px-3 py-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
        {emoji} {title}
      </div>
    </div>
  );
}

const Pricing: React.FC = () => {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Planes diseñados para crecer contigo
          </h2>
          <p className="text-gray-400">
            Desde facilitadores independientes hasta centros de retiro clínico.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Builder Plan */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-2">Builder</h3>
            <p className="text-gray-400 text-sm mb-6">Para Facilitadores Independientes</p>
            <div className="text-4xl font-bold text-white mb-8">
              Gratis
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Hasta 3 pacientes
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Gestión básica de journeys
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Formularios personalizados
              </li>
              <li className="flex items-center text-gray-500 text-sm">
                <X className="w-4 h-4 mr-3" /> Sin análisis IA
              </li>
            </ul>
            <Link href="/register" className="w-full block text-center py-3 rounded-lg border border-gray-600 text-white font-medium hover:bg-white/10 transition-colors">
              Empezar Gratis
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white/5 border border-brand-accent/30 rounded-2xl p-8 relative transform lg:-translate-y-4 shadow-2xl shadow-brand-accent/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Popular
            </div>
            <h3 className="text-xl font-bold text-white mb-2">PRO</h3>
            <p className="text-gray-400 text-sm mb-6">Para Terapeutas Profesionales</p>
            <div className="text-4xl font-bold text-white mb-1">
              49€<span className="text-lg font-normal text-gray-500">/mes</span>
            </div>
            <div className="text-xs text-brand-accent mb-8">Facturado anualmente</div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Hasta 50 pacientes
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Detección AletheIA (Alertas)
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Calendario y reservas
              </li>
              <li className="flex items-center text-gray-500 text-sm">
                <X className="w-4 h-4 mr-3" /> Protocolo Risk Shield™
              </li>
            </ul>
            <Link href="/register" className="w-full block text-center py-3 rounded-lg bg-brand-accent text-brand-dark font-bold hover:bg-brand-glow transition-colors">
              Comenzar Prueba
            </Link>
          </div>

          {/* Center Plan - The Upsell */}
          <div className="bg-[#0f1d18] border border-emerald-900/50 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-2">CENTER</h3>
            <p className="text-gray-400 text-sm mb-6">Para Clínicas y Centros de Retiro</p>
            <div className="text-4xl font-bold text-white mb-8">
              149€<span className="text-lg font-normal text-gray-500">/mes</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Hasta 150 pacientes
              </li>
              <li className="flex items-center text-white font-semibold text-sm">
                <div className="w-4 h-4 rounded bg-brand-accent flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-brand-dark" />
                </div>
                Risk Shield™ (Auto-Bloqueo)
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> Multi-Usuario y roles
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Check className="w-4 h-4 text-brand-accent mr-3" /> WhatsApp Sync
              </li>
            </ul>
            <a href="mailto:humbert@therapistos.com" className="w-full block text-center py-3 rounded-lg bg-white text-brand-dark font-bold hover:bg-gray-100 transition-colors">
              Contactar Ventas
            </a>
          </div>

        </div>

        {/* Comparison Toggle Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-300 hover:text-white border border-slate-700 rounded-full hover:border-slate-500 transition-all"
          >
            {showComparison ? (
              <>
                <span>Ocultar Comparativa Completa</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Ver Comparativa Completa</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Comparison Table (Accordion) */}
        {showComparison && (
          <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">

            {/* Table Header */}
            <div className="grid grid-cols-4 bg-slate-800 border-b border-slate-700 sticky top-0">
              <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Funcionalidad</div>
              <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-l border-slate-700">
                BUILDER<br /><span className="text-white text-sm font-bold">0€</span>
              </div>
              <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-l border-slate-700">
                PRO<br /><span className="text-white text-sm font-bold">49€</span>
              </div>
              <div className="p-4 text-center text-xs font-bold text-emerald-400 uppercase tracking-wider border-l border-emerald-500/30 bg-emerald-500/10">
                CENTER<br /><span className="text-white text-sm font-bold">149€</span>
              </div>
            </div>

            {/* GROUP 1: GESTIÓN CLÍNICA (SOUL RECORD) */}
            <SectionHeader emoji="🗂️" title="Gestión Clínica (Soul Record)" />
            <ComparisonRow feature="Límite de Pacientes" builder="3 Pacientes" pro="50 Pacientes" center="150 Pacientes" isOdd />
            <ComparisonRow feature="Expediente Clínico" builder="Notas de Texto" pro="Timeline Multimedia" center="Auditoría de Cambios" />
            <ComparisonRow feature="Formularios Intake" builder="Ilimitados" pro="Marca Blanca" center="Lógica Condicional" isOdd />
            <ComparisonRow feature="Acceso Equipo" builder="Unipersonal" pro="Unipersonal" center="Multi-Usuario (Roles)" />

            {/* GROUP 2: INTELIGENCIA ARTIFICIAL (ALETHEIA) */}
            <SectionHeader emoji="🧠" title="Inteligencia Artificial (AletheIA)" />
            <ComparisonRow feature="Transcripción Audio" builder="Manual" pro="100 min/mes (Whisper)" center="Ilimitada" isOdd />
            <ComparisonRow feature="Análisis Sentimiento" builder="-" pro="Diario (Post-Sesión)" center="Tiempo Real (Live)" />
            <ComparisonRow feature="Risk Shield™" builder="-" pro="Alertas Visuales" center="Bloqueo Automático" isOdd />
            <ComparisonRow feature="Detección Farmacológica" builder="-" pro="Escaneo Básico" center="Interacciones Completas" />
            <ComparisonRow feature="Patrones de Crisis" builder="-" pro="Tendencias" center="Alerta Suicidio/Manía" isOdd />

            {/* GROUP 3: OPERACIONES (BOX OFFICE) */}
            <SectionHeader emoji="🎟️" title="Operaciones (Box Office)" />
            <ComparisonRow feature="Motor de Reservas" builder="Email/Manual" pro="Google Calendar Sync" center="Multi-Sala / Multi-Staff" isOdd />
            <ComparisonRow feature="Pasarela de Pagos" builder="-" pro="Stripe Checkout" center="Stripe Connect (Split)" />
            <ComparisonRow feature="Automatización (Playbooks)" builder="-" pro="3 Activos" center="Ilimitados" isOdd />
            <ComparisonRow feature="Integración WhatsApp" builder="-" pro="Sincronización" center="Monitorización 24/7" />

            {/* GROUP 4: INSTITUCIONAL */}
            <SectionHeader emoji="🔒" title="Institucional" />
            <ComparisonRow feature="Exportación Datos" builder="CSV Simple" pro="PDF Clínico" center="JSON / API Access" isOdd />
            <ComparisonRow feature="Acuerdo BAA (HIPAA)" builder="❌" pro="❌" center="✅ Incluido" />
            <ComparisonRow feature="Soporte Técnico" builder="Comunidad" pro="Email 24h" center="WhatsApp Prioritario" isOdd />

          </div>
        )}
      </div>
    </section>
  );
};

export default Pricing;