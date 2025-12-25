'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_ACTIONS = [
    '¿Cómo creo una nueva ficha?',
    '¿Cómo conecto WhatsApp?',
    '¿Cómo grabo una nota de voz?',
];

const STORAGE_KEY = 'therapistos_help_chat_history';

export default function HelpChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { user } = useAuth();

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Save history to localStorage on change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); // Keep last 20
        }
    }, [messages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageText = text || input.trim();
        if (!messageText || isLoading) return;

        // Add user message
        const newMessages: Message[] = [...messages, { role: 'user', content: messageText }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.help.chat(
                messageText,
                pathname,
                newMessages.slice(-6) // Send last 6 messages as context
            );

            setMessages([...newMessages, { role: 'assistant', content: response.response }]);
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: 'assistant', content: 'Lo siento, hubo un error. Por favor, intenta de nuevo.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const userName = user?.full_name?.split(' ')[0] || 'Usuario';

    return (
        <>
            {/* Floating Button - hidden on mobile, visible on tablet+desktop */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="hidden md:flex fixed bottom-6 right-6 p-4 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-50"
                title="Ayuda IA"
            >
                <MessageCircle className="w-6 h-6" />
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-teal-200 z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <span className="font-semibold">Ayuda IA</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-card/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {/* Welcome Message (always shown first) */}
                        <div className="bg-teal-50 p-4 rounded-xl">
                            <p className="text-slate-700">
                                👋 <strong>¡Hola {userName}!</strong> Soy tu asistente de KuraOS. ¿En qué puedo ayudarte hoy?
                            </p>
                        </div>

                        {/* Quick Actions (only if no messages) */}
                        {messages.length === 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-foreground/60 uppercase font-medium">Preguntas frecuentes:</p>
                                {QUICK_ACTIONS.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(action)}
                                        className="w-full text-left p-3 bg-slate-50 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Chat History */}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user'
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 p-3 rounded-xl flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                    <span className="text-sm text-foreground/60">Pensando...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-foreground"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
