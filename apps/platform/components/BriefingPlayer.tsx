'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles, RefreshCw, X } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

interface BriefingData {
    audio_url: string | null;
    text_script: string;
    generated_at: string;
    cached: boolean;
}

interface BriefingPlayerProps {
    compact?: boolean; // For sidebar display
}

export default function BriefingPlayer({ compact = false }: BriefingPlayerProps) {
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { dismissCard, isCardDismissed, _checkAndClearDaily } = useUIStore();
    const CARD_ID = 'dashboard_briefing';

    useEffect(() => {
        _checkAndClearDaily();
        loadBriefing();
    }, []);

    async function loadBriefing() {
        if (!briefing) setLoading(true);
        else setIsRegenerating(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/insights/daily-briefing`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setBriefing(data);
            } else if (res.status === 401) {
                setBriefing(null);
            } else {
                setError('No se pudo cargar el briefing');
            }
        } catch (err) {
            console.error('Failed to load briefing:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
            setIsRegenerating(false);
        }
    }

    const handlePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(pct || 0);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const handleDismiss = () => {
        setIsDismissing(true);
        setTimeout(() => {
            dismissCard(CARD_ID, 'daily');
        }, 500);
    };

    if (isCardDismissed(CARD_ID)) return null;

    const hasAudio = !!briefing?.audio_url && briefing?.audio_url !== 'null';
    const showCard = !!briefing && !loading && !isDismissing;

    // ============ FULL MODE (Dashboard) ============
    return (
        <div
            className={`
                grid transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${!showCard ? 'grid-rows-[0fr] opacity-0 mb-0 mt-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100 mb-4 mt-2'}
            `}
        >
            <div className="overflow-hidden">
                <div className="group relative bg-card border border-brand/30 rounded-2xl overflow-hidden shadow-lg">
                    {/* Dismiss Button - "The Flow" Hidden until hover */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-2 rounded-full bg-foreground/5 hover:bg-destructive/10 text-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Cerrar resumen"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Main Content Section */}
                    <div className="p-4">
                        <div className="flex items-center gap-4">
                            {/* Compact Play Button - slightly XXL but balanced */}
                            {hasAudio ? (
                                <button
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center shadow-lg hover:scale-105 hover:bg-brand/20 transition-all border border-brand/20 shrink-0"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-8 h-8 text-brand" />
                                    ) : (
                                        <Play className="w-8 h-8 text-brand ml-1" />
                                    )}
                                </button>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-card/20 flex items-center justify-center shrink-0">
                                    <Volume2 className="w-8 h-8 text-foreground/60" />
                                </div>
                            )}

                            {/* Title & Stats */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 truncate">
                                    <Sparkles className="w-4 h-4 text-ai" />
                                    Tu Resumen Diario
                                </h3>

                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-brand/50 uppercase font-medium tracking-widest bg-brand/5 px-1.5 rounded">
                                        Intelligence
                                    </span>
                                    <button
                                        onClick={loadBriefing}
                                        disabled={isRegenerating}
                                        className="p-1 rounded-md hover:bg-card/20 transition-colors disabled:opacity-50"
                                        title="Regenerar"
                                    >
                                        <RefreshCw className={`w-3 h-3 text-muted-foreground ${isRegenerating ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Audio Progress Bar - Pure CSS transition */}
                        {hasAudio && (
                            <div className="mt-3">
                                <div className="h-1 bg-brand/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand rounded-full transition-all duration-200"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transcript - Integrated & Tight */}
                    <div className="border-t border-border/40 px-4 py-3 bg-muted/20">
                        {briefing && (
                            <div className="text-foreground/90 text-[13px] leading-relaxed italic line-clamp-3 hover:line-clamp-none transition-all cursor-default selection:bg-brand/20">
                                "{briefing.text_script}"
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                AletheIA Intelligence • {briefing ? new Date(briefing.generated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '...'}
                            </p>
                            <span className="text-[9px] text-brand/60 uppercase font-bold tracking-widest">
                                Daily Protocol
                            </span>
                        </div>
                    </div>

                    {/* Hidden Audio Element */}
                    {hasAudio && (
                        <audio
                            ref={audioRef}
                            src={`${API_URL.replace('/api/v1', '')}${briefing.audio_url}`}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
