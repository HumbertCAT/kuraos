'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, Monitor, AlertTriangle, Square, Circle } from 'lucide-react';

type RecordingMode = 'voice' | 'meeting';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    disabled?: boolean;
}

export default function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
    const t = useTranslations('ClinicalJournal');
    const [mode, setMode] = useState<RecordingMode>('voice');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showModeSelector, setShowModeSelector] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // For cleanup: store all streams to stop them later
    const streamsRef = useRef<MediaStream[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const isRecordingRef = useRef(false);  // Ref to avoid stale closure

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowModeSelector(false);
            }
        }

        if (showModeSelector) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModeSelector]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !navigator.mediaDevices) {
            setHasPermission(false);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            cleanupStreams();
        };
    }, []);

    function cleanupStreams() {
        // Stop all tracks from all streams
        streamsRef.current.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        streamsRef.current = [];

        // Close AudioContext if exists
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }

    async function startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);
            streamsRef.current = [stream];

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                cleanupStreams();
            };

            mediaRecorder.start();
            setIsRecording(true);
            isRecordingRef.current = true;
            setRecordingTime(0);
            startTimer();

        } catch (err) {
            console.error('Failed to start voice recording:', err);
            setHasPermission(false);
        }
    }

    async function startMeetingRecording() {
        try {
            // Get system audio (from browser tab) - video:true is required to get audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            // Check if we actually got audio
            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length === 0) {
                alert('⚠️ No se detectó audio de la pestaña. Asegúrate de marcar "Compartir audio de la pestaña" al seleccionar la ventana.');
                displayStream.getTracks().forEach(track => track.stop());
                return;
            }

            // Get microphone audio
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setHasPermission(true);
            streamsRef.current = [displayStream, micStream];

            // Create AudioContext to mix both streams
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            // Create sources for both streams
            const systemSource = audioContext.createMediaStreamSource(displayStream);
            const micSource = audioContext.createMediaStreamSource(micStream);

            // Create destination to mix audio
            const destination = audioContext.createMediaStreamDestination();

            // Connect both sources to destination
            systemSource.connect(destination);
            micSource.connect(destination);

            // Create MediaRecorder with the mixed audio stream only (no video!)
            const mixedStream = destination.stream;
            const mediaRecorder = new MediaRecorder(mixedStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                cleanupStreams();
            };

            // Stop recording if display sharing is ended by user
            displayStream.getVideoTracks()[0].onended = () => {
                if (isRecordingRef.current) {
                    stopRecording();
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            isRecordingRef.current = true;
            setRecordingTime(0);
            startTimer();

        } catch (err) {
            console.error('Failed to start meeting recording:', err);
            if ((err as Error).name === 'NotAllowedError') {
                // User cancelled the screen share dialog
                return;
            }
            setHasPermission(false);
        }
    }

    function startTimer() {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    }

    function startRecording() {
        setShowModeSelector(false);
        if (mode === 'voice') {
            startVoiceRecording();
        } else {
            startMeetingRecording();
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            isRecordingRef.current = false;

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (hasPermission === false) {
        return (
            <button
                disabled
                className="px-4 py-2 border border-zinc-700 rounded-lg opacity-50 text-zinc-500 cursor-not-allowed flex items-center gap-2"
                title={t('micNotAvailable')}
            >
                <Mic className="w-4 h-4" />
                {t('recordAudio')}
            </button>
        );
    }

    if (isRecording) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-2"
                >
                    <Square className="w-4 h-4 fill-current" />
                    {t('stopRecording')} ({formatTime(recordingTime)})
                </button>
                {mode === 'meeting' && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        Reunión
                    </span>
                )}
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Main Record Button */}
            <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                disabled={disabled}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
                {mode === 'voice' ? (
                    <Mic className="w-4 h-4" />
                ) : (
                    <Monitor className="w-4 h-4" />
                )}
                {t('recordAudio')}
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Mode Selector Dropdown */}
            {showModeSelector && (
                <div ref={dropdownRef} className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Voice Note Mode */}
                    <button
                        onClick={() => { setMode('voice'); startRecording(); }}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors text-left ${mode === 'voice' ? 'bg-emerald-500/10' : ''}`}
                    >
                        <div className={`p-2 rounded-lg ${mode === 'voice' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-foreground/70'}`}>
                            <Mic className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">🎙️ Nota de Voz</p>
                            <p className="text-xs text-foreground/60">Solo micrófono</p>
                        </div>
                    </button>

                    <div className="border-t border-border" />

                    {/* Meeting Mode */}
                    <button
                        onClick={() => { setMode('meeting'); startRecording(); }}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors text-left ${mode === 'meeting' ? 'bg-ai/10' : ''}`}
                    >
                        <div className={`p-2 rounded-lg ${mode === 'meeting' ? 'bg-ai/20 text-ai' : 'bg-zinc-800 text-foreground/70'}`}>
                            <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">💻 Grabar Reunión</p>
                            <p className="text-xs text-foreground/60">Sistema + Micrófono (Zoom, Meet...)</p>
                        </div>
                    </button>

                    {/* Warning for Meeting Mode */}
                    <div className="border-t border-border px-4 py-3 bg-amber-500/10">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-400">
                                <strong>Importante:</strong> Al seleccionar la ventana, marca la casilla{' '}
                                <span className="font-semibold">"Compartir audio de la pestaña"</span>{' '}
                                o el audio de la reunión no se grabará.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
