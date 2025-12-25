'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        loadBriefing();
    }, []);

    async function loadBriefing() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/insights/daily-briefing`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setBriefing(data);
            } else if (res.status === 401) {
                // Not logged in - hide component
                setBriefing(null);
            } else {
                setError('No se pudo cargar el briefing');
            }
        } catch (err) {
            console.error('Failed to load briefing:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }

    function handlePlayPause() {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }

    function handleTimeUpdate() {
        if (!audioRef.current) return;
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(pct || 0);
    }

    function handleEnded() {
        setIsPlaying(false);
        setProgress(0);
    }

    // Loading state
    if (loading) {
        return (
            <div className="bg-card border border-brand/30 rounded-2xl p-6 text-foreground">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-card/20 flex items-center justify-center animate-pulse">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-card/30 rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-card/20 rounded w-32 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error or no briefing - show error for debugging
    if (error || !briefing) {
        return (
            <div className="bg-card border border-brand/30 rounded-2xl p-6 text-foreground">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-card/20 flex items-center justify-center">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">Tu Resumen Diario</h3>
                        <p className="text-sm text-foreground/80">
                            {error || 'Cargando...'}
                        </p>
                    </div>
                    <button
                        onClick={loadBriefing}
                        className="p-2 rounded-lg bg-card/10 hover:bg-card/20 transition-colors"
                        title="Reintentar"
                    >
                        <RefreshCw className="w-4 h-4 text-foreground" />
                    </button>
                </div>
            </div>
        );
    }

    const hasAudio = briefing.audio_url && briefing.audio_url !== 'null' && briefing.audio_url.length > 0;

    // ============ COMPACT MODE (Sidebar) ============
    if (compact) {
        return (
            <div className="bg-card p-3">
                <div className="flex items-center gap-3">
                    {/* Compact Play Button */}
                    {hasAudio ? (
                        <button
                            onClick={handlePlayPause}
                            className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center hover:bg-brand/20 transition-colors flex-shrink-0"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-brand" />
                            ) : (
                                <Play className="w-4 h-4 text-brand ml-0.5" />
                            )}
                        </button>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                    )}

                    {/* Title & Status */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Tu Resumen Diario
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {hasAudio ? (
                                isPlaying ? '🎙️ Reproduciendo...' : '▶️ Escucha tu briefing'
                            ) : (
                                '📝 Solo texto'
                            )}
                        </p>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={loadBriefing}
                        className="p-1.5 rounded hover:bg-muted transition-colors flex-shrink-0"
                        title="Regenerar"
                    >
                        <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    </button>
                </div>

                {/* Compact Progress Bar */}
                {hasAudio && (
                    <div className="mt-2">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Compact Transcript Toggle */}
                <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full mt-2 flex items-center justify-between text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span>{showTranscript ? 'Ocultar' : 'Ver transcripción'}</span>
                    {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTranscript && (
                    <div className="mt-2 p-2 bg-muted rounded text-[10px] text-foreground leading-relaxed max-h-32 overflow-y-auto">
                        {briefing.text_script}
                    </div>
                )}

                {/* Hidden Audio Element */}
                {hasAudio && (
                    <audio
                        ref={audioRef}
                        src={`${API_URL.replace('/api/v1', '')}${briefing.audio_url}`}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                )}
            </div>
        );
    }

    // ============ FULL MODE (Dashboard) ============
    return (
        <div className="bg-card border border-brand/30 rounded-2xl overflow-hidden shadow-lg">
            {/* Main Player Section */}
            <div className="p-6">
                <div className="flex items-center gap-4">
                    {/* Play Button */}
                    {hasAudio ? (
                        <button
                            onClick={handlePlayPause}
                            className="w-14 h-14 rounded-xl bg-card flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-7 h-7 text-brand" />
                            ) : (
                                <Play className="w-7 h-7 text-brand ml-1" />
                            )}
                        </button>
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-card/20 flex items-center justify-center">
                            <Volume2 className="w-7 h-7 text-foreground/60" />
                        </div>
                    )}

                    {/* Title & Status */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Tu Resumen Diario
                        </h3>
                        <p className="text-sm text-foreground/80">
                            {hasAudio ? (
                                isPlaying ? '🎙️ Reproduciendo...' : '▶️ Escucha tu briefing'
                            ) : (
                                '📝 Solo texto disponible'
                            )}
                        </p>
                    </div>

                    {/* Time/Refresh */}
                    <div className="flex items-center gap-2">
                        {briefing.cached && (
                            <span className="text-xs text-foreground/60 bg-card/10 px-2 py-1 rounded">
                                En caché
                            </span>
                        )}
                        <button
                            onClick={loadBriefing}
                            className="p-2 rounded-lg bg-card/10 hover:bg-card/20 transition-colors"
                            title="Regenerar"
                        >
                            <RefreshCw className="w-4 h-4 text-foreground" />
                        </button>
                    </div>
                </div>

                {/* Audio Progress Bar */}
                {hasAudio && (
                    <div className="mt-4">
                        <div className="h-1.5 bg-card/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-card rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Waveform Visualization (Fake animated bars) */}
                {isPlaying && (
                    <div className="flex items-center justify-center gap-1 mt-4 h-8">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-card/60 rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 50}ms`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Transcript Accordion */}
            <div className="border-t border-white/10">
                <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full px-6 py-3 flex items-center justify-between text-foreground/80 hover:bg-card/5 transition-colors"
                >
                    <span className="text-sm font-medium">
                        {showTranscript ? 'Ocultar transcripción' : 'Ver transcripción'}
                    </span>
                    {showTranscript ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>

                {showTranscript && (
                    <div className="px-6 pb-6">
                        <div className="p-4 bg-card/10 rounded-xl text-foreground/90 text-sm leading-relaxed">
                            {briefing.text_script}
                        </div>
                        <p className="text-xs text-foreground/50 mt-2">
                            Generado: {new Date(briefing.generated_at).toLocaleString('es-ES')}
                        </p>
                    </div>
                )}
            </div>

            {/* Hidden Audio Element */}
            {hasAudio && (
                <audio
                    ref={audioRef}
                    src={`${API_URL.replace('/api/v1', '')}${briefing.audio_url}`}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}
        </div>
    );
}
