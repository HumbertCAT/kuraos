'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ChatBubble } from './ChatBubble';

interface Message {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    status: string;
    timestamp: string;
    media_url?: string;
    mime_type?: string;
}

interface ChatWidgetProps {
    identityId: string;
    patientId?: string;
    className?: string;
}

/**
 * Connect Chat Widget - WhatsApp-like messaging interface.
 * Features: Optimistic UI, window status, auto-scroll, safety shield.
 */
export function ChatWidget({ identityId, patientId, className = '' }: ChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [windowStatus, setWindowStatus] = useState<'OPEN' | 'CLOSED' | 'UNKNOWN'>('UNKNOWN');
    const [unreadCount, setUnreadCount] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load messages
    const loadMessages = async () => {
        try {
            setError(null);
            const data = await api.connect.getHistory(identityId);
            setMessages(data.messages);
            setWindowStatus(data.window_status);
            setUnreadCount(data.unread_count);
        } catch (err: any) {
            setError(err.message || 'Error al cargar mensajes');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load + polling
    useEffect(() => {
        loadMessages();

        // Poll every 5 seconds for new messages
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [identityId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message with Optimistic UI
    const handleSend = async () => {
        if (!inputValue.trim() || !patientId || windowStatus === 'CLOSED') return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            direction: 'OUTBOUND',
            content: inputValue.trim(),
            status: 'sending',
            timestamp: new Date().toISOString(),
        };

        // Add optimistically
        setMessages(prev => [...prev, optimisticMessage]);
        setInputValue('');
        setIsSending(true);

        try {
            const result = await api.connect.sendMessage({
                patient_id: patientId,
                message: optimisticMessage.content,
                auto_mode: false, // Draft mode by default
            });

            // Update message status
            setMessages(prev =>
                prev.map(m =>
                    m.id === tempId
                        ? {
                            ...m,
                            id: result.message_id || tempId,
                            status: result.sent ? 'sent' : result.draft_saved ? 'BLOCKED' : 'error',
                        }
                        : m
                )
            );
        } catch (err: any) {
            // Mark as error
            setMessages(prev =>
                prev.map(m =>
                    m.id === tempId ? { ...m, status: 'error' } : m
                )
            );
            setError(err.message || 'Error al enviar mensaje');
        } finally {
            setIsSending(false);
        }
    };

    // Handle Enter key (Shift+Enter for newline)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Force approve blocked message
    const handleApprove = async (messageId: string) => {
        // TODO: Implement force send endpoint
        console.log('Force approve:', messageId);
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-96 ${className}`}>
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-96 bg-muted/30 rounded-lg overflow-hidden ${className}`}>
            {/* Window Status Banner */}
            {windowStatus === 'CLOSED' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    <span className="text-xs text-warning">
                        Ventana de 24h cerrada. Espera respuesta del paciente.
                    </span>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No hay mensajes aún
                    </div>
                ) : (
                    <>
                        {messages.map(message => (
                            <ChatBubble
                                key={message.id}
                                message={message}
                                onApprove={handleApprove}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-2 bg-risk/10 border-t border-risk/30 text-xs text-risk">
                    {error}
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border bg-card p-3">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            windowStatus === 'CLOSED'
                                ? 'Ventana cerrada...'
                                : 'Escribe un mensaje...'
                        }
                        disabled={windowStatus === 'CLOSED' || isSending}
                        className="flex-1 resize-none bg-muted/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] max-h-[120px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || windowStatus === 'CLOSED' || isSending}
                        className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white hover:bg-brand/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
