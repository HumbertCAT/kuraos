import React from 'react';
import { Code2, Cpu } from 'lucide-react';

const TechSection: React.FC = () => {
  return (
    <section id="tech" className="py-20 bg-slate-950 border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-accent/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left: Explanation */}
        <div className="lg:w-1/2">
          <div className="flex items-center gap-2 text-brand-accent mb-4">
            <Cpu size={20} />
            <span className="text-sm font-mono uppercase tracking-widest">Motor AletheIA v2.1</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            IA que razona, <br/>no solo transcribe.
          </h2>
          <p className="text-gray-400 mb-6 text-lg">
            Entrenada con modelos clínicos avanzados para entender matices psicológicos profundos. 
            AletheIA no busca palabras clave; entiende patrones de trauma, momentos de ruptura y coherencia narrativa en los diarios de tus pacientes.
          </p>
          <div className="border-l-2 border-brand-accent pl-6">
            <blockquote className="text-gray-300 italic">
              "Detectó una contraindicación que tres terapeutas humanos pasaron por alto debido a la jerga que usó el paciente."
            </blockquote>
            <cite className="block mt-2 text-sm text-gray-500 font-medium not-italic">- Dr. A. Sol, Directora Clínica</cite>
          </div>
        </div>

        {/* Right: Code Block Visualizer */}
        <div className="lg:w-1/2 w-full">
          <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-gray-800 shadow-2xl font-mono text-sm relative">
            {/* Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="ml-auto text-xs text-gray-500 flex items-center gap-2">
                <Code2 size={12} />
                aletheia_core.ts
              </div>
            </div>
            
            {/* Code Content */}
            <div className="p-6 overflow-x-auto">
              <pre className="text-gray-300 leading-6">
                <code>
                  <span className="text-purple-400">const</span> <span className="text-blue-400">analysis</span> = <span className="text-purple-400">await</span> gemini.reasoning({'{'}
{'\n'}  patient_id: <span className="text-green-400">"idx_99"</span>,
{'\n'}  context: <span className="text-green-400">"integration_journal_week_4"</span>,
{'\n'}  parameters: {'{'}
{'\n'}    detect_dissociation: <span className="text-orange-400">true</span>,
{'\n'}    pharmacology_scan: <span className="text-orange-400">true</span>
{'\n'}  {'}'}
{'\n'}{'}'});
{'\n'}
{'\n'}<span className="text-gray-500">// Output</span>
{'\n'}<span className="text-purple-400">if</span> (analysis.riskScore {'>'} <span className="text-orange-400">0.8</span>) {'{'}
{'\n'}  <span className="text-gray-500">// Trigger Risk Shield Protocol automatically</span>
{'\n'}  <span className="text-purple-400">await</span> riskShield.<span className="text-yellow-300">activateBlock</span>({'{'}
{'\n'}    reason: analysis.primaryWarning,
{'\n'}    level: <span className="text-green-400">"CRITICAL"</span>
{'\n'}  {'}'});
{'\n'}{'}'}
                </code>
              </pre>
            </div>
            
            {/* Glowing effect at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50"></div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TechSection;