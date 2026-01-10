'use client';

import { Check, Clock, AlertTriangle } from 'lucide-react';
import { ChatAudioPlayer } from './ChatAudioPlayer';

interface Message {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    status: string;
    timestamp: string;
    media_url?: string;
    mime_type?: string;
}

interface ChatBubbleProps {
    message: Message;
    onApprove?: (messageId: string) => void;
}

/**
 * Chat bubble component with WhatsApp-like design.
 * Features: Direction-based styling, status ticks, audio player, safety shield.
 */
export function ChatBubble({ message, onApprove }: ChatBubbleProps) {
    const isOutbound = message.direction === 'OUTBOUND';
    const isAudio = message.mime_type?.startsWith('audio');
    const isBlocked = message.status === 'BLOCKED' || message.status === 'BLOCKED_SAFETY';
    const isSending = message.status === 'sending';
    const isSent = message.status === 'sent' || message.status === 'RECEIVED';

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}
        >
            <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isBlocked
                        ? 'bg-risk/10 border-2 border-risk'
                        : isOutbound
                            ? 'bg-brand text-white rounded-br-sm'
                            : 'bg-card border border-border rounded-bl-sm'
                    }`}
            >
                {/* Audio content */}
                {isAudio && message.media_url ? (
                    <ChatAudioPlayer src={message.media_url} className="min-w-[200px]" />
                ) : (
                    /* Text content */
                    <p className={`text-sm whitespace-pre-wrap ${isOutbound && !isBlocked ? 'text-white' : 'text-foreground'}`}>
                        {message.content}
                    </p>
                )}

                {/* Blocked warning */}
                {isBlocked && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-risk/30">
                        <AlertTriangle className="w-4 h-4 text-risk" />
                        <span className="text-xs text-risk">Bloqueado por Seguridad</span>
                        {onApprove && (
                            <button
                                onClick={() => onApprove(message.id)}
                                className="ml-auto text-xs bg-risk text-white px-2 py-1 rounded hover:bg-risk/90 active:scale-95 transition-all"
                            >
                                Forzar Envío
                            </button>
                        )}
                    </div>
                )}

                {/* Metadata: Time + Ticks */}
                <div className={`flex items-center gap-1 mt-1 ${isOutbound && !isBlocked ? 'justify-end' : ''}`}>
                    <span className={`text-[10px] ${isOutbound && !isBlocked ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                    </span>

                    {/* Status ticks (only for outbound) */}
                    {isOutbound && (
                        <span className={`flex items-center ${isBlocked ? 'text-risk' : 'text-white/70'}`}>
                            {isSending && <Clock className="w-3 h-3" />}
                            {isSent && <Check className="w-3 h-3" />}
                            {message.status === 'read' && (
                                <span className="flex">
                                    <Check className="w-3 h-3 text-blue-400" />
                                    <Check className="w-3 h-3 text-blue-400 -ml-1.5" />
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
