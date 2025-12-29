'use client';

import { useState } from 'react';
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    MessageCircle,
    Lightbulb,
    Calendar,
    Mic,
    MessageSquare,
    Play,
    Pause
} from 'lucide-react';

interface DailyAnalysis {
    id: string;
    date: string;
    summary: string;
    sentiment_score: number;
    emotional_state: string | null;
    risk_flags: string[];
    suggestion: string | null;
    message_count: number;
}

interface Message {
    id: string;
    direction: string;
    content: string;
    timestamp: string;
    status: string;
}

interface DailyInsightsFeedProps {
    analyses: DailyAnalysis[];
    messages?: Message[];
}

// Compact Audio Badge (visible in collapsed state)
function AudioBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium border border-violet-200">
            <Mic className="w-3 h-3" />
            Audio
        </span>
    );
}

// Full Audio Player for expanded view
function FullAudioPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-200">
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center hover:bg-violet-600 transition-colors shadow-md"
            >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            {/* Waveform */}
            <div className="flex-1 flex items-center gap-0.5 h-8">
                {[3, 5, 8, 4, 7, 5, 6, 9, 4, 6, 8, 5, 3, 7, 5, 4, 6, 8, 5, 3, 6, 4, 7, 5, 8, 4, 3, 6, 5, 4].map((height, i) => (
                    <div
                        key={i}
                        className={`flex-1 max-w-1 rounded-full transition-all ${isPlaying ? 'bg-violet-500 animate-pulse' : 'bg-violet-300'}`}
                        style={{ height: `${height * 3}px` }}
                    />
                ))}
            </div>
            <span className="text-xs text-violet-600 font-mono">0:00 / 0:32</span>
        </div>
    );
}

export default function DailyInsightsFeed({ analyses, messages = [] }: DailyInsightsFeedProps) {
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Get sentiment badge styling - HIGH CONTRAST
    const getSentimentBadge = (score: number, state: string | null) => {
        const label = state || 'Neutro';
        if (score >= 0.3) {
            return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">{label}</span>;
        }
        if (score <= -0.3) {
            return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold border border-red-200">{label}</span>;
        }
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">{label}</span>;
    };

    // Get messages for a specific day
    const getMessagesForDay = (dateStr: string) => {
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        return messages.filter(m => {
            const msgDate = new Date(m.timestamp);
            return msgDate >= dayStart && msgDate <= dayEnd;
        }).sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    };

    // Check if a day has audio messages
    const dayHasAudio = (dayMessages: Message[]) => {
        return dayMessages.some(m =>
            m.content?.includes('[🎤 AUDIO]') || m.content?.includes('[🎤 AUDIO')
        );
    };

    // Check if message is audio
    const isAudioMessage = (content: string) => {
        return content?.includes('[🎤 AUDIO]') || content?.includes('[🎤 AUDIO');
    };

    // Extract transcription text from audio message
    const getTranscriptionText = (content: string) => {
        if (content.includes('[🎤 AUDIO]:')) {
            return content.replace('[🎤 AUDIO]:', '').trim();
        }
        return content;
    };

    if (analyses.length === 0) {
        return (
            <div className="bg-slate-50 rounded-xl p-8 text-center border border-border">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-foreground/70 font-medium">Sin análisis de conversación</p>
                <p className="text-foreground/60 text-sm mt-1">Los análisis aparecerán cuando haya mensajes de WhatsApp</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Análisis Diarios</h3>
                <span className="text-sm text-foreground/60">{analyses.length} días</span>
            </div>

            <div className="space-y-3">
                {analyses.map((analysis) => {
                    const dayMessages = getMessagesForDay(analysis.date);
                    const isExpanded = expandedDay === analysis.id;
                    const hasRisk = analysis.risk_flags.length > 0;
                    const hasAudio = dayHasAudio(dayMessages);

                    return (
                        <div
                            key={analysis.id}
                            className={`rounded-xl overflow-hidden transition-all border ${hasRisk
                                ? 'bg-red-50 border-l-4 border-l-red-500 border-red-200'
                                : 'bg-card border-border hover:border-slate-300 hover:shadow-sm'
                                }`}
                        >
                            {/* Header - Collapsed View */}
                            <button
                                onClick={() => setExpandedDay(isExpanded ? null : analysis.id)}
                                className={`w-full p-4 flex items-center gap-4 text-left transition-colors cursor-pointer ${hasRisk ? 'hover:bg-red-100/50 dark:hover:bg-red-900/30' : 'hover:bg-muted/50'
                                    }`}
                            >
                                {/* Source Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasRisk
                                    ? 'bg-red-100'
                                    : hasAudio
                                        ? 'bg-violet-100'
                                        : 'bg-slate-100'
                                    }`}>
                                    {hasRisk ? (
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    ) : hasAudio ? (
                                        <Mic className="w-5 h-5 text-violet-600" />
                                    ) : (
                                        <MessageSquare className="w-5 h-5 text-foreground/60" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-foreground">
                                            {new Date(analysis.date).toLocaleDateString('es-ES', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </span>
                                        {getSentimentBadge(analysis.sentiment_score, analysis.emotional_state)}
                                        {hasAudio && <AudioBadge />}
                                    </div>

                                    {/* Risk flags */}
                                    {hasRisk && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {analysis.risk_flags.map((flag, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-200"
                                                >
                                                    ⚠️ {flag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Expand Button - VISIBLE */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-foreground/60">{analysis.message_count} msgs</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'bg-muted text-foreground/60 hover:bg-muted/80'
                                        }`}>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5" />
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className={`border-t p-4 space-y-4 ${hasRisk ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20' : 'border-border bg-muted/30'}`}>

                                    {/* AI Summary */}
                                    <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {analysis.summary}
                                        </p>
                                    </div>

                                    {/* Suggestion */}
                                    {analysis.suggestion && (
                                        <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-xl border border-violet-200">
                                            <Lightbulb className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-violet-800 mb-1">Sugerencia AletheIA</p>
                                                <p className="text-sm text-violet-700 leading-relaxed">{analysis.suggestion}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Messages/Transcription */}
                                    {dayMessages.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-foreground/60 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                                <MessageCircle className="w-4 h-4" />
                                                Conversación del día
                                            </p>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {dayMessages.map((msg) => {
                                                    const isAudio = isAudioMessage(msg.content);
                                                    const transcription = getTranscriptionText(msg.content);

                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`p-3 rounded-xl text-sm ${msg.direction === 'INBOUND'
                                                                ? 'bg-card border border-border mr-8 shadow-sm'
                                                                : 'bg-violet-100 text-violet-900 ml-8 border border-violet-200'
                                                                }`}
                                                        >
                                                            {/* Audio with player */}
                                                            {isAudio && msg.direction === 'INBOUND' && (
                                                                <div className="mb-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1 font-medium">
                                                                            <Mic className="w-3 h-3" />
                                                                            Transcripción (Whisper AI)
                                                                        </span>
                                                                    </div>
                                                                    <FullAudioPlayer />
                                                                </div>
                                                            )}

                                                            <p className="text-slate-700 leading-relaxed">
                                                                {isAudio ? transcription : msg.content}
                                                            </p>

                                                            <p className="text-xs text-slate-400 mt-2">
                                                                {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
