'use client';

import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import HelpChatBot from '@/components/help/HelpChatBot';

const CHAPTERS = [
    { slug: 'primeros-pasos', title: 'Primeros Pasos', icon: '🚀', description: 'Configura tu cuenta en 5 minutos' },
    { slug: 'pacientes', title: 'Pacientes', icon: '👥', description: 'Soul Record y perfiles de pacientes' },
    { slug: 'diario-clinico', title: 'Diario Clínico', icon: '📝', description: 'Notas, audio y análisis IA' },
    { slug: 'formularios', title: 'Formularios', icon: '📋', description: 'Crea y envía formularios' },
    { slug: 'reservas', title: 'Reservas', icon: '📅', description: 'Calendario y servicios' },
    { slug: 'automatizaciones', title: 'Automatizaciones', icon: '⚡', description: 'Playbooks y reglas' },
    { slug: 'whatsapp', title: 'WhatsApp & AletheIA', icon: '💬', description: 'Monitorización y alertas' },
    { slug: 'facturacion', title: 'Facturación', icon: '💳', description: 'Planes y créditos' },
];

export default function HelpPage() {
    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Documentation Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Centro de Ayuda</h2>
                        <p className="text-foreground/60 text-sm">Guías rápidas para dominar TherapistOS</p>
                    </div>
                </div>

                {/* Chapters Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {CHAPTERS.map((chapter) => (
                        <Link
                            key={chapter.slug}
                            href={`/settings/help/${chapter.slug}`}
                            className="group p-5 bg-card rounded-xl border border-border hover:border-teal-300 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{chapter.icon}</span>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground group-hover:text-teal-600 transition-colors">
                                        {chapter.title}
                                    </h3>
                                    <p className="text-sm text-foreground/60">{chapter.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-500 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* AI ChatBot */}
            <HelpChatBot />
        </div>
    );
}
