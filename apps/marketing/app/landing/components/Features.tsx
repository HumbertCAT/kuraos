import React from 'react';
import { Pill, MessageSquareWarning, ShieldAlert } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Pill className="w-8 h-8 text-purple-400" />,
      title: "Farmacología Sutil",
      description: "No solo miramos fármacos psiquiátricos. AletheIA escanea suplementos, nootrópicos y enzimas metabólicas que afectan la degradación de triptaminas."
    },
    {
      icon: <MessageSquareWarning className="w-8 h-8 text-blue-400" />,
      title: "Detección Lingüística",
      description: "Nuestro motor analiza respuestas abiertas buscando patrones de disociación o sintaxis maniaca. Identificamos riesgos familiares no diagnosticados."
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-brand-accent" />,
      title: "Protocolo Risk Shield™",
      description: "Si se detecta un Riesgo Crítico, el sistema bloquea automáticamente el pago y la agenda hasta que la Dirección Médica firme una exención."
    }
  ];

  return (
    <section id="features" className="py-20 bg-brand-dark relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Más allá de lo obvio.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            La competencia busca antidepresivos y antecedentes de esquizofrenia. Eso es lo básico.
            <span className="text-brand-accent font-medium"> TherapyOS</span> profundiza para encontrar los matices que causan eventos adversos y problemas legales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-brand-accent/30 transition-all duration-300 group">
              <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;