'use client';

import { useState, useEffect } from 'react';
import { Trophy, CheckCircle, ArrowRight, Flag, Lock } from 'lucide-react';
import { useTour } from '@/hooks/useTour';
import { triggerSuccess } from '@/lib/confetti';
import { useRouter } from '@/i18n/navigation';

export function ActivationWidget() {
    const [stage, setStage] = useState(0);
    const { startTour } = useTour();
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('kura_onboarding_stage');
        if (stored) {
            setStage(parseInt(stored));
        }
    }, []);

    const handleStartMission = () => {
        if (stage === 0) {
            // Route to patients page then start tour (handled by tour logic or page load)
            // Actually, driver.js can handle routing if we configure it, but for now
            // let's route manually and assuming the tour hook is present there or global.
            // Wait, the hook `useTour` needs to be called on the page where elements exist.
            // Strategy: This widget is on Dashboard. Sidebar is visible.
            // Step 1 highlights Sidebar.
            startTour();
        }
    };

    const handleComplete = () => {
        // Just for testing/demo manually triggering completion if needed
        // Real completion should happen when user actually creates patient
    };

    // Listen for completion event (custom event)
    useEffect(() => {
        const handleMissionComplete = () => {
            setStage(1);
            localStorage.setItem('kura_onboarding_stage', '1');
            triggerSuccess();
        };

        window.addEventListener('kura_mission_complete', handleMissionComplete);
        return () => window.removeEventListener('kura_mission_complete', handleMissionComplete);
    }, []);


    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden group">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-emerald-500/20" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stage > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-lg text-white">Tu Viaje en Kura OS</h3>
                            <p className="text-xs text-slate-400 font-mono">NIVEL {stage + 1} DE 4</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-emerald-400">{stage}/4</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-800 rounded-full w-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
                        style={{ width: `${(stage / 4) * 100}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                    </div>
                </div>

                {/* Missions List */}
                <div className="space-y-3">
                    {/* Mission 1 */}
                    <div className={`p-3 rounded-xl border transition-all ${stage > 0
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : stage === 0
                                ? 'bg-slate-800/50 border-emerald-500/50 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]'
                                : 'bg-slate-800/30 border-slate-800'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {stage > 0 ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 animate-pulse" />
                                )}
                                <div>
                                    <p className={`text-sm font-medium ${stage > 0 ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                        Primeros Pasos
                                    </p>
                                    <p className="text-xs text-slate-500">Crea tu primer expediente</p>
                                </div>
                            </div>
                            {stage === 0 && (
                                <button
                                    onClick={handleStartMission}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    Iniciar <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mission 2 (Locked) */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-800/20 opacity-60">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-slate-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Diario Clínico</p>
                                    <p className="text-xs text-slate-600">Registra una sesión</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
